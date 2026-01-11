
/*
REFERENCE: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

Requirements:
1. High-quality photo capture
2. Large, accessible capture button
3. Haptic feedback
4. Auto-focus capability
*/

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

interface CameraCaptureProps {
    onCapture: (imageData: string, imageElement?: HTMLImageElement) => void;
    onError: (error: string) => void;
}

export interface CameraCaptureHandle {
    capturePhoto: () => void;
    getVideoElement: () => HTMLVideoElement | null;
}

export const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(({ onCapture, onError }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isReady, setIsReady] = useState(false);

    useImperativeHandle(ref, () => ({
        capturePhoto,
        getVideoElement: () => videoRef.current
    }));

    useEffect(() => {
        initializeCamera();
        return () => cleanup();
    }, []);

    const initializeCamera = async () => {
        try {
            // Request camera with optimal settings
            // Reference: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#parameters
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Rear camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    aspectRatio: { ideal: 16 / 9 }
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;

                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsReady(true);
                    console.log('📷 Camera ready');
                };
            }

        } catch (error) {
            console.error('Camera initialization failed:', error);
            onError('Camera access denied. Please allow camera permissions.');
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !isReady) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.9);

        // Create an image element detached for MediaPipe if needed, or consumer can create it.
        // For convenience in MediaPipe, we might want to return the HTML image element proxy or just the data.
        // MediaPipe usually works best with HTMLImageElement or VideoElement or Canvas.
        // We can pass the canvas indirectly or create a new Image.
        const img = new Image();
        img.src = imageData;

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }

        // Audio feedback
        playShutterSound();

        onCapture(imageData, img);
        console.log('📸 Photo captured');
    };

    const playShutterSound = () => {
        // Simple beep sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };

    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    return (
        <div className="relative w-full h-screen bg-black">
            {/* Video viewfinder */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                aria-label="Camera viewfinder"
            />

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Capture button - Large and accessible */}
            <button
                onClick={capturePhoto}
                disabled={!isReady}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-4 border-yellow-400 shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed z-50 cursor-pointer"
                aria-label="Capture photo and analyze scene"
            >
                <div className="w-full h-full rounded-full bg-yellow-400" />
            </button>

            {/* Ready indicator */}
            {isReady && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-semibold pointer-events-none">
                    Camera Ready
                </div>
            )}
        </div>
    );
});
