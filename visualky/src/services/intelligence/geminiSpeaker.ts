
/**
 * GEMINI SPEAKER (DUMB TERMINAL)
 * Layer 4: The Mouth.
 * 
 * Rules:
 * - Input: DecisionObject
 * - Output: String
 * - NO Reasoning.
 */

import type { DecisionObject } from './types';

class GeminiSpeaker {

    verbose(decision: DecisionObject): string {
        // If the decision message is already formed (which strictly it should be), we just return it.
        // But we can add "Tone" here if needed.
        // For "Dumb by Design", we trust the Decision Engine's message.

        return decision.message;
    }
}

export const geminiSpeaker = new GeminiSpeaker();
