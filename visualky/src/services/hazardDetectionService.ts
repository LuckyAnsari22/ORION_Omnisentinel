
import { type DetectedRegion } from "./mediaPipeService";

class HazardDetectionService {

    // Proactive check (Feature 4)
    detectHazards(regions: DetectedRegion[]): string | null {

        // Simple Heuristic:
        // Objects at the very bottom of the frame (y > 0.8) might be trip hazards if they are "obstacles".
        // We really need classification for this, but MediaPipe efficientdet_lite0 has limited classes.
        // It detects: chair, couch, potted plant, bed, dining table, toilet, tv, laptop...

        // Let's filter for "large objects at bottom center".

        const centerHazards = regions.filter(r => {
            const isBottom = r.position.y + r.position.height > 0.85; // Near feet
            const isCenter = r.position.x > 0.3 && r.position.x < 0.7; // In path
            const isLarge = r.position.width * r.position.height > 0.1; // Significant size
            return isBottom && isCenter && isLarge;
        });

        if (centerHazards.length > 0) {
            return "Warning: There is an obstacle directly in your path.";
        }

        return null; // Safe
    }
}

export const hazardDetectionService = new HazardDetectionService();
