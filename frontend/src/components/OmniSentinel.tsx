import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import morphVert from '../shaders/morph.vert?raw';
import morphFrag from '../shaders/morph.frag?raw';

const SentinelRing = ({ radius, speed, axis }: { radius: number; speed: number; axis: 'x' | 'y' | 'z' }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.elapsedTime * speed;
        if (axis === 'x') ref.current.rotation.x = t;
        if (axis === 'y') ref.current.rotation.y = t;
        if (axis === 'z') ref.current.rotation.z = t;
    });

    return (
        <mesh ref={ref}>
            <torusGeometry args={[radius, 0.02, 16, 100]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
        </mesh>
    );
};

const EnergySpark = ({ count = 50 }) => {
    const pointsRef = useRef<THREE.Points>(null);
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
            velocities[i * 3] = (Math.random() - 0.5) * 0.02;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        }
        return { positions, velocities };
    }, [count]);

    useFrame(() => {
        if (!pointsRef.current) return;
        const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < count; i++) {
            pos[i * 3] += particles.velocities[i * 3];
            pos[i * 3 + 1] += particles.velocities[i * 3 + 1];
            pos[i * 3 + 2] += particles.velocities[i * 3 + 2];

            // Reset particles if they fly too far
            if (Math.abs(pos[i * 3]) > 5) pos[i * 3] *= -0.9;
            if (Math.abs(pos[i * 3 + 1]) > 5) pos[i * 3 + 1] *= -0.9;
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.rotation.y += 0.002;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[particles.positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial size={0.05} color="#00ffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </points>
    );
};

export const OmniSentinel = () => {
    const coreRef = useRef<THREE.Mesh>(null);
    const outerRef = useRef<THREE.Mesh>(null);
    const pulseRef = useRef<THREE.PointLight>(null);

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
        const t = state.clock.elapsedTime;
        if (coreRef.current) {
            (coreRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
            coreRef.current.rotation.y = t * 0.3;
        }
        if (outerRef.current) {
            outerRef.current.rotation.y = -t * 0.1;
            outerRef.current.rotation.z = t * 0.15;
            outerRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
        }
        if (pulseRef.current) {
            pulseRef.current.intensity = 2 + Math.sin(t * 10) * 1.5;
        }
    });

    return (
        <group scale={1.2}>
            <Float speed={3} rotationIntensity={1} floatIntensity={1}>
                {/* Core Neural Entity */}
                <mesh ref={coreRef}>
                    <sphereGeometry args={[1.5, 64, 64]} />
                    <shaderMaterial {...shaderArgs} />
                </mesh>

                {/* Outer Energy Shell */}
                <mesh ref={outerRef}>
                    <sphereGeometry args={[2.2, 64, 64]} />
                    <MeshDistortMaterial
                        color="#00ffff"
                        transparent
                        opacity={0.12}
                        distort={0.4}
                        speed={3}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* Interactive Rings */}
                <SentinelRing radius={2.5} speed={0.5} axis="y" />
                <SentinelRing radius={2.8} speed={0.8} axis="x" />
                <SentinelRing radius={3.2} speed={0.3} axis="z" />

                {/* Energy Sparks */}
                <EnergySpark count={100} />

                {/* Glowing Core Internal */}
                <group>
                    <Sphere args={[0.4, 32, 32]}>
                        <meshBasicMaterial color="#ffffff" />
                    </Sphere>
                    <pointLight ref={pulseRef} distance={15} intensity={3} color="#00ffff" />
                </group>
            </Float>
        </group>
    );
};
