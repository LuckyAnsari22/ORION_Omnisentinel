import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as tf from '@tensorflow/tfjs';

export class FallPredictor {
    constructor() {
        this.poseLandmarker = null;
        this.poseHistory = [];
        this.HISTORY_LENGTH = 90; // 3 seconds at 30fps
        this.model = null;
        this.lastVideoTime = -1;
        this.startTime = performance.now();
    }

    async initialize() {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );

            this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                    delegate: 'GPU',
                },
                runningMode: 'VIDEO',
                numPoses: 1,
            });

            // Create a simple LSTM model for fall prediction
            this.model = this.createModel();

            console.log('Fall predictor initialized');
        } catch (error) {
            console.error('Failed to initialize fall predictor:', error);
        }
    }

    createModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.lstm({
                    units: 128,
                    returnSequences: true,
                    inputShape: [this.HISTORY_LENGTH, 99], // 33 landmarks × 3 coordinates
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.lstm({
                    units: 64,
                    returnSequences: false,
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 1, activation: 'sigmoid' }), // Fall probability
            ],
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy'],
        });

        return model;
    }

    async detectPose(video) {
        if (!this.poseLandmarker) return null;

        // Use video's current time in milliseconds for MediaPipe
        // MediaPipe requires timestamps to start from 1, not 0
        const videoTimeMs = Math.floor(video.currentTime * 1000) + 1;

        // Skip if we've already processed this frame
        if (videoTimeMs === this.lastVideoTime) {
            return null;
        }

        this.lastVideoTime = videoTimeMs;

        const result = await this.poseLandmarker.detectForVideo(video, videoTimeMs);

        if (result.landmarks && result.landmarks.length > 0) {
            const landmarks = result.landmarks[0].map(lm => [lm.x, lm.y, lm.z]);
            const poseData = {
                landmarks,
                timestamp: performance.now() - this.startTime,
            };

            this.poseHistory.push(poseData);
            if (this.poseHistory.length > this.HISTORY_LENGTH) {
                this.poseHistory.shift();
            }

            return poseData;
        }

        return null;
    }

    async predictFall() {
        if (this.poseHistory.length < this.HISTORY_LENGTH || !this.model) {
            return {
                probability: 0,
                riskLevel: 'safe',
                timeToFall: 30,
                factors: [],
            };
        }

        // Extract features from pose history
        const features = this.extractFeatures();

        // Get model prediction
        const tensor = tf.tensor3d([features], [1, this.HISTORY_LENGTH, 99]);
        const prediction = this.model.predict(tensor);
        const probability = (await prediction.data())[0] * 100;

        tensor.dispose();
        prediction.dispose();

        // Analyze risk factors
        const factors = this.analyzeRiskFactors();

        // Determine risk level
        let riskLevel;
        let timeToFall;

        if (probability < 40) {
            riskLevel = 'safe';
            timeToFall = 30;
        } else if (probability < 60) {
            riskLevel = 'warning';
            timeToFall = 25;
        } else if (probability < 80) {
            riskLevel = 'alert';
            timeToFall = 15;
        } else {
            riskLevel = 'critical';
            timeToFall = 5;
        }

        return {
            probability,
            riskLevel,
            timeToFall,
            factors,
        };
    }

    extractFeatures() {
        return this.poseHistory.map(pose => {
            return pose.landmarks.flat();
        });
    }

    analyzeRiskFactors() {
        const factors = [];

        if (this.poseHistory.length < 2) return factors;

        const latest = this.poseHistory[this.poseHistory.length - 1];
        const previous = this.poseHistory[this.poseHistory.length - 2];

        // Calculate center of mass (average of hip landmarks)
        const latestCOM = this.getCenterOfMass(latest.landmarks);
        const previousCOM = this.getCenterOfMass(previous.landmarks);

        // Check COM displacement
        const comDisplacement = Math.sqrt(
            Math.pow(latestCOM.x - previousCOM.x, 2) +
            Math.pow(latestCOM.y - previousCOM.y, 2)
        );

        if (comDisplacement > 0.05) {
            factors.push('Rapid center of mass shift');
        }

        // Check base of support (distance between feet)
        const baseOfSupport = this.getBaseOfSupport(latest.landmarks);
        if (baseOfSupport < 0.15) {
            factors.push('Narrow base of support');
        }

        // Check trunk angle
        const trunkAngle = this.getTrunkAngle(latest.landmarks);
        if (Math.abs(trunkAngle) > 15) {
            factors.push('Trunk deviation from vertical');
        }

        // Check joint velocities
        const jointVelocity = this.getJointVelocity();
        if (jointVelocity < 0.01) {
            factors.push('Reduced movement (instability)');
        }

        return factors;
    }

    getCenterOfMass(landmarks) {
        // Use hip landmarks (23, 24)
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];

        return {
            x: (leftHip[0] + rightHip[0]) / 2,
            y: (leftHip[1] + rightHip[1]) / 2,
        };
    }

    getBaseOfSupport(landmarks) {
        // Distance between ankles (27, 28)
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        return Math.sqrt(
            Math.pow(leftAnkle[0] - rightAnkle[0], 2) +
            Math.pow(leftAnkle[1] - rightAnkle[1], 2)
        );
    }

    getTrunkAngle(landmarks) {
        // Angle between shoulders and hips
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];

        const shoulderMid = {
            x: (leftShoulder[0] + rightShoulder[0]) / 2,
            y: (leftShoulder[1] + rightShoulder[1]) / 2,
        };

        const hipMid = {
            x: (leftHip[0] + rightHip[0]) / 2,
            y: (leftHip[1] + rightHip[1]) / 2,
        };

        const angle = Math.atan2(shoulderMid.x - hipMid.x, shoulderMid.y - hipMid.y);
        return (angle * 180) / Math.PI;
    }

    getJointVelocity() {
        if (this.poseHistory.length < 2) return 0;

        const latest = this.poseHistory[this.poseHistory.length - 1];
        const previous = this.poseHistory[this.poseHistory.length - 2];
        const timeDelta = (latest.timestamp - previous.timestamp) / 1000; // seconds

        let totalVelocity = 0;
        for (let i = 0; i < latest.landmarks.length; i++) {
            const distance = Math.sqrt(
                Math.pow(latest.landmarks[i][0] - previous.landmarks[i][0], 2) +
                Math.pow(latest.landmarks[i][1] - previous.landmarks[i][1], 2)
            );
            totalVelocity += distance / timeDelta;
        }

        return totalVelocity / latest.landmarks.length;
    }

    getStabilityScore() {
        if (this.poseHistory.length === 0) return 100;

        const latest = this.poseHistory[this.poseHistory.length - 1];

        // Calculate stability based on multiple factors
        const baseOfSupport = this.getBaseOfSupport(latest.landmarks);
        const trunkAngle = this.getTrunkAngle(latest.landmarks);
        const jointVelocity = this.getJointVelocity();

        // Normalize and combine factors
        const baseScore = Math.min(baseOfSupport / 0.3, 1) * 40;
        const angleScore = Math.max(0, 1 - Math.abs(trunkAngle) / 30) * 30;
        const velocityScore = Math.min(jointVelocity / 0.1, 1) * 30;

        return Math.round(baseScore + angleScore + velocityScore);
    }

    dispose() {
        if (this.model) {
            this.model.dispose();
        }
        this.poseHistory = [];
    }
}
