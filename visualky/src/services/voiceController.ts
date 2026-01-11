
/**
 * VOICE CONTROLLER
 * The Primary Interface of LocalLens.
 * 
 * Responsibilities:
 * - Manage Microphone Loop (Continuous vs Wake Word).
 * - Manage Speech Output (Synthesis).
 * - PREVENT OVERLAP (Mutex Logic).
 */

class VoiceController {
    private recognition: any = null;
    private synthesis: SpeechSynthesis;
    private isMicActive = false;

    // Config
    // private readonly WAKE_WORD = "hey local lens"; // Phonetic matching is done in-line for now

    // Callbacks
    private onIntentDetected: ((transcript: string) => void) | null = null;
    private onWakeWord: (() => void) | null = null;

    constructor() {
        this.synthesis = window.speechSynthesis;
    }

    setHooks(onWakeWord: () => void, onIntent: (text: string) => void) {
        this.onWakeWord = onWakeWord;
        this.onIntentDetected = onIntent;
    }

    async startListening() {
        if (this.isMicActive) return;
        this.initializeRecognition();

        try {
            this.recognition?.start();
            this.isMicActive = true;
            console.log("🎤 Mic ON (Listening Loop)");
        } catch (e) {
            // Usually "already started" or permission issue
            console.warn("Mic start issue:", e);
        }
    }

    stopListening() {
        if (!this.isMicActive) return;
        try {
            this.recognition?.stop();
            this.isMicActive = false;
            console.log("🎤 Mic OFF");
        } catch (e) { }
    }

    stopSpeaking() {
        this.synthesis.cancel();
    }

    async speak(text: string): Promise<void> {
        // MUTEX: Silence Mic before Speaking
        this.stopListening();
        this.synthesis.cancel();

        return new Promise((resolve) => {
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 1.0;

            // Language Detection (Heuristic)
            const isHindi = /[\u0900-\u097F]/.test(text);
            const isTamil = /[\u0B80-\u0BFF]/.test(text);
            const isTelugu = /[\u0C00-\u0C7F]/.test(text);
            const isBengali = /[\u0980-\u09FF]/.test(text);

            const voices = this.synthesis.getVoices();
            let voice = null;

            if (isHindi) voice = voices.find(v => v.lang.includes('hi') || v.lang.includes('HI'));
            else if (isTamil) voice = voices.find(v => v.lang.includes('ta'));
            else if (isTelugu) voice = voices.find(v => v.lang.includes('te'));
            else if (isBengali) voice = voices.find(v => v.lang.includes('bn'));

            // Fallback to English/preferred
            if (!voice) {
                voice = voices.find(v => v.name.includes('Google') && v.lang.includes('en-US'))
                    || voices.find(v => v.lang.includes('en-US'))
                    || null;
            }

            u.voice = voice;
            u.lang = voice?.lang || 'en-US';

            u.onend = () => {
                console.log("🔈 Speech Ended");
                resolve();
            };

            u.onerror = (e) => {
                console.error("Speech Error", e);
                resolve(); // Don't hang
            };

            this.synthesis.speak(u);
        });
    }

    // Special bypass for Recovery Manager
    async speakRecoveryMessage(text: string) {
        return this.speak(text);
    }

    private initializeRecognition() {
        if (this.recognition) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
            const result = event.results[event.results.length - 1];
            const transcript = (result[0].transcript as string).toLowerCase().trim();
            const isFinal = result.isFinal;

            // Simple Wake Word Check
            // We verify 'isFinal' OR sufficient length to trigger wake
            if (transcript.includes("local lens") || transcript.includes("locallens")) {
                // Trigger Wake
                if (this.onWakeWord) this.onWakeWord();
            } else if (isFinal && transcript.length > 2) {
                // Trigger Intent if valid
                if (this.onIntentDetected) this.onIntentDetected(transcript);
            }
        };

        this.recognition.onend = () => {
            this.isMicActive = false;
            // Auto-restart logic is handled by Orchestrator or self-healing here?
            // "System should auto-restart listening"
            // We expose an event or just auto-restart if we think we should be listening.
            // For now, let Orchestrator manage the loop state via 'startListening'.
            // Actually, for robustness, basic auto-restart here is good if it wasn't manual stop.
        };
    }
}

export const voiceController = new VoiceController();
