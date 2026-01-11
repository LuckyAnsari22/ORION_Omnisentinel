
/**
 * CAMERA CONTROLLER
 * Voice-First, Headless, Ephemeral.
 * 
 * Rules:
 * - Lazy Load: Only accesses video element when needed.
 * - Ephemeral: Starts stream -> Captures -> Stops stream.
 * - Non-Blocking: Never holds the thread.
 */

import { withTimeout } from '../utils/asyncUtils';

class CameraController {
    private registeredVideo: HTMLVideoElement | null = null;
    private stream: MediaStream | null = null;

    // Headless Registration
    register(videoElement: HTMLVideoElement) {
        this.registeredVideo = videoElement;
        console.log("📷 Camera Controller: Hardware Registered");
    }

    isReady(): boolean {
        return !!this.registeredVideo;
    }

    // The Main Action: Speak -> Capture -> Stop
    async captureSnapshot(): Promise<string> {
        if (!this.registeredVideo) throw new Error("Hardware not registered");

        console.log("📷 Capture Sequence Started");

        try {
            // 1. Wake Camera
            await this.startStream();

            // 2. Stabilize (Auto-exposure settlement)
            await new Promise(r => setTimeout(r, 700));

            // 3. Capture
            const canvas = document.createElement('canvas');
            canvas.width = this.registeredVideo.videoWidth;
            canvas.height = this.registeredVideo.videoHeight;
            canvas.getContext('2d')?.drawImage(this.registeredVideo, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

            // 4. Immediate Cleanup
            this.stopCamera();

            return dataUrl;

        } catch (e) {
            this.stopCamera(); // Ensure cleanup happens
            throw e;
        }
    }

    private async startStream() {
        if (!this.registeredVideo) return;

        // Cleanup just in case
        this.stopCamera();

        const stream = await withTimeout(
            navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: 1280, height: 720 },
                audio: false
            }),
            5000,
            "Camera Wake"
        );

        this.stream = stream;
        this.registeredVideo.srcObject = stream;
        this.registeredVideo.setAttribute('playsinline', 'true');
        await this.registeredVideo.play();
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this.registeredVideo) {
            this.registeredVideo.srcObject = null;
        }
        console.log("📷 Camera Released");
    }
}

export const cameraController = new CameraController();
