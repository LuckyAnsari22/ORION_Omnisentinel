import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';

export function OrionCore() {
    const ref = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (ref.current) {
            ref.current.rotation.x = t * 0.2;
            ref.current.rotation.y = t * 0.3;
            // Pulse effect
            ref.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.05);
        }
    });

    return (
        <Sphere ref={ref} args={[1, 64, 64]} position={[0, 0, 0]}>
            <MeshDistortMaterial
                color="#001133"
                emissive="#0088ff"
                emissiveIntensity={1.5} // Increased glow
                roughness={0.1}
                metalness={1}
                distort={0.4} // Wobbly liquid effect
                speed={2}
                wireframe={false}
            />
        </Sphere>
    );
}
