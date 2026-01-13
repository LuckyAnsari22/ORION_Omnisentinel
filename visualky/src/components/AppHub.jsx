import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text, Float, RoundedBox, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { apps } from '../data/apps';

function AppNode({ app, index, total, radius = 3.5, onSelect }) {
    const mesh = useRef();
    const [hovered, setHovered] = useState(false);

    useCursor(hovered);

    // Calculate position in a circle
    const angle = (index / total) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    useFrame((state) => {
        if (mesh.current) {
            // Billboarding: Make them face the center slightly or the camera
            mesh.current.lookAt(0, 0, 0);

            // Hover animation
            const targetScale = hovered ? 1.2 : 1;
            mesh.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    const handleClick = () => {
        window.open(`http://localhost:${app.port}`, '_blank');
        onSelect && onSelect(app);
    };

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
            <group position={[x, 0, z]} ref={mesh}>
                {/* The "Card" */}
                <RoundedBox
                    args={[1.2, 1.2, 0.1]}
                    radius={0.1}
                    smoothness={4}
                    onClick={handleClick}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                >
                    <meshPhysicalMaterial
                        color={hovered ? app.color : '#222'}
                        emissive={app.color}
                        emissiveIntensity={hovered ? 2 : 0.5}
                        transparent
                        opacity={0.8}
                        metalness={0.8}
                        roughness={0.2}
                        transmission={0.5} // Glass
                        thickness={2}
                    />
                </RoundedBox>

                {/* Floating Label */}
                <Html transform distanceFactor={10} position={[0, -1, 0]} style={{ pointerEvents: 'none' }}>
                    <div style={{
                        textAlign: 'center',
                        color: app.color,
                        fontFamily: 'Orbitron, sans-serif',
                        textShadow: `0 0 10px ${app.color}`,
                        opacity: hovered ? 1 : 0.6,
                        transition: 'opacity 0.3s'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', whiteSpace: 'nowrap' }}>{app.name.toUpperCase()}</h3>
                        {hovered && <p style={{ margin: 0, fontSize: '0.8rem', color: 'white' }}>{app.description}</p>}
                    </div>
                </Html>
            </group>
        </Float>
    );
}

export function AppHub() {
    const group = useRef();

    useFrame((state) => {
        // Slowly rotate the entire ring
        if (group.current) {
            group.current.rotation.y += 0.001;
        }
    });

    return (
        <group ref={group}>
            {apps.map((app, i) => (
                <AppNode key={app.id} app={app} index={i} total={apps.length} />
            ))}
        </group>
    );
}
