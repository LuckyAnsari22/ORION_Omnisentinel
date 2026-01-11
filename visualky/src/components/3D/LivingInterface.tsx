import { useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, ContactShadows, ScrollControls, useScroll } from "@react-three/drei";
import { PerceptionCore } from "./PerceptionCore";
import { motion, AnimatePresence } from "framer-motion";
import { useSystemState } from "../../services/systemState";
import { orchestrator } from "../../services/orchestrator";

// SCROLL NARRATIVE COMPONENT
const ScrollInvestigator = ({ voiceState }: { voiceState: any }) => {
    const scroll = useScroll();
    const [progress, setProgress] = useState(0);

    useFrame(() => {
        // Smoothly interpolate progress
        setProgress(scroll.offset);
    });

    return (
        <group>
            {/* The Core reacts to the scroll 'Descent' */}
            <PerceptionCore voiceState={voiceState} scrollProgress={progress} />
        </group>
    );
};

export const LivingInterface = () => {
    // Connect to Global State Machine
    const voiceState = useSystemState((state) => state.mode);

    // Initialize System on Mount (The organism wakes up)
    useEffect(() => {
        orchestrator.initialize();
    }, []);

    // Map system states to visual emotional states
    // CAPTURING -> LISTENING (Focus)
    // RECOVERING -> THINKING (Internal Repair)
    const visualState = (voiceState === 'CAPTURING' ? 'LISTENING' :
        voiceState === 'RECOVERING' ? 'THINKING' :
            voiceState) as any;

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden selection:bg-blue-500/30">

            {/* 3D WORLD LAYER */}
            <div className="absolute inset-0 z-0">
                <Canvas gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} dpr={[1, 1.5]}>
                    <color attach="background" args={['#050510']} /> {/* Deep Void */}

                    <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />

                    {/* Cinematic Lighting - Minimalist */}
                    <ambientLight intensity={0.4} />
                    <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.2} color="#ffffff" />
                    <pointLight position={[-5, -5, -5]} intensity={0.5} color="#4f46e5" /> {/* Indigo Undertone */}

                    <ScrollControls pages={3} damping={0.3}>
                        <ScrollInvestigator voiceState={visualState} />
                    </ScrollControls>

                    <Environment preset="night" blur={0.6} />
                    {/* Shadows purely for grounding, very subtle */}
                    <ContactShadows resolution={512} scale={20} blur={3} opacity={0.3} far={10} color="#000000" />
                </Canvas>
            </div>

            {/* UI OVERLAY - THE 'SILENT OBSEVER' LAYER */}

            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-12">
                {/* Header */}
                <header className="flex justify-between items-start opacity-80 mix-blend-difference">
                    <div className="space-y-1">
                        <h1 className="text-xl md:text-2xl font-light tracking-tighter text-white/90">
                            LocalLens
                        </h1>
                        <div className="flex items-center gap-2">
                            {/* Minimalist State Indicator */}
                            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-1000 ${voiceState === 'IDLE' ? 'bg-white/30' :
                                voiceState === 'LISTENING' ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' :
                                    voiceState === 'THINKING' ? 'bg-amber-400 animate-pulse' :
                                        'bg-emerald-400'
                                }`} />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">
                                {voiceState}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Central Dynamic Label - Only appears in IDLE to prompt, then vanishes */}
                <div className="self-center text-center">
                    <AnimatePresence mode="wait">
                        {voiceState === 'IDLE' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="flex flex-col items-center gap-4"
                            >
                                <p className="text-white/40 font-light text-2xl tracking-tight blur-[0.5px]">
                                    "I am listening."
                                </p>
                                <p className="text-white/20 text-xs uppercase tracking-widest mt-2">
                                    Say "Hey LocalLens"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer - Minimalist hints */}
                <footer className="pointer-events-auto flex justify-center gap-6 text-white/20 text-xs tracking-widest uppercase">
                    <span>Scroll to perceive</span>
                </footer>
            </div>
        </div>
    );
};
