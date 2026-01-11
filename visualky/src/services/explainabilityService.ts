
// Explainability Service (Google Responsible AI)
// "Why did you say that?"

import { type GateResult } from "./safetyGate";

interface DecisionLog {
    timestamp: number;
    target: string;
    evidence: string;
    confidence: number;
    safetyResult: GateResult;
}

class ExplainabilityService {
    private lastDecision: DecisionLog | null = null;

    logDecision(target: string, evidence: string, confidence: number, safetyResult: GateResult) {
        this.lastDecision = {
            timestamp: Date.now(),
            target,
            evidence,
            confidence,
            safetyResult
        };
    }

    explainLastAction(): string {
        if (!this.lastDecision) return "I haven't made any complex decisions recently.";

        const d = this.lastDecision;
        const timeDelta = (Date.now() - d.timestamp) / 1000;

        if (timeDelta > 60) return "My last decision was too long ago to explain relevantly.";

        return `I decided that because I saw ${d.evidence} with ${(d.confidence * 100).toFixed(0)}% confidence. My safety check rated this as ${d.safetyResult.rating}.`;
    }
}

export const explainabilityService = new ExplainabilityService();
