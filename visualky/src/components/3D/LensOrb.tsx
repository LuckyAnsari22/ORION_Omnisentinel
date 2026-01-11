
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float } from '@react-three/drei';
import * as THREE from 'three';

interface LensOrbProps {
    voiceState: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';
}

export const LensOrb: React.FC<LensOrbProps> = ({ voiceState }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<any>(null);

    // Google-aligned Palette
    // Idle: Slate/Dark (Calm)
    // Listening: Google Blue (Active)
    // Processing: Google Yellow/Green (Thinking)
    // Speaking: Google Red/Violet (Output)
    const stateConfig = useMemo(() => ({
        IDLE: { color: "#334155", distort: 0.3, speed: 1.5, scale: 1 },
        LISTENING: { color: "#4285F4", distort: 0.4, speed: 3, scale: 1.2 }, // Expansion
        PROCESSING: { color: "#FBBC05", distort: 0.8, speed: 5, scale: 1.1 }, // Rapid thinking
        SPEAKING: { color: "#EA4335", distort: 0.4, speed: 2, scale: 1.15 }  // Pulse
    }), []);

    useFrame((state) => {
        if (!meshRef.current || !materialRef.current) return;

        const target = stateConfig[voiceState];
        const t = state.clock.getElapsedTime();

        // Smoothly interpolate color
        materialRef.current.color.lerp(new THREE.Color(target.color), 0.1);

        // Interpolate distortion/speed
        materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, target.distort, 0.05);
        materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, target.speed, 0.05);

        // Breathing/Scale effect
        const baseScale = target.scale;
        const breath = Math.sin(t * 2) * 0.05;
        const currentScale = meshRef.current.scale.x;
        const nextScale = THREE.MathUtils.lerp(currentScale, baseScale + breath, 0.1);

        meshRef.current.scale.setScalar(nextScale);

        // Gentle rotation
        meshRef.current.rotation.y += 0.005;
        meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;

        // Processing jitter
        if (voiceState === 'PROCESSING') {
            meshRef.current.rotation.x += Math.sin(t * 10) * 0.02;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Sphere ref={meshRef} args={[1.5, 128, 128]}>
                <MeshDistortMaterial
                    ref={materialRef}
                    attach="material"
                    color={stateConfig.IDLE.color}
                    distort={0.3}
                    speed={2}
                    roughness={0.2}
                    metalness={0.8}
                // shading={THREE.SmoothShading}
                />
            </Sphere>
        </Float>
    );
};
