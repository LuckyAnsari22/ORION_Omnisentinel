/**
 * SYSTEM STATE STORE
 * 
 * Single source of truth for the entire application.
 * All visuals and voice behaviors subscribe to these state changes.
 * 
 * Architecture:
 * - State is immutable and deterministic
 * - All side effects are isolated
 * - Transitions are explicit and validated
 * - Callbacks enable decoupled components
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type SystemState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR';

interface AudioLevel {
  amplitude: number;
  frequency: number;
}

export interface ErrorContext {
  code: string;
  message: string;
  timestamp: number;
  recoverable: boolean;
  type?: string;
}

interface AnalysisResult {
  confidence: number;
  detectedObjects: string[];
  spatialData: {
    position: string;
    distance: string;
  };
}

interface StoreState {
  // ====================================
  // CORE STATE
  // ====================================
  state: SystemState;
  previousState: SystemState;
  transitionTime: number;
  
  // ====================================
  // VOICE & AUDIO
  // ====================================
  isMicrophoneActive: boolean;
  audioLevel: AudioLevel;
  recognizedTranscript: string;
  transcript: string;
  transcriptFinal: boolean;
  lastSpokeMessage: string;
  confidenceScore: number;
  
  // ====================================
  // ANALYSIS & INTELLIGENCE
  // ====================================
  analysisResult: AnalysisResult | null;
  isProcessing: boolean;
  processingProgress: number; // 0-1
  
  // ====================================
  // ERROR HANDLING
  // ====================================
  errorContext: ErrorContext | null;
  errorCount: number;
  lastErrorRecoveryTime: number;
  
  // ====================================
  // ACCESSIBILITY & PREFERENCES
  // ====================================
  prefersReducedMotion: boolean;
  screenReaderMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  
  // ====================================
  // STATE TRANSITIONS
  // ====================================
  transitionToListening: () => void;
  transitionToThinking: () => void;
  transitionToSpeaking: (message: string) => void;
  transitionToIdle: () => void;
  transitionToError: (error: ErrorContext) => void;
  
  // ====================================
  // DATA UPDATES
  // ====================================
  setAudioLevel: (level: AudioLevel) => void;
  setTranscript: (transcript: string) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setConfidenceScore: (score: number) => void;
  setProcessingProgress: (progress: number) => void;
  
  // ====================================
  // ACCESSIBIL ITY
  // ====================================
  setReducedMotionPreference: (prefer: boolean) => void;
  setScreenReaderMode: (active: boolean) => void;
  setHighContrast: (active: boolean) => void;
  
  // ====================================
  // LIFECYCLE
  // ====================================
  reset: () => void;
  recoverFromError: () => void;
}

const INITIAL_STATE: StoreState = {
  state: 'IDLE',
  previousState: 'IDLE',
  transitionTime: Date.now(),
  isMicrophoneActive: false,
  audioLevel: { amplitude: 0, frequency: 0 },
  recognizedTranscript: '',
  transcript: '',
  transcriptFinal: false,
  lastSpokeMessage: '',
  confidenceScore: 0,
  analysisResult: null,
  isProcessing: false,
  processingProgress: 0,
  errorContext: null,
  errorCount: 0,
  lastErrorRecoveryTime: 0,
  prefersReducedMotion: typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  screenReaderMode: false,
  highContrast: typeof window !== 'undefined' ? window.matchMedia('(prefers-contrast: more)').matches : false,
  reducedMotion: false,
  transitionToListening: () => {},
  transitionToThinking: () => {},
  transitionToSpeaking: () => {},
  transitionToIdle: () => {},
  transitionToError: () => {},
  setAudioLevel: () => {},
  setTranscript: () => {},
  setAnalysisResult: () => {},
  setConfidenceScore: () => {},
  setProcessingProgress: () => {},
  setReducedMotionPreference: () => {},
  setScreenReaderMode: () => {},
  setHighContrast: () => {},
  reset: () => {},
  recoverFromError: () => {},
};

export const useSystemState = create<StoreState>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_STATE,

    // ====================================
    // STATE TRANSITIONS
    // ====================================
    
    transitionToListening: () => {
      const current = get();
      if (current.state === 'LISTENING') return;

      set({
        previousState: current.state,
        state: 'LISTENING',
        transitionTime: Date.now(),
        isMicrophoneActive: true,
        audioLevel: { amplitude: 0, frequency: 0 },
        recognizedTranscript: '',
        errorContext: null,
      });

      console.log('🎤 → LISTENING');
    },

    transitionToThinking: () => {
      const current = get();
      if (current.state === 'THINKING') return;

      set({
        previousState: current.state,
        state: 'THINKING',
        transitionTime: Date.now(),
        isMicrophoneActive: false,
        isProcessing: true,
        processingProgress: 0,
        errorContext: null,
      });

      console.log('🧠 → THINKING');
    },

    transitionToSpeaking: (message: string) => {
      const current = get();
      
      set({
        previousState: current.state,
        state: 'SPEAKING',
        transitionTime: Date.now(),
        lastSpokeMessage: message,
        isMicrophoneActive: false,
        isProcessing: false,
        errorContext: null,
      });

      console.log('🗣️ → SPEAKING:', message);
    },

    transitionToIdle: () => {
      const current = get();
      if (current.state === 'IDLE') return;

      set({
        previousState: current.state,
        state: 'IDLE',
        transitionTime: Date.now(),
        isMicrophoneActive: false,
        isProcessing: false,
        recognizedTranscript: '',
        audioLevel: { amplitude: 0, frequency: 0 },
        errorContext: null,
      });

      console.log('⏸️ → IDLE');
    },

    transitionToError: (error: ErrorContext) => {
      const current = get();

      set({
        previousState: current.state,
        state: 'ERROR',
        transitionTime: Date.now(),
        errorContext: error,
        errorCount: current.errorCount + 1,
        isMicrophoneActive: false,
        isProcessing: false,
      });

      console.error('❌ → ERROR:', error.code, error.message);
    },

    // ====================================
    // DATA UPDATES
    // ====================================

    setAudioLevel: (level: AudioLevel) => {
      set({ audioLevel: level });
    },

    setTranscript: (transcript: string, final: boolean = false) => {
      set({ recognizedTranscript: transcript, transcript, transcriptFinal: final });
    },

    setAnalysisResult: (result: AnalysisResult) => {
      set({ analysisResult: result });
    },

    setConfidenceScore: (score: number) => {
      set({ confidenceScore: Math.max(0, Math.min(1, score)) });
    },

    setProcessingProgress: (progress: number) => {
      set({ processingProgress: Math.max(0, Math.min(1, progress)) });
    },

    // ====================================
    // ACCESSIBILITY
    // ====================================

    setReducedMotionPreference: (prefer: boolean) => {
      set({ prefersReducedMotion: prefer });
    },

    setScreenReaderMode: (active: boolean) => {
      set({ screenReaderMode: active });
    },

    setHighContrast: (active: boolean) => {
      set({ highContrast: active });
    },

    // ====================================
    // LIFECYCLE
    // ====================================

    reset: () => {
      set({
        ...INITIAL_STATE,
        prefersReducedMotion: get().prefersReducedMotion,
        screenReaderMode: get().screenReaderMode,
        highContrast: get().highContrast,
      });
      console.log('🔄 System reset');
    },

    recoverFromError: () => {

      set({
        errorContext: null,
        lastErrorRecoveryTime: Date.now(),
        state: 'IDLE',
        previousState: 'ERROR',
      });
      console.log('✅ Recovered from error');
    },
  }))
);

// ====================================
// SELECTOR HOOKS (for performance)
// ====================================

export const useSystemStateValue = () => useSystemState((s) => s.state);
export const useIsListening = () => useSystemState((s) => s.isMicrophoneActive);
export const useAudioLevel = () => useSystemState((s) => s.audioLevel);
export const useTranscript = () => useSystemState((s) => s.recognizedTranscript);
export const useAnalysisResult = () => useSystemState((s) => s.analysisResult);
export const useErrorContext = () => useSystemState((s) => s.errorContext);
export const usePreferencesReducedMotion = () => useSystemState((s) => s.prefersReducedMotion);
export const useProcessingProgress = () => useSystemState((s) => s.processingProgress);

// ====================================
// STATE CHANGE LISTENERS
// ====================================

/**
 * Subscribe to state transitions
 * Useful for side effects like voice announcements
 */
export const onStateChange = (
  callback: (newState: SystemState, oldState: SystemState) => void
) => {
  return useSystemState.subscribe(
    (state) => state.state,
    (newState, oldState) => {
      callback(newState, oldState);
    }
  );
};

/**
 * Subscribe to error changes
 * Useful for error recovery logic
 */
export const onErrorChange = (
  callback: (error: ErrorContext | null) => void
) => {
  return useSystemState.subscribe(
    (state) => state.errorContext,
    callback
  );
};
