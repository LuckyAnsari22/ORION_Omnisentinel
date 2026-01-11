/**
 * PERCEPTION ENGINE 3D
 * 
 * Central 3D entity that reacts to SystemState.
 * Rendered via React Three Fiber + Three.js.
 * 
 * Design:
 * - Abstract, multi-layered translucent geometry
 * - GPU-efficient procedural shaders
 * - Smooth state-driven animations
 * - Accessible (reduced motion support)
 */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useSystemStateValue, useAudioLevel, usePreferencesReducedMotion, useSystemState } from '../../services/SystemStateStore';
import { vertexShader, fragmentShader } from '../../services/StateDrivenShaders';

interface PerceptionCoreProps {
  scale?: number;
}

/**
 * Core 3D mesh that responds to state
 */
const PerceptionCore: React.FC<PerceptionCoreProps> = ({ scale = 1 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  // State subscriptions (memoized to prevent re-renders)
  const state = useSystemStateValue();
  const audioLevel = useAudioLevel();
  const reducedMotion = usePreferencesReducedMotion();
  const processingProgress = useSystemState((s: any) => s.processingProgress);
  const confidenceScore = useSystemState((s: any) => s.confidenceScore);
  const highContrast = useSystemState((s: any) => s.highContrast);

  // Map state to numeric value
  const stateValue = useMemo(() => {
    const stateMap: Record<string, number> = { 'IDLE': 0, 'LISTENING': 1, 'THINKING': 2, 'SPEAKING': 3, 'ERROR': 4 };
    return stateMap[state] ?? 0;
  }, [state]);

  // Create shader material
  const shaderMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uState: { value: stateValue },
        uTime: { value: 0 },
        uAudioLevel: { value: audioLevel.amplitude },
        uProgress: { value: processingProgress },
        uConfidence: { value: confidenceScore },
        uReducedMotion: { value: reducedMotion },
        uHighContrast: { value: highContrast },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      wireframe: false,
    });

    shaderMaterialRef.current = material;
    return material;
  }, [stateValue, audioLevel.amplitude, processingProgress, confidenceScore, reducedMotion, highContrast]);

  // Update uniforms each frame
  useFrame(() => {
    if (shaderMaterialRef.current) {
      timeRef.current += 0.016; // ~60 FPS delta

      shaderMaterialRef.current.uniforms.uState.value = stateValue;
      shaderMaterialRef.current.uniforms.uTime.value = timeRef.current;
      shaderMaterialRef.current.uniforms.uAudioLevel.value = audioLevel.amplitude;
      shaderMaterialRef.current.uniforms.uProgress.value = processingProgress;
      shaderMaterialRef.current.uniforms.uConfidence.value = confidenceScore;
    }

    // Auto-rotate slowly based on state
    if (groupRef.current) {
      const baseRotation = stateValue * 0.1;
      groupRef.current.rotation.y += (baseRotation - groupRef.current.rotation.y) * 0.02;
    }
  });

  // Create multi-layered geometry
  const geometries = useMemo(() => {
    const layer1 = new THREE.IcosahedronGeometry(1 * scale, 6);
    const layer2 = new THREE.IcosahedronGeometry(0.7 * scale, 5);
    const layer3 = new THREE.OctahedronGeometry(0.4 * scale, 5);

    return [layer1, layer2, layer3];
  }, [scale]);

  return (
    <group ref={groupRef}>
      {/* Primary layer */}
      <mesh geometry={geometries[0]} material={shaderMaterial} ref={meshRef} />

      {/* Secondary layers with slight offset */}
      <mesh
        geometry={geometries[1]}
        material={shaderMaterial}
        position={[0.05, 0.1, 0]}
        scale={0.95}
      />
      <mesh
        geometry={geometries[2]}
        material={shaderMaterial}
        position={[-0.08, -0.05, 0.1]}
        scale={0.85}
      />
    </group>
  );
};

/**
 * Lighting system (reacts to state)
 */
const PerceptionLighting: React.FC = () => {
  const state = useSystemStateValue();
  const audioLevel = useAudioLevel();

  const stateIntensity = useMemo(() => {
    const map: Record<string, number> = { 'IDLE': 0.4, 'LISTENING': 0.7, 'THINKING': 0.6, 'SPEAKING': 0.8, 'ERROR': 0.3 };
    return map[state] ?? 0.5;
  }, [state]);

  return (
    <>
      {/* Main light */}
      <pointLight
        position={[5, 5, 5]}
        intensity={stateIntensity * 0.8}
        color={0xffffff}
      />

      {/* Audio-reactive light */}
      <pointLight
        position={[-5, 3, -5]}
        intensity={stateIntensity * (0.3 + audioLevel.amplitude * 0.5)}
        color={0x6666ff}
      />

      {/* Ambient light */}
      <ambientLight intensity={stateIntensity * 0.3} />
    </>
  );
};

/**
 * Main 3D scene renderer
 */
export const PerceptionEngine3D: React.FC<PerceptionCoreProps> = ({ scale = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="w-full h-full relative">
      <Canvas
        ref={canvasRef as any}
        camera={{ position: [0, 0, 3], fov: 50 }}
        dpr={[1, 2]} // Adaptive DPR for performance
        gl={{
          antialias: true,
          alpha: true,
          precision: 'highp',
          preserveDrawingBuffer: true,
        }}
      >
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={50} />

        {/* Lighting */}
        <PerceptionLighting />

        {/* Main perception core */}
        <PerceptionCore scale={scale} />

        {/* Controls (optional, non-blocking) */}
        <OrbitControls
          autoRotate={true}
          autoRotateSpeed={1}
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>

      {/* CSS Backdrop */}
      <style>{`
        canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default PerceptionEngine3D;
