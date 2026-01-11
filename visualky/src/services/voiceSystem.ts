/**
 * VOICE CONTROLLER
 * 
 * Manages:
 * - Speech recognition (continuous listening)
 * - Text-to-speech synthesis
 * - Wake word detection
 * - Audio feedback
 * - State-driven voice announcements
 * 
 * Design principle:
 * Voice is NEVER blocked by UI.
 * All voice operations are non-blocking async.
 */

import { useSystemState, onStateChange, type SystemState, type ErrorContext } from './SystemStateStore';
import { parseIntent } from './intentParser';
import { executeCommand } from './commandExecutor';

const WAKE_WORD = 'hey locallens';
const SILENCE_TIMEOUT_MS = 2000;
const MAX_RECOGNITION_TIME_MS = 30000;

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

class VoiceControllerImpl {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isSupported: boolean = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private recognitionTimer: ReturnType<typeof setTimeout> | null = null;
  private isSpeaking: boolean = false;
  private unsubscribeStateListener: (() => void) | null = null;

  constructor() {
    this.initializeSpeechAPIs();
    this.setupStateListener();
  }

  // ====================================
  // INITIALIZATION
  // ====================================

  private initializeSpeechAPIs(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.isSupported = !!SpeechRecognition;

    if (!this.isSupported) {
      console.warn('⚠️ Speech Recognition API not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.synthesis = window.speechSynthesis;

    this.configureRecognition();
  }

  private configureRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.language = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => this.handleRecognitionStart();
    this.recognition.onresult = (event: SpeechRecognitionEvent) => this.handleRecognitionResult(event);
    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => this.handleRecognitionError(event);
    this.recognition.onend = () => this.handleRecognitionEnd();
  }

  private setupStateListener(): void {
    this.unsubscribeStateListener = onStateChange((newState) => {
      this.handleStateChange(newState);
    });
  }

  // ====================================
  // PUBLIC API
  // ====================================

  /**
   * Start listening for voice commands
   * Does not block any UI operations
   */
  public async startListening(): Promise<void> {
    if (!this.isSupported || !this.recognition) {
      throw new Error('Speech Recognition not supported');
    }

    try {
      // Clear any existing timers
      this.clearTimers();

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      // Start recognition
      this.recognition.start();

      // Set recognition timeout
      this.recognitionTimer = setTimeout(() => {
        this.stopListening();
        this.announce('Listening timeout. Returning to idle.');
      }, MAX_RECOGNITION_TIME_MS);
    } catch (error) {
      this.handleVoiceError('MICROPHONE_ACCESS_DENIED', 'Microphone access denied');
    }
  }

  /**
   * Stop listening
   */
  public stopListening(): void {
    if (!this.recognition) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }

    this.clearTimers();
  }

  /**
   * Speak text to user
   * Non-blocking, state-driven
   */
  public async speak(text: string): Promise<void> {
    if (!this.synthesis) {
      console.warn('Speech Synthesis not available');
      return;
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        this.isSpeaking = false;
        resolve();
      };

      this.synthesis?.cancel();
      this.synthesis?.speak(utterance);
    });
  }

  /**
   * Announce state change
   * Gets called automatically by state listener
   */
  public async announce(message: string): Promise<void> {
    const { screenReaderMode } = useSystemState.getState();

    // Always announce to screen readers
    if (screenReaderMode) {
      this.announceToScreenReader(message);
    }

    // Announce via speech
    await this.speak(message);
  }

  /**
   * Check if currently speaking
   */
  public isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if speech APIs are supported
   */
  public isAPISupported(): boolean {
    return this.isSupported;
  }

  /**
   * Cleanup on unmount
   */
  public destroy(): void {
    this.stopListening();
    this.clearTimers();

    if (this.unsubscribeStateListener) {
      this.unsubscribeStateListener();
    }

    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // ====================================
  // PRIVATE HANDLERS
  // ====================================

  private handleRecognitionStart(): void {
    console.log('🎤 Recognition started');
    useSystemState.getState().transitionToListening();
  }

  private handleRecognitionResult(event: SpeechRecognitionEvent): void {
    let transcript = '';
    let isFinal = false;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcriptSegment = event.results[i][0].transcript;
      transcript += transcriptSegment;
      isFinal = event.results[i].isFinal;
    }

    // Update state with interim results
    useSystemState.getState().setTranscript(transcript);

    if (isFinal) {
      this.handleFinalTranscript(transcript);
    }

    // Reset silence timer
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      if (isFinal) {
        this.stopListening();
        useSystemState.getState().transitionToThinking();
      }
    }, SILENCE_TIMEOUT_MS);
  }

  private handleFinalTranscript(transcript: string): void {
    const lower = transcript.toLowerCase().trim();

    // Check for wake word
    if (lower.includes(WAKE_WORD)) {
      console.log('✅ Wake word detected');
      // Extract command after wake word
      const command = lower.replace(WAKE_WORD, '').trim();
      if (command) {
        this.processCommand(command);
      }
      return;
    }

    // Direct command (if already listening)
    if (useSystemState.getState().isMicrophoneActive) {
      this.processCommand(lower);
    }
  }

  private processCommand(command: string): void {
    console.log('📝 Processing command:', command);

    // Stop listening immediately
    this.stopListening();

    // Parse intent from transcript
    const intent = parseIntent(command);
    console.log(`🎯 Intent: ${intent.intent} (${Math.round(intent.confidence * 100)}%)`);

    // Hand off to command executor (the ONLY place where actions happen)
    // This is async but we don't await it - executor manages its own flow
    executeCommand(intent).catch((error) => {
      console.error('❌ Command executor failed:', error);
      const store = useSystemState.getState();
      const errorContext: ErrorContext = {
        code: 'COMMAND_EXECUTOR_ERROR',
        message: 'Command execution failed. Please try again.',
        timestamp: Date.now(),
        recoverable: true,
      };
      store.transitionToError(errorContext);
    });
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent): void {
    console.error('🎙️ Recognition error:', event.error);

    const errorMap: Record<string, string> = {
      'network': 'Network error. Please check your internet connection.',
      'audio-capture': 'No audio input detected. Please check your microphone.',
      'no-speech': 'No speech detected. Please try again.',
      'service-unavailable': 'Speech service unavailable. Please try again.',
    };

    const message = errorMap[event.error] || `Recognition error: ${event.error}`;

    this.handleVoiceError('RECOGNITION_ERROR', message);
  }

  private handleRecognitionEnd(): void {
    console.log('🎙️ Recognition ended');
    this.clearTimers();
  }

  private handleStateChange(newState: SystemState): void {
    // Auto-announcements for state changes
    const announcements: Record<SystemState, string> = {
      'IDLE': 'System ready. Say "Hey LocalLens" to start.',
      'LISTENING': 'Listening. What would you like to know?',
      'THINKING': 'Processing your request.',
      'SPEAKING': '', // Don't re-announce when already speaking
      'ERROR': 'An error occurred. Please try again.',
    };

    const message = announcements[newState];
    if (message && newState !== 'SPEAKING') {
      this.announce(message).catch(console.error);
    }
  }

  private handleVoiceError(code: string, message: string): void {
    const error: ErrorContext = {
      code,
      message,
      timestamp: Date.now(),
      recoverable: true,
    };

    useSystemState.getState().transitionToError(error);
    this.announce(message).catch(console.error);
  }

  private announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  private clearTimers(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognitionTimer) {
      clearTimeout(this.recognitionTimer);
      this.recognitionTimer = null;
    }
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}

// Singleton instance
let instance: VoiceControllerImpl | null = null;

export const useVoiceController = (): VoiceControllerImpl => {
  if (!instance) {
    instance = new VoiceControllerImpl();
  }
  return instance;
};

/**
 * Clean up voice controller
 * Call on app unmount
 */
export const destroyVoiceController = (): void => {
  if (instance) {
    instance.destroy();
    instance = null;
  }
};
