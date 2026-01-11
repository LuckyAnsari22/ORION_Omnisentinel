
import { ObjectDetector, FilesetResolver, type Detection } from '@mediapipe/tasks-vision';

export interface BoxPosition {
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
    width: number; // Normalized 0-1
    height: number; // Normalized 0-1
}

export interface DetectedRegion {
    id: string;
    label: string;
    position: BoxPosition;
    pixelRect: { x: number, y: number, width: number, height: number };
    imageBlob: Blob; // For CLIP
    imageUrl: string; // For debugging/display
    score: number;
}

export class MediaPipeService {
    private objectDetector: ObjectDetector | null = null;
    private runningMode: 'IMAGE' = 'IMAGE';

    async initialize() {
        if (this.objectDetector) return;

        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
        );

        this.objectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
                delegate: 'GPU'
            },
            scoreThreshold: 0.3, // Low threshold to let CLIP decide
            runningMode: this.runningMode
        });
        console.log("✅ MediaPipe ObjectDetector Initialized");
    }

    // New method for backward compatibility and raw access
    async detectObjects(imageElement: HTMLImageElement): Promise<any[]> {
        const regions = await this.detectAndCrop(imageElement);
        // Map to format expected by IntelligenceFusion
        return regions.map(r => ({
            name: r.label,
            confidence: r.score,
            boundingBox: {
                originX: r.position.x,
                originY: r.position.y,
                width: r.position.width,
                height: r.position.height
            }
        }));
    }

    async detectAndCrop(imageElement: HTMLImageElement): Promise<DetectedRegion[]> {
        if (!this.objectDetector) await this.initialize();
        if (!this.objectDetector) throw new Error("Failed to init MediaPipe");

        const result = this.objectDetector.detect(imageElement);
        return await this.processDetections(result.detections, imageElement);
    }

    private async processDetections(detections: Detection[], image: HTMLImageElement): Promise<DetectedRegion[]> {
        const regions: DetectedRegion[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) return [];

        for (const detection of detections) {
            if (!detection.boundingBox) continue;

            const box = detection.boundingBox;
            // Pad slightly? No, stick to raw for now unless improved.

            // Create crop
            canvas.width = box.width;
            canvas.height = box.height;
            ctx.drawImage(
                image,
                box.originX, box.originY, box.width, box.height,
                0, 0, box.width, box.height
            );

            // Export crop
            const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.95));
            if (!blob) continue;

            const category = detection.categories[0];

            regions.push({
                id: crypto.randomUUID(),
                label: category ? category.categoryName : 'unknown',
                position: {
                    x: box.originX / image.width,
                    y: box.originY / image.height,
                    width: box.width / image.width,
                    height: box.height / image.height
                },
                pixelRect: {
                    x: box.originX,
                    y: box.originY,
                    width: box.width,
                    height: box.height
                },
                imageBlob: blob,
                imageUrl: URL.createObjectURL(blob),
                score: category ? category.score : 0
            });
        }

        return regions;
    }
}

export const mediaPipeService = new MediaPipeService();
