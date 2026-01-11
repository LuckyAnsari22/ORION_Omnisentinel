import { pipeline, env } from '@xenova/transformers';
import type { PipelineObject } from './types';

// STAGE 3 — SEMANTIC VERIFICATION (ZERO-SHOT)
// Uses CLIP to ground the detection in language.

// Configure to allow local models or CDN
env.allowLocalModels = false;
env.useBrowserCache = true;

class EmbeddingVerifier {
    private classifier: any = null;
    private modelName = 'Xenova/clip-vit-base-patch32'; // Standard, reliable

    async initialize() {
        if (this.classifier) return;

        console.log("🧠 Initializing CLIP Verifier...");
        try {
            this.classifier = await pipeline('zero-shot-image-classification', this.modelName);
            console.log("✅ CLIP Ready");
        } catch (e) {
            console.error("❌ CLIP Init Failed:", e);
        }
    }

    async verify(croppedImageUrl: string, object: PipelineObject, targetLabel?: string): Promise<number> {
        if (!this.classifier) await this.initialize();
        if (!this.classifier) return 0.5; // Fail open/neutral if model fails? Or 0? 0 is safer.

        // Candidate Labels:
        // 1. The detected label (e.g. "cup")
        // 2. The target label if identifying (e.g. "keys")
        // 3. Negative prompts? (e.g. "blur", "nothing", "background")

        const candidates = [
            object.label,
            "background",
            "blurry",
            "noise"
        ];

        if (targetLabel && targetLabel !== object.label) {
            candidates.unshift(targetLabel);
        }

        // Run Zero-Shot
        // This is async
        const output = await this.classifier(croppedImageUrl, candidates);
        // Output format: [{ label: 'cup', score: 0.9 }, ...]

        // Find score for the POSITIVE labels (object.label or targetLabel)
        const bestMatch = output.find((o: any) => o.label === object.label || o.label === targetLabel);

        const score = bestMatch ? bestMatch.score : 0;

        object.debugLog?.push(`CLIP: ${bestMatch?.label} @ ${score.toFixed(2)}`);

        return score;
    }
}

export const embeddingVerifier = new EmbeddingVerifier();
