
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring } from '@react-spring/three';
import { fragmentShader, vertexShader } from './PerceptionShader';

interface PerceptionCoreProps {
    voiceState: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';
    scrollProgress: number; // 0 to 1
}

// "Perception Core" - The Living Heart
export const PerceptionCore: React.FC<PerceptionCoreProps> = ({ voiceState, scrollProgress }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    // State Configuration (Emotion Engine)
    const config = useMemo(() => ({
        IDLE: { colorA: new THREE.Color("#64748b"), colorB: new THREE.Color("#94a3b8"), intensity: 0.2, speed: 0.5 },
        LISTENING: { colorA: new THREE.Color("#3b82f6"), colorB: new THREE.Color("#60a5fa"), intensity: 0.6, speed: 1.2 }, // Focus Blue
        PROCESSING: { colorA: new THREE.Color("#eab308"), colorB: new THREE.Color("#fde047"), intensity: 1.2, speed: 2.0 }, // Active Gold
        SPEAKING: { colorA: new THREE.Color("#ef4444"), colorB: new THREE.Color("#f87171"), intensity: 0.8, speed: 1.0 }  // Warmth
    }), []);

    // Spring Animation for smooth transitions of Shader Uniforms
    const { colorA, colorB, intensity, speed } = useSpring({
        colorA: config[voiceState].colorA.toArray(),
        colorB: config[voiceState].colorB.toArray(),
        intensity: config[voiceState].intensity + (scrollProgress * 0.5),
        speed: config[voiceState].speed,
        config: { mass: 1, tension: 120, friction: 20 }
    });

    useFrame((state) => {
        const t = state.clock.getElapsedTime();

        if (meshRef.current) {
            // Organic Rotation
            meshRef.current.rotation.y = t * 0.1 * (1 + scrollProgress);
            meshRef.current.rotation.z = Math.sin(t * 0.2) * 0.1;
        }

        if (materialRef.current) {
            // Update Uniforms
            materialRef.current.uniforms.uTime.value = t * speed.get();
            materialRef.current.uniforms.uIntensity.value = intensity.get();
            materialRef.current.uniforms.uColorA.value = new THREE.Color().fromArray(colorA.get());
            materialRef.current.uniforms.uColorB.value = new THREE.Color().fromArray(colorB.get());
        }
    });

    // Custom Shader Material using the GLSL definition
    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 0.2 },
                uColorA: { value: new THREE.Color("#64748b") },
                uColorB: { value: new THREE.Color("#94a3b8") }
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
    }, []);

    return (
        <group>
            {/* Main Perception Entity */}
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                {/* @ts-ignore */}
                <mesh ref={meshRef} scale={[1.5, 1.5, 1.5]}>
                    <icosahedronGeometry args={[1, 64]} />
                    <primitive object={shaderMaterial} ref={materialRef} attach="material" />
                </mesh>
            </Float>

            {/* Sub-layers (Outer Shells) for depth */}
            <mesh scale={[2, 2, 2]} rotation={[0.5, 0.5, 0]}>
                <torusGeometry args={[1, 0.02, 16, 100]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.05} />
            </mesh>
            <mesh scale={[2.5, 2.5, 2.5]} rotation={[-0.5, -0.2, 0]}>
                <torusGeometry args={[1.2, 0.01, 16, 100]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.03} />
            </mesh>
        </group>
    );
};
