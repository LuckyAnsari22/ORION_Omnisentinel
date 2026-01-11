import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import type { PipelineObject } from './types';

// STAGE 1 — PHYSICAL DETECTION
// Uses MediaPipe EfficientDet-Lite0 for raw physical presence detection.

class MediaPipeDetector {
    private detector: ObjectDetector | null = null;
    private runningMode: 'IMAGE' = 'IMAGE';

    async initialize() {
        if (this.detector) return;

        console.log("👁️ Initializing MediaPipe Object Detector...");
        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
            );

            this.detector = await ObjectDetector.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite",
                    delegate: "GPU"
                },
                scoreThreshold: 0.4, // USER RULE: >= 0.4 (Relaxed from 0.75)
                runningMode: this.runningMode,
                maxResults: 5 // USER RULE: Top 5
            });
            console.log("✅ MediaPipe Detector Ready");
        } catch (error) {
            console.error("❌ MediaPipe Init Failed:", error);
            throw error;
        }
    }

    async detect(image: HTMLImageElement | HTMLVideoElement): Promise<PipelineObject[]> {
        if (!this.detector) await this.initialize();
        if (!this.detector) return [];

        const detections = this.detector.detect(image);

        // Map to PipelineObject
        return detections.detections.map(d => {
            const box = d.boundingBox;
            // Ensure box exists (MediaPipe sometimes returns strange things?)
            // Usually ok.
            const category = d.categories[0];
            return {
                label: category.categoryName,
                score: category.score,
                box: {
                    x: box?.originX ?? 0,
                    y: box?.originY ?? 0,
                    width: box?.width ?? 0,
                    height: box?.height ?? 0
                },
                categoryScore: category.score,
                debugLog: [`Raw MP Score: ${category.score.toFixed(2)}`]
            };
        });
    }
}

export const objectDetector = new MediaPipeDetector();
