
import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float, Stars } from "@react-three/drei";
import * as THREE from "three";

// The "Lens" Orb Component
const LensOrb = ({ state }: { state: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [_hovered, setHovered] = useState(false);

    // Dynamic colors based on state
    const colors = {
        IDLE: "#2a2a2a",        // Dark Grey (Sleep)
        LISTENING: "#00ff88",   // Neon Green (Active)
        PROCESSING: "#00ccff",  // Cyan (Thinking)
        SPEAKING: "#ff0088",    // Magenta (Talking)
    };

    useFrame((_state, _delta) => {
        if (meshRef.current) {
            // Pulse effect
            // const speed = hovered ? 2 : 1;
            // meshRef.current.rotation.x += delta * 0.2 * speed;
            // meshRef.current.rotation.y += delta * 0.3 * speed;

            // Breathing scale for listening
            if (state === 'LISTENING') {
                // meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
            }
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <Sphere args={[1.5, 64, 64]} ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                <MeshDistortMaterial
                    color={colors[state]}
                    attach="material"
                    distort={state === 'PROCESSING' ? 0.6 : 0.3} // Glitch effect when thinking
                    speed={state === 'PROCESSING' ? 4 : 2}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Sphere>
        </Float>
    );
};

// Main 3D Scene
export const VisualInterface = ({ voiceState }: { voiceState: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' }) => {
    return (
        <div className="absolute inset-0 -z-10 bg-black">
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color={voiceState === 'SPEAKING' ? "#ff0088" : "#00ccff"} />

                <LensOrb state={voiceState} />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            </Canvas>

            {/* Accessible Overlay Status Text */}
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
                <p className="text-white font-mono text-xl tracking-widest uppercase opacity-80" aria-live="polite">
                    {voiceState}
                </p>
            </div>
        </div>
    );
};
