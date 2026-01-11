
/**
 * RECOVERY MANAGER
 * The "Immune System" of LocalLens.
 * Handles critical failures, resets hardware, and ensures the user is informed.
 */

import { useSystemState } from './systemState';
import { voiceController } from './voiceController';
import { cameraController } from './cameraController';

class RecoveryManager {

    async handleCriticalError(error: any, context: string) {
        console.error(`🔥 CRITICAL FAILURE [${context}]:`, error);

        const { transitionTo, setError } = useSystemState.getState();

        // 1. Enter Recovery State (Blocks all other actions)
        transitionTo('RECOVERING');
        setError(error.message);

        try {
            // 2. Immediate Hardware Safety Stop
            await Promise.allSettled([
                cameraController.stopCamera(),
                voiceController.stopListening(),
                voiceController.stopSpeaking()
            ]);

            // 3. Audio Feedback (Crucial for blind users)
            // We use a direct synthesis call here to bypass normal orchestrator checks
            // but we must be careful not to crash again.
            await voiceController.speakRecoveryMessage("System verification failed. Restarting.");

            // 4. Wait for stabilization
            await new Promise(r => setTimeout(r, 1500));

            // 5. Reset System
            useSystemState.getState().reset();

            // 6. Resume Service
            await voiceController.startListening();

        } catch (catastrophic) {
            console.error("💀 CATASTROPHIC FAILURE during Recovery:", catastrophic);
            // Last resort: simple browser alert or hard reload?
            // window.location.reload(); // Aggressive but effective.
        }
    }
}

export const recoveryManager = new RecoveryManager();
