import type { PipelineObject } from './types';

// STAGE 5 — SPATIAL SANITY CHECK
// A light filter for physically implausible detections.

export const validateSpatial = (object: PipelineObject, imageWidth: number, imageHeight: number): boolean => {
    const { width, height } = object.box;
    const area = width * height;
    const totalArea = imageWidth * imageHeight;

    // Rule: Too small (< 2%)
    // 2% is actually quite small (e.g. keys on a table might be 2%)
    // Let's stick to user rule: < 2%
    const ratio = area / totalArea;

    if (ratio < 0.02) {
        object.debugLog?.push(`Spatial: REJECT (Too small ${ratio.toFixed(3)})`);
        return false;
    }

    // Add other heuristic? 
    // e.g. "Person" filling 100% is usually wrong (unless face).
    // For now, only small check.

    object.debugLog?.push(`Spatial: PASS (${ratio.toFixed(3)})`);
    return true;
};
