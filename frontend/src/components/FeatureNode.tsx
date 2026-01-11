import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store/appStore';
import { ANIMATION_CONFIG } from '../utils/constants';

interface FeatureNodeProps {
    systemId: string;
    position: [number, number, number];
    color: string;
    label: string;
    icon: string;
    onClick: () => void;
}

export const FeatureNode = ({
    systemId,
    position,
    color,
    label,
    icon,
    onClick
}: FeatureNodeProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const { setHoveredNode } = useAppStore();

    // Update global state on hover
    useEffect(() => {
        if (hovered) setHoveredNode(systemId);
        else setHoveredNode(null);
    }, [hovered, systemId, setHoveredNode]);

    useFrame((state, delta) => {
        if (!meshRef.current || !glowRef.current) return;

        // Smooth hover scaling with bouncy easing
        const targetScale = hovered ? 1.5 : 1;
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);

        // Sinusoidal floating motion
        const time = state.clock.elapsedTime;
        meshRef.current.position.y = Math.sin(time + position[0]) * 0.2;

        // Organic Rotation
        meshRef.current.rotation.y += delta * 0.5 * (hovered ? 5 : 1);
        meshRef.current.rotation.z += delta * 0.3;

        // Pulse glow
        const pulse = 1.0 + Math.sin(time * 2) * 0.1;
        glowRef.current.scale.setScalar(hovered ? pulse * 1.5 : pulse);
    });

    return (
        <group position={position}>
            {/* Interactive Core */}
            <mesh
                ref={meshRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    document.body.style.cursor = 'pointer';
                    setHovered(true);
                }}
                onPointerOut={(e) => {
                    document.body.style.cursor = 'auto';
                    setHovered(false);
                }}
            >
                {/* Organic Torus Knot for cinematic complexity */}
                <torusKnotGeometry args={[0.5, 0.15, 64, 16]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 5 : 1}
                    roughness={0}
                    metalness={1}
                />
            </mesh>

            {/* Outer Glow Ring */}
            <mesh ref={glowRef}>
                <ringGeometry args={[1.2, 1.4, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.2}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Label */}
            <Text
                position={[0, -2, 0]}
                fontSize={0.4}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
            >
                {label}
            </Text>

            {/* Tooltip (DOM Overlay) */}
            {hovered && (
                <Html position={[0, 1.5, 0]} center>
                    <div style={{
                        padding: '8px 16px',
                        background: 'rgba(0,0,0,0.8)',
                        color: color,
                        borderRadius: '20px',
                        border: `1px solid ${color}`,
                        WebkitBackdropFilter: 'blur(4px)',
                        backdropFilter: 'blur(4px)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: `0 0 15px ${color}40`,
                        transform: 'translateY(-10px)',
                        transition: 'all 0.3s ease'
                    }}>
                        <span style={{ fontSize: '1.2em' }}>{icon}</span>
                        <span style={{ fontWeight: 'bold' }}>LAUNCH SYSTEM</span>
                    </div>
                </Html>
            )}
        </group>
    );
};
