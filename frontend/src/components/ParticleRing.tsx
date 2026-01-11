import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleRingProps {
    count?: number;
    radius?: number;
    color?: string;
    speed?: number;
    size?: number;
}

export const ParticleRing = ({
    count = 100,
    radius = 3,
    color = '#4fa1a7',
    speed = 0.2,
    size = 0.05
}: ParticleRingProps) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = new THREE.Object3D();

    // Initialize particles
    const particles = useRef<any[]>(null);
    if (!particles.current) {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            temp.push({
                angle,
                y: (Math.random() - 0.5) * 1, // Vertical spread
                radius: radius + (Math.random() - 0.5) * 0.5, // Radial spread
                speed: (Math.random() * 0.5 + 0.5) * speed, // Varying speed
                scale: Math.random() * 0.5 + 0.5
            });
        }
        particles.current = temp;
    }

    useFrame(() => {
        if (!meshRef.current) return;

        particles.current!.forEach((particle, i) => {
            // Update angle
            particle.angle += particle.speed * 0.01;

            // Calculate position
            const x = Math.cos(particle.angle) * particle.radius;
            const z = Math.sin(particle.angle) * particle.radius;

            // Update dummy object
            dummy.position.set(x, particle.y, z);
            dummy.scale.setScalar(particle.scale);
            dummy.updateMatrix();

            // Update instance
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[size, 10, 10]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={0.6}
                blending={THREE.AdditiveBlending}
            />
        </instancedMesh>
    );
};
