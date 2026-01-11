import type { PipelineObject } from './types';

// STAGE 4 — CONFIDENCE FUSION
// Balances Physical Evidence (MediaPipe) with Semantic Evidence (CLIP).

export const fuseConfidence = (object: PipelineObject): number => {
    const det = object.categoryScore || 0;
    const sim = object.similarityScore || 0;

    // Formula: Equal weight
    // Detection tells us "It looks like X structure"
    // Similarity tells us "It means X in language"

    // User Rule: 50/50 split
    const final = (0.5 * det) + (0.5 * sim);

    object.finalConfidence = final;
    object.debugLog?.push(`Fusion: (${det.toFixed(2)} * 0.5) + (${sim.toFixed(2)} * 0.5) = ${final.toFixed(2)}`);

    return final;
};

export const getFusionDecision = (score: number): 'ACCEPT' | 'UNCERTAIN' | 'REJECT' => {
    if (score >= 0.6) return 'ACCEPT';
    if (score >= 0.45) return 'UNCERTAIN';
    return 'REJECT';
};
