
import { pipeline, env } from '@xenova/transformers';

// Configure to load from CDN
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface EmbeddingResult {
    regionId: string;
    topLabel: string;
    confidence: number;
    allScores: { label: string, score: number }[];
}

export class EmbeddingService {
    private classifier: any = null;
    private modelName = 'Xenova/clip-vit-base-patch32'; // Small, fast, reasonable accuracy

    async initialize() {
        if (this.classifier) return;

        console.log("Loading CLIP model...");
        // 'zero-shot-image-classification' pipeline handles the embedding comparison
        this.classifier = await pipeline('zero-shot-image-classification', this.modelName);
        console.log("✅ CLIP Model Loaded");
    }

    async analyzeRegion(imageBlob: Blob, candidateLabels: string[]): Promise<EmbeddingResult> {
        if (!this.classifier) await this.initialize();

        // Convert blob to URL for the library
        const url = URL.createObjectURL(imageBlob);

        try {
            // Run Zero-Shot Classification
            // hypothesis_template is crucial for CLIP ("A photo of a {}")
            const output = await this.classifier(url, candidateLabels, {
                hypothesis_template: "A photo of a {}"
            });

            // Output format from pipeline: [{ label: 'cat', score: 0.9 }, ...]
            // Or if single image: { labels: [], scores: [] } -> transformers.js versions vary slightly, 
            // usually it returns an array of objects or an object with arrays. 
            // Xenova/transformers v2 usually returns { sequence: "...", labels: [...], scores: [...] } for text, 
            // but for zero-shot-image usually: [ { score: 0.99, label: '...' }, ... ]

            // Let's normalize the output.
            // Based on docs: output is array of { label, score } sorted.

            // Wait, standard pipeline output is often distinct. checking common usage.
            // It typically mimics the python one.
            // Let's assume it returns an array of objects { score, label }.

            const scores = output.map((item: any) => ({
                label: item.label,
                score: item.score
            }));

            // Find top
            const top = scores[0];

            return {
                regionId: '', // Set by caller or wrapper
                topLabel: top.label,
                confidence: top.score,
                allScores: scores
            };

        } catch (e) {
            console.error("CLIP Inference Failed", e);
            throw e;
        } finally {
            URL.revokeObjectURL(url);
        }
    }
}

export const embeddingService = new EmbeddingService();
