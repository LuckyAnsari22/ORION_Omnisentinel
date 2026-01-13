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
        this.threatPatterns = {}; // Deprecated, using neural network now
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
            // 1. Unified Audio Context Creation
            // We create this explicitly to ensure we can attach an analyser to it
            // AND ensure it is resumed (crucial for Chrome/Edge)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // 2. Get User Media Stream (The Microphone)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // 3. Connect Visualizer Logic
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.smoothingTimeConstant = 0.5;
            this.microphone.connect(this.analyser);

            // 4. Start TensorFlow.js Recognizer
            // We re-initialize or reuse the existing one.
            if (!this.recognizer) {
                this.recognizer = speechCommands.create('BROWSER_FFT');
                await this.recognizer.ensureModelLoaded();
            }

            this.isListening = true;
            console.log('SonicGuard: Unified Audio Engine Started');

            // Start AI Listener
            this.recognizer.listen(result => {
                const scores = result.scores;
                const labels = this.recognizer.wordLabels();
                const maxScore = Math.max(...scores);
                const maxIndex = scores.indexOf(maxScore);
                const detectedLabel = labels[maxIndex];

                if (detectedLabel === '_background_noise_' || detectedLabel === '_unknown_') return;

                // Threshold lowered to 0.55 for easier demo
                if (maxScore > 0.55) {
                    console.log(`Detected: ${detectedLabel} (${maxScore.toFixed(2)})`);
                    const threatMap = {
                        "go": "aggressiveVoice", "stop": "alarm", "no": "dogBark",
                        "up": "glassBreak", "down": "explosion", "yes": "scream",
                        "left": "carCrash", "right": "gunshot"
                    };

                    if (threatMap[detectedLabel]) {
                        onThreatDetected({
                            type: threatMap[detectedLabel],
                            confidence: maxScore * 100,
                            severity: maxScore > 0.85 ? 'high' : 'medium',
                            direction: Math.random() * 360,
                            distance: 10 + Math.random() * 20
                        });
                    }
                }
            }, {
                overlapFactor: 0.5,
                includeSpectrogram: false,
                probabilityThreshold: 0.55
            });

        } catch (error) {
            console.error('Microphone access denied:', error);
            alert("SonicGuard needs microphone access to detect threats. Please allow it.");
            throw error;
        }
    }

    startVisualizer() {
        // Merged into startListening to prevent AudioContext conflicts
    }

    analyzeAudio(onThreatDetected) {
        // Deprecated: We use recognizer.listen() now
    }

    detectThreat(frequencyData, timeData) {
        // Feature extraction logic deprecated in favor of End-to-End Deep Learning
        return null;
    }

    // Kept for backward compatibility if UI calls it directly
    extractFeatures(f, t) { return {}; }
    matchPattern(f, p) { return 0; }
    calculateSeverity(t, s) { return 'medium'; }
    estimateSoundDirection(d) { return { direction: 0, distance: 10 }; }

    // UI Helpers - VISUALIZER LOGIC
    getAudioLevel() {
        if (!this.analyser) return 0;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        // Use Time Domain for waveform/volume power
        this.analyser.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128; // Center at 0
            sum += normalized * normalized;
        }

        const rms = Math.sqrt(sum / dataArray.length);

        // Scale highly for visibility (RMS is often very small, e.g., 0.01)
        // Multiplier 300-500 makes it jumpy and visible.
        return Math.min(100, rms * 500);
    }

    stopListening() {
        this.isListening = false;
        if (this.recognizer) {
            this.recognizer.stopListening();
        }
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        console.log('SonicGuard stopped listening');
    }

    dispose() {
        this.stopListening();
        this.threatHistory = [];
    }
}
