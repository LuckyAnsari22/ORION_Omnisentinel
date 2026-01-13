import * as tf from '@tensorflow/tfjs';
import * as speechCommands from '@tensorflow-models/speech-commands';

export class AudioThreatDetector {
    constructor() {
        this.recognizer = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.isListening = false;
        this.threatHistory = [];
        this.HISTORY_LENGTH = 100;

        // Threat sound patterns (frequency ranges and characteristics)
        this.threatPatterns = {
            glassBreak: { freqRange: [2000, 15000], sharpness: 0.8, duration: [0.1, 0.5] },
            scream: { freqRange: [800, 3000], intensity: 0.7, duration: [0.5, 3] },
            gunshot: { freqRange: [500, 8000], sharpness: 0.95, duration: [0.05, 0.2] },
            alarm: { freqRange: [1000, 4000], repetitive: true, duration: [1, 10] },
            aggressiveVoice: { freqRange: [100, 500], intensity: 0.6, duration: [1, 5] },
            explosion: { freqRange: [20, 10000], intensity: 0.9, duration: [0.1, 1] },
            carCrash: { freqRange: [100, 5000], intensity: 0.8, duration: [0.5, 2] },
            dogBark: { freqRange: [500, 1800], repetitive: true, duration: [0.2, 1] },
        };
    }

    async initialize() {
        try {
            // Initialize TensorFlow.js only if not already ready
            if (!tf.getBackend()) {
                await tf.ready();
            }

            // Create speech command recognizer
            this.recognizer = speechCommands.create('BROWSER_FFT');
            await this.recognizer.ensureModelLoaded();

            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            console.log('SonicGuard initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize SonicGuard:', error);
            return false;
        }
    }

    async startListening(onThreatDetected) {
        if (this.isListening) return;

        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: false, // We want to detect all sounds
                    autoGainControl: false,
                }
            });

            this.microphone = this.audioContext.createMediaStreamSource(stream);

            // Ensure context is running (fixes "not detecting" issues)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.microphone.connect(this.analyser);

            this.isListening = true;

            // Start continuous audio analysis
            this.analyzeAudio(onThreatDetected);

            console.log('SonicGuard listening...');
        } catch (error) {
            console.error('Microphone access denied:', error);
            throw error;
        }
    }

    analyzeAudio(onThreatDetected) {
        if (!this.isListening) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeArray = new Uint8Array(bufferLength);

        const analyze = () => {
            if (!this.isListening) return;

            // Get frequency and time domain data
            this.analyser.getByteFrequencyData(dataArray);
            this.analyser.getByteTimeDomainData(timeArray);

            // Analyze for threats
            const threat = this.detectThreat(dataArray, timeArray);

            if (threat) {
                // Add spatial information
                const spatialData = this.estimateSoundDirection(dataArray);
                threat.direction = spatialData.direction;
                threat.distance = spatialData.distance;

                this.threatHistory.push({
                    ...threat,
                    timestamp: Date.now(),
                });

                if (this.threatHistory.length > this.HISTORY_LENGTH) {
                    this.threatHistory.shift();
                }

                onThreatDetected(threat);
            }

            // Continue analysis
            requestAnimationFrame(analyze);
        };

        analyze();
    }

    detectThreat(frequencyData, timeData) {
        // Calculate audio features
        const features = this.extractFeatures(frequencyData, timeData);

        // Check against threat patterns
        let maxThreatScore = 0;
        let detectedThreat = null;

        for (const [threatType, pattern] of Object.entries(this.threatPatterns)) {
            const score = this.matchPattern(features, pattern);

            if (score > maxThreatScore && score > 0.4) { // Lowered to 40% confidence for demo sensitivity
                maxThreatScore = score;
                detectedThreat = {
                    type: threatType,
                    confidence: score * 100,
                    severity: this.calculateSeverity(threatType, score),
                    features,
                };
            }
        }

        return detectedThreat;
    }

    extractFeatures(frequencyData, timeData) {
        // Calculate various audio features
        const features = {
            // Frequency domain features
            dominantFrequency: this.getDominantFrequency(frequencyData),
            spectralCentroid: this.getSpectralCentroid(frequencyData),
            spectralRolloff: this.getSpectralRolloff(frequencyData),
            spectralFlux: this.getSpectralFlux(frequencyData),

            // Time domain features
            rms: this.getRMS(timeData),
            zeroCrossingRate: this.getZeroCrossingRate(timeData),

            // Energy features
            totalEnergy: this.getTotalEnergy(frequencyData),
            lowFreqEnergy: this.getFrequencyBandEnergy(frequencyData, 0, 500),
            midFreqEnergy: this.getFrequencyBandEnergy(frequencyData, 500, 2000),
            highFreqEnergy: this.getFrequencyBandEnergy(frequencyData, 2000, 20000),
        };

        return features;
    }

    matchPattern(features, pattern) {
        let score = 0;
        let checks = 0;

        // Check frequency range
        if (pattern.freqRange) {
            const [minFreq, maxFreq] = pattern.freqRange;
            if (features.dominantFrequency >= minFreq && features.dominantFrequency <= maxFreq) {
                score += 0.3;
            }
            checks++;
        }

        // Check sharpness (sudden onset)
        if (pattern.sharpness) {
            const sharpness = features.spectralFlux / 100; // Normalize
            if (sharpness >= pattern.sharpness * 0.8) {
                score += 0.3;
            }
            checks++;
        }

        // Check intensity
        if (pattern.intensity) {
            const intensity = features.rms / 128; // Normalize to 0-1
            if (intensity >= pattern.intensity * 0.7) {
                score += 0.2;
            }
            checks++;
        }

        // Check energy distribution
        const energyRatio = features.highFreqEnergy / (features.totalEnergy + 1);
        if (energyRatio > 0.3) {
            score += 0.2;
        }
        checks++;

        return score / checks;
    }

    calculateSeverity(threatType, confidence) {
        const severityMap = {
            gunshot: 'critical',
            explosion: 'critical',
            scream: 'high',
            glassBreak: 'high',
            carCrash: 'high',
            aggressiveVoice: 'medium',
            alarm: 'medium',
            dogBark: 'low',
        };

        const baseSeverity = severityMap[threatType] || 'low';

        // Adjust based on confidence
        if (confidence > 90) return 'critical';
        if (confidence > 75 && baseSeverity === 'high') return 'critical';

        return baseSeverity;
    }

    estimateSoundDirection(frequencyData) {
        // Simplified spatial audio estimation
        // In a real implementation, this would use stereo analysis or multiple mics

        const leftEnergy = this.getFrequencyBandEnergy(frequencyData, 0, frequencyData.length / 2);
        const rightEnergy = this.getFrequencyBandEnergy(frequencyData, frequencyData.length / 2, frequencyData.length);

        const balance = (rightEnergy - leftEnergy) / (rightEnergy + leftEnergy + 1);

        // Convert to angle (0-360 degrees)
        const angle = ((balance + 1) / 2) * 360;

        // Estimate distance based on total energy (inverse square law approximation)
        const totalEnergy = leftEnergy + rightEnergy;
        const distance = Math.max(1, Math.min(50, 50 / (totalEnergy / 1000 + 1)));

        return {
            direction: Math.round(angle),
            distance: Math.round(distance),
        };
    }

    // Feature extraction helper methods
    getDominantFrequency(frequencyData) {
        let maxValue = 0;
        let maxIndex = 0;

        for (let i = 0; i < frequencyData.length; i++) {
            if (frequencyData[i] > maxValue) {
                maxValue = frequencyData[i];
                maxIndex = i;
            }
        }

        // Convert bin index to frequency (assuming 44.1kHz sample rate)
        return (maxIndex * 44100) / (2 * frequencyData.length);
    }

    getSpectralCentroid(frequencyData) {
        let weightedSum = 0;
        let sum = 0;

        for (let i = 0; i < frequencyData.length; i++) {
            weightedSum += i * frequencyData[i];
            sum += frequencyData[i];
        }

        return sum === 0 ? 0 : weightedSum / sum;
    }

    getSpectralRolloff(frequencyData, threshold = 0.85) {
        const totalEnergy = frequencyData.reduce((sum, val) => sum + val, 0);
        const targetEnergy = totalEnergy * threshold;

        let cumulativeEnergy = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            cumulativeEnergy += frequencyData[i];
            if (cumulativeEnergy >= targetEnergy) {
                return i;
            }
        }

        return frequencyData.length - 1;
    }

    getSpectralFlux(frequencyData) {
        if (!this.previousSpectrum) {
            this.previousSpectrum = new Uint8Array(frequencyData);
            return 0;
        }

        let flux = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            const diff = frequencyData[i] - this.previousSpectrum[i];
            flux += diff * diff;
        }

        this.previousSpectrum = new Uint8Array(frequencyData);
        return Math.sqrt(flux);
    }

    getRMS(timeData) {
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
            const normalized = (timeData[i] - 128) / 128;
            sum += normalized * normalized;
        }
        return Math.sqrt(sum / timeData.length) * 128;
    }

    getZeroCrossingRate(timeData) {
        let crossings = 0;
        for (let i = 1; i < timeData.length; i++) {
            if ((timeData[i] >= 128 && timeData[i - 1] < 128) ||
                (timeData[i] < 128 && timeData[i - 1] >= 128)) {
                crossings++;
            }
        }
        return crossings / timeData.length;
    }

    getTotalEnergy(frequencyData) {
        return frequencyData.reduce((sum, val) => sum + val, 0);
    }

    getFrequencyBandEnergy(frequencyData, minFreq, maxFreq) {
        const minBin = Math.floor((minFreq * 2 * frequencyData.length) / 44100);
        const maxBin = Math.floor((maxFreq * 2 * frequencyData.length) / 44100);

        let energy = 0;
        for (let i = minBin; i < Math.min(maxBin, frequencyData.length); i++) {
            energy += frequencyData[i];
        }

        return energy;
    }

    getThreatHistory() {
        return this.threatHistory;
    }

    getAudioLevel() {
        if (!this.analyser) return 0;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128; // Center at 0
            sum += normalized * normalized;
        }

        const rms = Math.sqrt(sum / dataArray.length);
        // Scale up for visibility (RMS is usually small)
        return Math.min(100, rms * 400);
    }

    stopListening() {
        this.isListening = false;

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone.mediaStream.getTracks().forEach(track => track.stop());
            this.microphone = null;
        }

        console.log('SonicGuard stopped listening');
    }

    dispose() {
        this.stopListening();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        if (this.recognizer) {
            this.recognizer = null;
        }

        this.threatHistory = [];
    }
}
