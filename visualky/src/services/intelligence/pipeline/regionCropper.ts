import type { PipelineObject } from './types';

// STAGE 2 — REGION CROPPING
// Isolates the object for the semantic verifier.
// Rules: Pad 10-15%, Resize to 224x224.

export const cropRegion = async (
    source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    object: PipelineObject
): Promise<string> => {
    // 1. Setup Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    if (!ctx) return "";

    // 2. Calculate Padding
    // Source dims
    const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

    const { x, y, width, height } = object.box;

    // 15% padding
    const padW = width * 0.15;
    const padH = height * 0.15;

    // Clamp to source bounds
    const cropX = Math.max(0, x - padW);
    const cropY = Math.max(0, y - padH);
    const cropW = Math.min(srcW - cropX, width + (padW * 2));
    const cropH = Math.min(srcH - cropY, height + (padH * 2));

    // 3. Draw & Resize
    ctx.drawImage(
        source,
        cropX, cropY, cropW, cropH, // Source
        0, 0, 224, 224             // Dest
    );

    // 4. Return Data URL (or Tensor compatible format if we optimized)
    return canvas.toDataURL('image/jpeg', 0.9);
};
