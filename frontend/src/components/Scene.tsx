import { useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
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

// Main Scene Component
export const Scene = () => {
    const navigate = useNavigate();
    const { setTransitioning, setCurrentSystem } = useAppStore();

    const handleNodeClick = (systemKey: keyof typeof SYSTEMS) => {
        const system = SYSTEMS[systemKey];
        setTransitioning(true);
        setCurrentSystem(system.id as any);

        setTimeout(() => {
            navigate(system.url);
            setTransitioning(false);
        }, ANIMATION_CONFIG.fadeDuration);
    };

    return (
        <Canvas
            dpr={1} // Peak Performance
            gl={{
                antialias: true,
                powerPreference: 'high-performance',
                alpha: true
            }}
            onCreated={({ gl }) => {
                gl.domElement.addEventListener('webglcontextlost', (event) => {
                    event.preventDefault();
                    window.location.reload();
                }, false);
            }}
        >
            <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={40} />
            <CinematicCamera />

            {/* Organic Lighting */}
            <ambientLight intensity={0.2} />
            <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={2} color="#00ffff" />
            <pointLight position={[-10, -10, -10]} color="#4B0082" intensity={1} />

            {/* Background Ocean of Energy */}
            <OrganicOcean />

            {/* Central Spirit Core - OmniSentinel */}
            <OmniSentinel />

            {/* Integrated Portals */}
            {Object.entries(SYSTEMS).map(([key, system]) => (
                <FeatureNode
                    key={key}
                    systemId={system.id}
                    position={system.position as [number, number, number]}
                    color={system.color}
                    label={system.name}
                    icon={system.icon}
                    onClick={() => handleNodeClick(key as any)}
                />
            ))}

            <Suspense fallback={null}>
                <Environment preset="night" />
            </Suspense>
        </Canvas>
    );
};
