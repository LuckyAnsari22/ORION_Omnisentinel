import { objectPipeline } from './objectIdentificationPipeline';
import type { Evidence } from './types';

// The GATEKEEPER of Reality.
// Now powered by the STRICT 5-Stage Pipeline.

class EvidenceCollector {

    async collect(imageDataUrl: string, target?: string): Promise<Evidence[]> {
        // 1. Convert Data URL to Image Element
        const img = new Image();
        img.src = imageDataUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        // 2. Run Pipeline
        const result = await objectPipeline.process(img, target);

        // 3. Convert to legacy 'Evidence' format for Decision Engine
        // (Decision Engine will be simplified later, but needs this format now)
        return result.objects.map(obj => ({
            label: obj.label,
            confidence: obj.finalConfidence || 0,
            box: obj.box,
            heatmapScore: obj.similarityScore || 0, // Abuse heatmap field for logic
            source: 'pipeline'
        }));
    }
}

export const evidenceCollector = new EvidenceCollector();
