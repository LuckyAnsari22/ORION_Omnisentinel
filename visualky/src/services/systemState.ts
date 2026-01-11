
/**
 * GLOBAL SYSTEM STATE MACHINE
 * The Backbone of LocalLens. 
 * Enforces strict, non-overlapping modes of operation.
 * 
 * STATES:
 * - IDLE: System is sleeping or waiting (Mic might be listening for wake word depending on config).
 * - LISTENING: Active user input phase. Mic ON. Speaker OFF.
 * - CAPTURING: Camera waking up and grabbing frame. Mic OFF. Speaker OFF.
 * - THINKING: AI analysis in progress. Mic OFF. Speaker OFF.
 * - SPEAKING: Text-to-Speech active. Mic OFF.
 * - RECOVERING: Fail-safe mode. Resetting hardware.
 */

import { create } from 'zustand';

export type SystemMode = 'IDLE' | 'LISTENING' | 'CAPTURING' | 'THINKING' | 'SPEAKING' | 'RECOVERING' | 'SEARCHING';

interface SystemState {
    mode: SystemMode;
    lastError: string | null;
    transitionTo: (newMode: SystemMode) => void;
    setError: (error: string) => void;
    reset: () => void;
}

// STRICT TRANSITION GRAPH
// Prevents invalid jumps (e.g. Speaking -> Capturing without Listening first)
const VALID_TRANSITIONS: Record<SystemMode, SystemMode[]> = {
    IDLE: ['LISTENING', 'RECOVERING', 'SEARCHING'],
    LISTENING: ['CAPTURING', 'THINKING', 'IDLE', 'RECOVERING', 'SEARCHING'], // Thinking if chat, Capturing if vision
    CAPTURING: ['THINKING', 'RECOVERING', 'SEARCHING'],
    THINKING: ['SPEAKING', 'RECOVERING', 'SEARCHING'],
    SPEAKING: ['IDLE', 'LISTENING', 'RECOVERING', 'SEARCHING'], // Loop back to listening if conversational, else Idle
    RECOVERING: ['IDLE'],
    SEARCHING: ['SPEAKING', 'RECOVERING', 'IDLE']
};

export const useSystemState = create<SystemState>((set, get) => ({
    mode: 'IDLE',
    lastError: null,

    transitionTo: (newMode: SystemMode) => {
        const current = get().mode;

        // Idempotency
        if (current === newMode) return;

        // Emergency Bypass
        if (newMode === 'RECOVERING') {
            console.warn(`🚨 STATE FORCE: ${current} -> RECOVERING`);
            set({ mode: 'RECOVERING' });
            return;
        }

        // Validation
        if (!VALID_TRANSITIONS[current].includes(newMode)) {
            console.error(`❌ ILLEGAL TRANSITION: ${current} -> ${newMode}`);
            // In strict mode, maybe trigger recovery? 
            // For now, log and block to preserve state integrity.
            return;
        }

        console.log(`🔄 State Change: ${current} -> ${newMode}`);
        set({ mode: newMode, lastError: null });
    },

    setError: (error: string) => set({ lastError: error }),

    reset: () => {
        console.log("♻️ System State Reset to IDLE");
        set({ mode: 'IDLE', lastError: null });
    }
}));
