import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import oceanVert from '../shaders/ocean.vert?raw';
import oceanFrag from '../shaders/ocean.frag?raw';

export const OrganicOcean = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    const shaderArgs = useMemo(() => ({
        uniforms: {
            uTime: { value: 0 },
            uColorLow: { value: new THREE.Color('#00152a') },
            uColorHigh: { value: new THREE.Color('#004f6e') }
        },
        vertexShader: oceanVert,
        fragmentShader: oceanFrag,
        transparent: true,
        side: THREE.DoubleSide
    }), []);

    useFrame((state) => {
        if (!meshRef.current) return;
        (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
    });

    return (
        <mesh
            ref={meshRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -5, 0]}
        >
            <planeGeometry args={[100, 100, 128, 128]} />
            <shaderMaterial {...shaderArgs} />
        </mesh>
    );
};
