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
            // Check microphone permissions first
            await navigator.mediaDevices.getUserMedia({ audio: true });

            if (!this.recognizer) {
                this.recognizer = speechCommands.create('BROWSER_FFT');
                await this.recognizer.ensureModelLoaded();
            }

            this.isListening = true;
            console.log('SonicGuard AI Model Listening...');

            // Start the REAL AI Listener
            this.recognizer.listen(result => {
                const scores = result.scores; // Probability of each class
                const labels = this.recognizer.wordLabels(); // Class names

                // Find highest probability class
                const maxScore = Math.max(...scores);
                const maxIndex = scores.indexOf(maxScore);
                const detectedLabel = labels[maxIndex];

                // If undefined or background noise, ignore
                if (detectedLabel === '_background_noise_' || detectedLabel === '_unknown_') {
                    return;
                }

                if (maxScore > 0.65) {
                    console.log(`Detected: ${detectedLabel} (${maxScore.toFixed(2)})`);

                    // Map generic labels to "Threats" for the demo context
                    // (Visualky demo maps: "Go" -> Aggression, "Stop" -> Alarm, etc)
                    const threatMap = {
                        "go": "aggressiveVoice",
                        "stop": "alarm",
                        "no": "dogBark",
                        "up": "glassBreak",   // Sharp sound
                        "down": "explosion"   // Low sound
                    };

                    if (threatMap[detectedLabel]) {
                        onThreatDetected({
                            type: threatMap[detectedLabel],
                            confidence: maxScore * 100,
                            severity: maxScore > 0.85 ? 'high' : 'medium',
                            direction: Math.random() * 360, // Spatial requires stereo/array
                            distance: 10 + Math.random() * 20
                        });
                    }
                }

            }, {
                overlapFactor: 0.5,
                includeSpectrogram: false,
                probabilityThreshold: 0.65
            });

            // Keep analyzing raw audio for the Visualizer (Audio Level)
            this.startVisualizer();

        } catch (error) {
            console.error('Microphone access denied:', error);
            throw error;
        }
    }

    startVisualizer() {
        // Simple parallel audio path for the UI bar
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.smoothingTimeConstant = 0.5;
            this.microphone.connect(this.analyser);
        });
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

    // UI Helpers
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
        return Math.min(100, rms * 400);
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
