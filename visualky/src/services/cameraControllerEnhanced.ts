/**
 * CAMERA CONTROLLER - EXECUTOR READY
 * 
 * Enhanced version supporting command executor pattern:
 * • start() / stop() for explicit control
 * • captureFrame() returns canvas data
 * • One-frame pattern: start → capture → stop
 * • Never auto-starts
 * • Never blocks voice
 */

import { withTimeout } from '../utils/asyncUtils';

class CameraControllerEnhanced {
  private registeredVideo: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private isRunning = false;

  /**
   * Register video element (called by React component)
   */
  register(videoElement: HTMLVideoElement) {
    this.registeredVideo = videoElement;
    console.log('📷 Camera registered');
  }

  /**
   * Check if camera is available
   */
  isReady(): boolean {
    return !!this.registeredVideo;
  }

  /**
   * Start camera stream (executor calls this)
   */
  async start(): Promise<void> {
    if (!this.registeredVideo) {
      throw new Error('Camera not registered. Video element required.');
    }

    if (this.isRunning) {
      console.log('⚠️ Camera already running');
      return;
    }

    try {
      console.log('📷 Starting camera...');

      // Stop any existing stream
      this.stopStream();

      // Request camera access
      const stream = await withTimeout(
        navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        }),
        5000,
        'Camera start'
      );

      this.stream = stream;
      this.registeredVideo.srcObject = stream;
      this.registeredVideo.setAttribute('playsinline', 'true');

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Camera failed to start in 5s')),
          5000
        );

        this.registeredVideo!.onloadedmetadata = () => {
          clearTimeout(timeout);
          this.registeredVideo!.play().catch(reject);
          resolve();
        };

        this.registeredVideo!.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Video element error'));
        };
      });

      // Let camera stabilize for auto-exposure
      await new Promise((r) => setTimeout(r, 700));

      this.isRunning = true;
      console.log('✅ Camera started and ready');
    } catch (error) {
      this.stopStream();
      throw error;
    }
  }

  /**
   * Capture one frame from camera
   * Must call start() first
   */
  async captureFrame(): Promise<string> {
    if (!this.registeredVideo) {
      throw new Error('Camera not registered');
    }

    if (!this.isRunning) {
      throw new Error('Camera not running. Call start() first.');
    }

    try {
      console.log('📸 Capturing frame...');

      // Create canvas same size as video
      const canvas = document.createElement('canvas');
      canvas.width = this.registeredVideo.videoWidth;
      canvas.height = this.registeredVideo.videoHeight;

      if (!canvas.width || !canvas.height) {
        throw new Error('Video dimensions not available');
      }

      // Draw current frame
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(this.registeredVideo, 0, 0);

      // Convert to data URL (JPEG for size efficiency)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      console.log(
        `✅ Frame captured (${canvas.width}x${canvas.height}, ${(dataUrl.length / 1024).toFixed(2)}KB)`
      );

      return dataUrl;
    } catch (error) {
      console.error('Frame capture failed:', error);
      throw error;
    }
  }

  /**
   * Stop camera stream
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping camera...');
    this.stopStream();
    this.isRunning = false;
    console.log('✅ Camera stopped');
  }

  /**
   * Internal stream cleanup
   */
  private stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }
    if (this.registeredVideo) {
      this.registeredVideo.srcObject = null;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async captureSnapshot(): Promise<string> {
    await this.start();
    const data = await this.captureFrame();
    await this.stop();
    return data;
  }
}

// Singleton instance
const cameraControllerEnhanced = new CameraControllerEnhanced();

// Export for use
export function getCameraController() {
  return cameraControllerEnhanced;
}

export const cameraController = cameraControllerEnhanced;
export default cameraControllerEnhanced;
