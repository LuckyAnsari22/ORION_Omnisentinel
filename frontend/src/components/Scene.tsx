import { useMemo, Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Stars, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

import { OmniSentinel } from './OmniSentinel';
import { FeatureNode } from './FeatureNode';
import { OrganicOcean } from './OrganicOcean';
import { SYSTEMS, ANIMATION_CONFIG } from '../utils/constants';
import { useAppStore } from '../store/appStore';

// Cinematic Camera Controller
const CinematicCamera = () => {
    const { camera, mouse } = useThree();
    const targetPos = useMemo(() => new THREE.Vector3(0, 0, 12), []);
    const cursor = useMemo(() => new THREE.Vector2(), []);

    useFrame((state) => {
        // Smooth easing for mouse parallax
        cursor.lerp(mouse, 0.05);

        // Circular orbit logic combined with mouse movement
        const time = state.clock.getElapsedTime();
        const orbitRadius = 0.5;

        targetPos.x = Math.sin(time * 0.2) * orbitRadius + cursor.x * 2.0;
        targetPos.y = Math.cos(time * 0.1) * orbitRadius + cursor.y * 1.5;
        targetPos.z = 12 + Math.sin(time * 0.3) * 0.5; // Breathing Z

        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(0, 0, 0);
    });

    return null;
};

// Interactive Ring Controller
const SystemRing = ({ children }: { children: React.ReactNode }) => {
    const groupRef = useRef<THREE.Group>(null);
    const targetRotation = useRef(0);

    useFrame((_state, delta) => {
        if (groupRef.current) {
            // Smooth lerp to target rotation
            groupRef.current.rotation.y = THREE.MathUtils.lerp(
                groupRef.current.rotation.y,
                targetRotation.current,
                delta * 2 // Smoothing speed
            );
        }
    });

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            // Scroll down = Rotate Right, Scroll Up = Rotate Left
            const speed = 0.001;
            targetRotation.current += e.deltaY * speed;
        };

        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    return (
        <group ref={groupRef}>
            {children}
        </group>
    );
};

// Main Scene Component
export const Scene = () => {
    const navigate = useNavigate();
    const { setTransitioning, setCurrentSystem } = useAppStore();

    const handleNodeClick = (systemKey: keyof typeof SYSTEMS) => {
        const system = SYSTEMS[systemKey];
        setTransitioning(true);
        setCurrentSystem(system.id);

        setTimeout(() => {
            // "Link Mode": Open app in new tab (Original behavior requested)
            if (system.url.startsWith('http')) {
                window.open(system.url, '_blank');
            } else {
                navigate(system.url);
            }
            setTransitioning(false);
        }, ANIMATION_CONFIG.fadeDuration);
    };

    return (
        <Canvas
            dpr={[1, 2]}
            gl={{
                antialias: true,
                powerPreference: 'high-performance',
                alpha: true
            }}
        >
            <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={45} />
            <CinematicCamera />

            {/* Organic Lighting */}
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 20, 10]} angle={0.2} penumbra={1} intensity={2} color="#00ffff" />
            <pointLight position={[-10, -10, -10]} color="#4B0082" intensity={1.5} />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Background Ocean of Energy */}
            <OrganicOcean />

            {/* Central Spirit Core - OmniSentinel */}
            <OmniSentinel />

            {/* Rotatable System Ring - Tilted for Better Visibility */}
            <SystemRing>
                <group rotation={[Math.PI / 9, 0, 0]}> {/* 20 Degree Tilt */}
                    {Object.entries(SYSTEMS).map(([key, system], index, array) => {
                        const total = array.length;
                        // Wider Layout to prevent overlap
                        const radius = 12;
                        const angle = (index / total) * Math.PI * 2;
                        const x = Math.cos(angle) * radius;
                        const z = Math.sin(angle) * radius;

                        return (
                            <group key={key}>
                                {/* Connecting Neural Line */}
                                <line>
                                    <bufferGeometry>
                                        <float32BufferAttribute
                                            attach="attributes-position"
                                            args={[new Float32Array([0, 0, 0, x, 0, z]), 3]}
                                        />
                                    </bufferGeometry>
                                    <lineBasicMaterial attach="material" color={system.color} transparent opacity={0.15} linewidth={1} />
                                </line>

                                {/* Feature Node - Auto Billboard handled in component */}
                                <FeatureNode
                                    systemId={system.id}
                                    position={[x, 0, z]}
                                    color={system.color}
                                    label={system.name}
                                    icon={system.icon}
                                    onClick={() => handleNodeClick(key as any)}
                                />
                            </group>
                        );
                    })}
                </group>
            </SystemRing>

            {/* Beautiful Team Signature - Using HTML to avoid WebGL Text Crashes */}
            <Html position={[0, -6, 0]} center transform>
                <div style={{
                    fontFamily: 'Orbitron, sans-serif',
                    color: '#00ffff',
                    fontSize: '24px',
                    letterSpacing: '4px',
                    textShadow: '0 0 10px #00ffff',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                }}>
                    MADE BY TEAM OUTLIERS
                </div>
            </Html>

            {/* OrbitControls for backup navigation if scroll fails */}
            <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />

            <Suspense fallback={null}>
                <Environment preset="city" />
            </Suspense>
        </Canvas>
    );
};
