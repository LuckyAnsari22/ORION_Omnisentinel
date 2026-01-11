
// Safety and Confidence Gate Service
// Responsible Principle: "Wrong guidance is worse than silence."

export const SafetyRating = {
    SAFE: 'SAFE',
    UNCERTAIN: 'UNCERTAIN',
    REFUSED: 'REFUSED'
} as const;

export type SafetyRating = typeof SafetyRating[keyof typeof SafetyRating];

export interface GateResult {
    rating: SafetyRating;
    confidence: number;
    reason: string | null;
}

class SafetyGate {
    private readonly HIGH_EXT_THRESHOLD = 0.85; // For dangerous objects (e.g. stairs)
    private readonly STANDARD_THRESHOLD = 0.75; // For regular objects

    evaluateEvidence(target: string, confidence: number, _label: string): GateResult {
        // 1. Refusal: Hallucination Prevention
        // If the labels don't match semantically (handled by CLIP, but double check here if needed)
        // For now, relies on CLIP score.

        // 2. Uncertainty Handling
        const threshold = this.isHighRisk(target) ? this.HIGH_EXT_THRESHOLD : this.STANDARD_THRESHOLD;

        if (confidence < threshold) {
            return {
                rating: SafetyRating.UNCERTAIN,
                confidence,
                reason: `Confidence ${confidence.toFixed(2)} is below threshold ${threshold}`
            };
        }

        // 3. Safe
        return {
            rating: SafetyRating.SAFE,
            confidence,
            reason: null
        };
    }

    private isHighRisk(target: string): boolean {
        const risky = ['stairs', 'step', 'curb', 'traffic', 'medicine', 'pills'];
        return risky.some(r => target.toLowerCase().includes(r));
    }
}

export const safetyGate = new SafetyGate();
