import { create } from 'zustand';

interface AppState {
  // Navigation state
  currentSystem: 'landing' | 'guardian' | 'visualky';
  isTransitioning: boolean;
  
  // Voice command state
  voiceEnabled: boolean;
  lastCommand: string | null;
  
  // 3D scene state
  cameraAnimating: boolean;
  hoveredNode: string | null;
  
  // Actions
  setCurrentSystem: (system: 'landing' | 'guardian' | 'visualky') => void;
  setTransitioning: (transitioning: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setLastCommand: (command: string | null) => void;
  setCameraAnimating: (animating: boolean) => void;
  setHoveredNode: (node: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentSystem: 'landing',
  isTransitioning: false,
  voiceEnabled: false,
  lastCommand: null,
  cameraAnimating: false,
  hoveredNode: null,
  
  // Actions
  setCurrentSystem: (system) => set({ currentSystem: system }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
  setLastCommand: (command) => set({ lastCommand: command }),
  setCameraAnimating: (animating) => set({ cameraAnimating: animating }),
  setHoveredNode: (node) => set({ hoveredNode: node }),
}));
