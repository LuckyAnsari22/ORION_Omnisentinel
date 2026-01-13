import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { OrionCore } from './components/OrionCore';
import { AppHub } from './components/AppHub';
import { Suspense } from 'react';
import './App.css';

function Scene() {
    return (
        <>
            {/* Cinematic Lighting */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00ffcc" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00cc" />

            {/* Environment for Reflections */}
            <Environment preset="city" />

            {/* The Background Void */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* The Central Intelligence */}
            <OrionCore />

            {/* The App Galaxy */}
            <AppHub />

            {/* Camera Controls */}
            <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={3}
                maxDistance={15}
                autoRotate
                autoRotateSpeed={0.5}
            />
        </>
    );
}

function App() {
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
            {/* 2D HUD Layout */}
            <div style={{
                position: 'absolute', top: 20, left: 20, zIndex: 10,
                color: 'white', fontFamily: 'Orbitron, sans-serif', pointerEvents: 'none'
            }}>
                <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '0 0 20px #00ccff' }}>ORION NEXUS</h1>
                <p style={{ letterSpacing: '2px', opacity: 0.8 }}>SYSTEM: ONLINE // SECURE MODE</p>
            </div>

            <div style={{
                position: 'absolute', bottom: 20, right: 20, zIndex: 10,
                color: '#555', fontFamily: 'monospace', textAlign: 'right'
            }}>
                AI ASSISTANT PLATFORM v2.0<br />
                ALL SYSTEMS NOMINAL
            </div>

            <Canvas camera={{ position: [0, 2, 8], fov: 60 }} dpr={[1, 2]}>
                <Suspense fallback={null}>
                    <Scene />
                    <EffectComposer>
                        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={1.5} />
                        <Vignette eskil={false} offset={0.1} darkness={1.1} />
                    </EffectComposer>
                </Suspense>
            </Canvas>
        </div>
    );
}

export default App;
