import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import morphVert from '../shaders/morph.vert?raw';
import morphFrag from '../shaders/morph.frag?raw';

export const AICore = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    const shaderArgs = useMemo(() => ({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('#00ffff') }
        },
        vertexShader: morphVert,
        fragmentShader: morphFrag,
        transparent: true
    }), []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

        // Secondary subtle rotation
        meshRef.current.rotation.y = t * 0.1;
        meshRef.current.rotation.z = t * 0.05;
    });

    return (
        <group>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh ref={meshRef}>
                    <sphereGeometry args={[2, 64, 64]} />
                    <shaderMaterial {...shaderArgs} />
                </mesh>
            </Float>

            {/* Inner Glow Sphere - Cinematic Layer */}
            <mesh scale={0.8}>
                <sphereGeometry args={[2, 32, 32]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.2} wireframe />
            </mesh>
        </group>
    );
};
