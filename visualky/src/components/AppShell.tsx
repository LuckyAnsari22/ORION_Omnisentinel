/**
 * APP SHELL
 * 
 * Main orchestrator component that:
 * 1. Mounts all subsystems (Voice, State, Perception, UI)
 * 2. Manages lifecycle (init, cleanup)
 * 3. Handles window events and device detection
 * 4. Wraps everything in error boundary
 * 
 * Hierarchy:
 * AppShell
 *   ├── ErrorBoundary
 *   │   ├── PerceptionEngine3D (canvas)
 *   │   ├── AccessibleOverlayUI (overlays)
 *   │   └── VoiceSystem (global)
 *   └── Accessibility Control
 */

import React, { useEffect, useRef, useMemo } from 'react';
import PerceptionEngine3D from './3D/PerceptionEngine3D';
import EnhancedOverlayUI from './Accessibility/EnhancedOverlayUI';
import ErrorBoundary from './Common/ErrorBoundary';
import { useSystemState, useSystemStateValue } from '../services/SystemStateStore';
import { useVoiceController, destroyVoiceController } from '../services/voiceSystem';

/**
 * Keyboard navigation handler
 */
const useKeyboardControl = () => {
  const systemState = useSystemStateValue();
  const transitionToListening = useSystemState((s) => s.transitionToListening);
  const transitionToIdle = useSystemState((s) => s.transitionToIdle);
  const voiceController = useVoiceController();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space: Toggle listening
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (systemState === 'IDLE') {
          transitionToListening();
          voiceController.startListening(); // Direct call to voice system
        } else if (systemState === 'LISTENING') {
          voiceController.stopListening(); // Direct call to voice system
          transitionToIdle();
        }
      }

      // Escape: Cancel current operation
      if (e.code === 'Escape') {
        e.preventDefault();
        voiceController.stopListening(); // Direct call
        transitionToIdle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [systemState, transitionToListening, transitionToIdle, voiceController]);
};

/**
 * Device detection and quality adaptation
 */
const useDeviceAdaptation = () => {
  const [deviceProfile, setDeviceProfile] = React.useState<{
    isMobile: boolean;
    isLowPower: boolean;
    touchSupported: boolean;
    memoryGB: number;
  }>({
    isMobile: false,
    isLowPower: false,
    touchSupported: false,
    memoryGB: 0,
  });

  useEffect(() => {
    // Detect device type
    const isMobile = /iPhone|iPad|Android|BlackBerry|Opera Mini/i.test(navigator.userAgent);
    const touchSupported = () => {
      return (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        ((navigator as any).msMaxTouchPoints > 0)
      );
    };

    // Estimate performance (basic)
    const isLowPower = (navigator as any).deviceMemory ? (navigator as any).deviceMemory <= 4 : false;
    const memoryGB = (navigator as any).deviceMemory || 8;

    setDeviceProfile({
      isMobile,
      isLowPower,
      touchSupported: touchSupported(),
      memoryGB,
    });

    // Log device profile
    console.log('Device Profile:', {
      isMobile,
      isLowPower,
      touchSupported: touchSupported(),
      memoryGB,
      processor: navigator.hardwareConcurrency,
    });
  }, []);

  return deviceProfile;
};

/**
 * Gesture handling (for mobile/touch devices)
 */
const useGestureControl = () => {
  const transitionToListening = useSystemState((s) => s.transitionToListening);
  const voiceController = useVoiceController();

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Quick tap (< 500ms, < 50px movement)
      if (deltaTime < 500 && Math.hypot(deltaX, deltaY) < 50) {
        transitionToListening();
        voiceController.startListening(); // Direct call to voice system
      }

      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [transitionToListening, voiceController]);
};

/**
 * Window resize handler (for canvas scaling)
 */
const useWindowResize = () => {
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Voice system initialization
 * Runs ONCE on mount - does NOT manage lifecycle via React state
 */
const VoiceSystemInitializer: React.FC = () => {
  const initRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initRef.current) return;
    initRef.current = true;

    // Initialize voice system (doesn't auto-start)
    // noinspection JSUnusedLocalSymbols - intentionally initialized for setup
    useVoiceController();

    // Voice events will update state directly via store
    // React state should NEVER control voice lifecycle

    return () => {
      // Cleanup on unmount
      destroyVoiceController();
    };
  }, []); // Empty deps - runs ONCE only

  return null; // No UI, just initialization
};

/**
 * Accessibility preferences monitor
 */
const AccessibilityMonitor: React.FC = () => {
  const setReducedMotionPreference = useSystemState((s: any) => s.setReducedMotionPreference);
  const setHighContrast = useSystemState((s: any) => s.setHighContrast);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQueryMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotionPreference(e.matches);
    };
    mediaQueryMotion.addListener(handleMotionChange);
    setReducedMotionPreference(mediaQueryMotion.matches);

    // Check prefers-contrast
    const mediaQueryContrast = window.matchMedia('(prefers-contrast: more)');
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };
    mediaQueryContrast.addListener(handleContrastChange);
    setHighContrast(mediaQueryContrast.matches);

    return () => {
      mediaQueryMotion.removeListener(handleMotionChange);
      mediaQueryContrast.removeListener(handleContrastChange);
    };
  }, [setReducedMotionPreference, setHighContrast]);

  return null;
};

/**
 * Main App Shell Component
 */
export const AppShell: React.FC = () => {
  // Initialize hooks
  useKeyboardControl();
  useGestureControl();
  const deviceProfile = useDeviceAdaptation();
  const windowSize = useWindowResize();
  const state = useSystemStateValue();

  // Calculate 3D engine scale based on device
  const perceptionScale = useMemo(() => {
    if (deviceProfile.isLowPower) return 0.8;
    if (deviceProfile.isMobile) return 0.9;
    return 1;
  }, [deviceProfile]);

  return (
    <ErrorBoundary>
      <div
        className="w-screen h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
        role="application"
        aria-label="LocalLens - AI Vision Assistant"
      >
        {/* 3D Perception Engine (Canvas Layer) */}
        <div className="absolute inset-0 w-full h-full">
          <PerceptionEngine3D scale={perceptionScale} />
        </div>

        {/* Enhanced Overlay UI with visible controls */}
        <EnhancedOverlayUI />

        {/* Voice System Controller */}
        <VoiceSystemInitializer />

        {/* Accessibility Preferences Monitor */}
        <AccessibilityMonitor />

        {/* Hidden screen reader announcements */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Status announcements"
        >
          LocalLens is {state === 'LISTENING' ? 'listening' : state.toLowerCase()}
        </div>

        {/* Debug info (development only) */}
        {import.meta.env.DEV && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-black/50 p-2 rounded z-50">
            <div>State: {state}</div>
            <div>Device: {deviceProfile.isMobile ? 'Mobile' : 'Desktop'}</div>
            <div>Size: {windowSize.width}x{windowSize.height}</div>
            <div>Memory: {deviceProfile.memoryGB}GB</div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AppShell;
