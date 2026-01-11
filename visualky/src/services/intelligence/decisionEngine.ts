
/**
 * DECISION ENGINE
 * Layer 3: The Brain.
 * 
 * Rules:
 * - Aggregates Evidence.
 * - Checks Constraints.
 * - Produces the FINAL Message.
 */

import type { Evidence, DecisionObject, VisionRequest } from './types';

class DecisionEngine {

    evaluate(evidence: Evidence[], request: VisionRequest): DecisionObject {
        console.log("🧠 Thinking...", { request, evidenceCount: evidence.length });

        // 1. Smart Filtering
        // Relaxed threshold for better usability in poor lighting
        const strongEvidence = evidence.filter(e => e.confidence > 0.5);
        const weakEvidence = evidence.filter(e => e.confidence > 0.25); // Catch almost anything

        // Use best available
        const usableEvidence = strongEvidence.length > 0 ? strongEvidence : weakEvidence;

        let message = "";
        let type: any = 'ANSWER';


        if (usableEvidence.length === 0) {
            message = "I see a dark or blurry scene. I cannot identify objects.";
            type = 'REFUSE'; // Or maybe 'ANSWER' with vague description?
        } else {
            // Mode Logic
            if (request.mode === 'find' && request.target) {
                const target = request.target.toLowerCase();
                // Check all evidence for the target
                const match = usableEvidence.find(e => e.label.toLowerCase().includes(target));
                if (match) {
                    message = `I found the ${match.label}. It is ${this.getSpatialHint()}.`; // Removing box arg
                } else {
                    // List what IS seen to be helpful
                    const topItem = usableEvidence[0].label;
                    message = `I don't see ${target}, but I do see a ${topItem}.`;
                }
            } else {
                // Default / Describe
                // Deduplicate
                const labels = [...new Set(usableEvidence.map(e => e.label))];

                // Formulate sentence
                if (labels.length === 1) {
                    message = `I see a ${labels[0]}.`;
                } else {
                    const last = labels.pop();
                    message = `I see ${labels.join(', ')} and ${last}.`;
                }
            }
        }

        // Return Block matches new logic...
        return {
            decisionType: type,
            confidence: strongEvidence.length > 0 ? 0.9 : 0.4,
            risk: strongEvidence.length > 0 ? 'LOW' : 'MEDIUM',
            message: message,
            debugReasoning: [`Found ${usableEvidence.length} items`, `Strong: ${strongEvidence.length}`]
        };
    }

    private getSpatialHint(): string {
        // Assuming normalized 0-1 coords would be better, but COCO gives pixels. 
        // We'd need image dims. For now, vague is safe.
        return "in the view";
    }
}

export const decisionEngine = new DecisionEngine();
