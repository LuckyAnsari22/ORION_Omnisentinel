import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Text, Stars } from '@react-three/drei';
import * as THREE from 'three';

const Node = ({ position, color, isSelf, label }) => {
    const meshRef = useRef();

    useFrame((state) => {
        // Subtle float animation
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    });

    return (
        <group position={position}>
            <Sphere ref={meshRef} args={[isSelf ? 0.3 : 0.2, 32, 32]}>
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={isSelf ? 2 : 1}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Sphere>
            <Text
                position={[0, 0.4, 0]}
                fontSize={0.2}
                color={color}
                anchorX="center"
                anchorY="middle"
            >
                {label}
            </Text>
            {/* Glow effect */}
            <pointLight distance={3} intensity={isSelf ? 2 : 1} color={color} />
        </group>
    );
};

const Connection = ({ start, end, active }) => {
    const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);

    return (
        <Line
            points={points}
            color={active ? "#00ff88" : "#0044aa"}
            lineWidth={active ? 2 : 1}
            transparent
            opacity={active ? 0.8 : 0.3}
        />
    );
};

export const NetworkVisualizer = ({ myId, peers }) => {
    // Generate random positions for simulated network background
    const simulatedNodes = useMemo(() => {
        const nodes = [];
        for (let i = 0; i < 20; i++) {
            nodes.push({
                id: `sim-${i}`,
                position: [
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10 - 5
                ],
                connectedTo: Math.floor(Math.random() * 20)
            });
        }
        return nodes;
    }, []);

    return (
        <>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            {/* Background Starfield */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />

            {/* Self Node (Center) */}
            <Node position={[0, 0, 0]} color="#00f2ff" isSelf={true} label={`ME (${myId})`} />

            {/* Connected Peers (Real) */}
            {peers.map((peer, index) => {
                // Arrange real peers in a circle around self
                const angle = (index / peers.length) * Math.PI * 2;
                const radius = 4;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;

                return (
                    <group key={peer.id}>
                        <Node position={[x, 0, z]} color="#00ff88" isSelf={false} label={peer.id} />
                        <Connection start={[0, 0, 0]} end={[x, 0, z]} active={true} />
                    </group>
                );
            })}

            {/* Simulated Background Mesh (Aesthetic) */}
            {simulatedNodes.map((node, i) => (
                <group key={node.id}>
                    <Node position={node.position} color="#0044aa" isSelf={false} label="" />
                    {/* Connect to random other node */}
                    <Connection
                        start={node.position}
                        end={simulatedNodes[node.connectedTo].position}
                        active={false}
                    />
                    {/* Random connections to center to imply vast network */}
                    {Math.random() > 0.8 && (
                        <Connection
                            start={node.position}
                            end={[0, 0, 0]}
                            active={false}
                        />
                    )}
                </group>
            ))}
        </>
    );
};
