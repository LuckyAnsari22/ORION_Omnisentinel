import { useRef, useEffect } from 'react';
import type { Detection } from '@mediapipe/tasks-vision';

interface ObjectOverlayProps {
    detections: Detection[];
    videoRef: React.RefObject<HTMLVideoElement>;
}

const ObjectOverlay = ({ detections, videoRef }: ObjectOverlayProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || !detections) return;

        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        // Match canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Using simple CSS to scale canvas to full container is handled by parent, 
        // but internal resolution must match video for drawing coordinates to be correct.

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        detections.forEach((detection) => {
            const { boundingBox, categories } = detection;
            if (!boundingBox || !categories) return;

            const category = categories[0];
            const label = category.categoryName;
            const score = Math.round(category.score * 100);

            // 1. Draw Bounding Box (High Contrast)
            // Outer stroke (Black/Dark) for contrast
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#000000';
            ctx.strokeRect(
                boundingBox.originX,
                boundingBox.originY,
                boundingBox.width,
                boundingBox.height
            );

            // Inner stroke (Primary Yellow)
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#FBBF24'; // Primary Yellow
            ctx.strokeRect(
                boundingBox.originX,
                boundingBox.originY,
                boundingBox.width,
                boundingBox.height
            );

            // 2. Draw Label Background
            ctx.font = 'bold 24px Inter, sans-serif';
            const text = `${label} ${score}%`;
            const textMetrics = ctx.measureText(text);
            const textHeight = 24;
            const padding = 8;
            const boxWidth = textMetrics.width + padding * 2;
            const boxHeight = textHeight + padding * 2;

            ctx.fillStyle = '#1E3A8A'; // Primary Blue
            ctx.fillRect(
                boundingBox.originX,
                boundingBox.originY - boxHeight,
                boxWidth,
                boxHeight
            );

            // 3. Draw Label Text
            ctx.fillStyle = '#FFFFFF'; // White text
            ctx.fillText(
                text,
                boundingBox.originX + padding,
                boundingBox.originY - padding - 4 // small adjustment for baseline
            );
        });
    }, [detections, videoRef]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
    );
};

export default ObjectOverlay;
