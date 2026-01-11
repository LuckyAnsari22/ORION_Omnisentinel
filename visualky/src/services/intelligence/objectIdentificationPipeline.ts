import { objectDetector } from './pipeline/objectDetector';
import { cropRegion } from './pipeline/regionCropper';
import { embeddingVerifier } from './pipeline/embeddingVerifier';
import { fuseConfidence, getFusionDecision } from './pipeline/confidenceFusion';
import { validateSpatial } from './pipeline/spatialValidator';
import type { PipelineObject, PipelineResult } from './pipeline/types';

// THE NEW OBJECT IDENTIFICATION PIPELINE
// Orchestrates Stages 1-5 securely.
// "If the system cannot confidently say: 'I see an object of type X', NOTHING ELSE ALLOWED."

class ObjectIdentificationPipeline {
    private debugMode = true; // Enabled for now

    async process(imageSource: HTMLImageElement | HTMLVideoElement, targetObject?: string): Promise<PipelineResult> {
        console.log("🛡️ Pipline Started: Object Verification");

        // STAGE 1: PHYSICAL DETECTION
        const rawObjects = await objectDetector.detect(imageSource);
        console.log(`🔎 Stage 1: Detected ${rawObjects.length} candidates`, rawObjects);

        const verifiedObjects: PipelineObject[] = [];
        const debugTrace: any[] = [];

        // Process Loop
        for (const obj of rawObjects) {
            // STAGE 5 (Early): Spatial Sanity (Fail fast on tiny noise)
            const isValidSpatial = validateSpatial(
                obj,
                imageSource instanceof HTMLVideoElement ? imageSource.videoWidth : imageSource.width,
                imageSource instanceof HTMLVideoElement ? imageSource.videoHeight : imageSource.height
            );

            if (!isValidSpatial) {
                obj.debugLog?.push("Rejected at Spatial Stage");
                debugTrace.push(obj);
                continue;
            }

            // STAGE 2: CROPPING
            const croppedUrl = await cropRegion(imageSource, obj);

            // STAGE 3: SEMANTIC VERIFICATION
            // Using Zero-Shot CLIP
            // Check against its own label AND target if provided
            const simScore = await embeddingVerifier.verify(croppedUrl, obj, targetObject);
            obj.similarityScore = simScore;

            // STAGE 4: FUSION
            const fusedScore = fuseConfidence(obj);
            const decision = getFusionDecision(fusedScore);

            obj.debugLog?.push(`Decision: ${decision}`);

            if (decision === 'ACCEPT' || decision === 'UNCERTAIN') {
                verifiedObjects.push(obj);
            } else {
                // REJECTED
            }
            debugTrace.push(obj);
        }

        const filtered = verifiedObjects.sort((a, b) => (b.finalConfidence || 0) - (a.finalConfidence || 0));

        console.log("✅ Pipeline Complete. Valid Objects:", filtered.length);
        if (this.debugMode) {
            console.table(filtered.map(o => ({
                label: o.label,
                det: o.categoryScore?.toFixed(2),
                sim: o.similarityScore?.toFixed(2),
                final: o.finalConfidence?.toFixed(2),
                decision: getFusionDecision(o.finalConfidence || 0)
            })));
        }

        return {
            objects: filtered,
            timestamp: Date.now(),
            debugTrace
        };
    }
}

export const objectPipeline = new ObjectIdentificationPipeline();
