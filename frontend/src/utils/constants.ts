/**
 * System configuration for ORION NEXUS - The Unified AI Platform
 */
export const SYSTEMS = {
    guardian: {
        id: 'guardian',
        name: 'Guardian AI',
        description: 'Real-time Fall Detection & Senior Safety',
        color: '#00ff88',
        icon: '🤸',
        url: 'https://orion-guardian-ai.vercel.app',
        position: [8, 0, 0] as [number, number, number],
    },
    phantom: {
        id: 'phantom',
        name: 'Phantom Guardian',
        description: 'Advanced Home Intrusion Simulation',
        color: '#ffaa00',
        icon: '🛡️',
        url: 'https://orion-phantom-guardian.vercel.app',
        position: [9.5, 0, 2.5] as [number, number, number],
    },
    visualky: {
        id: 'visualky',
        name: 'VisualKy',
        description: 'Accessibility & Vision Core',
        color: '#ff0088',
        icon: '👁️',
        url: 'https://orion-visualky.vercel.app',
        position: [6.4, 0, 4.7] as [number, number, number],
    },
    biosync: {
        id: 'biosync',
        name: 'BioSync Oracle',
        description: 'AI-Powered Health & Biometric Analysis',
        color: '#FF3333',
        icon: '❤️',
        url: 'https://orion-biosync-oracle.vercel.app',
        position: [2.5, 0, 7.6] as [number, number, number],
    },
    reality: {
        id: 'reality',
        name: 'Reality Anchor',
        description: 'Dementia Care & Cognitive Grounding',
        color: '#5a4bda',
        icon: '⚓',
        url: 'https://orion-reality-anchor.vercel.app',
        position: [-2.5, 0, 7.6] as [number, number, number],
    },
    swarm: {
        id: 'swarm',
        name: 'Swarm Intelligence',
        description: 'Decentralized Emergency Response',
        color: '#00ccff',
        icon: '🕸️',
        url: 'https://orion-swarm-intelligence.vercel.app',
        position: [-6.4, 0, 4.7] as [number, number, number],
    },
    neuro: {
        id: 'neuro',
        name: 'NeuroSync',
        description: 'Data Synchronization & Neural Link',
        color: '#cc00ff',
        icon: '🧠',
        url: 'https://orion-neurosync-guardian.vercel.app',
        position: [-8, 0, 0] as [number, number, number],
    },
    danger: {
        id: 'danger',
        name: 'Danger Maps',
        description: 'Real-time Predictive Threat Cartography',
        color: '#ff0000',
        icon: '🗺️',
        url: 'https://orion-danger-maps.vercel.app',
        position: [-6.4, 0, -4.7] as [number, number, number],
    },
    silent: {
        id: 'silent',
        name: 'Silent Witness',
        description: 'Secure Anonymized Incident Reporting',
        color: '#ffffff',
        icon: '👁️‍🗨️',
        url: 'https://orion-silent-witness.vercel.app',
        position: [-2.5, 0, -7.6] as [number, number, number],
    },
    sonic: {
        id: 'sonic',
        name: 'SonicGuard',
        description: 'Acoustic Threat Detection',
        color: '#00ff88',
        icon: '🔊',
        url: 'https://orion-sonicguard.vercel.app',
        position: [2.5, 0, -7.6] as [number, number, number],
    },
    emotion: {
        id: 'emotion',
        name: 'EmotionGuard',
        description: 'Affective Computing & Mood Analysis',
        color: '#ff0099',
        icon: '😊',
        url: 'https://orion-emotionguard.vercel.app',
        position: [6.4, 0, -4.7] as [number, number, number],
    }
} as const;

export type SystemId = keyof typeof SYSTEMS;

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
    cameraTransitionDuration: 1.5,
    cameraEasing: 'power2.inOut',
    nodeHoverScale: 1.2,
    nodeScaleDuration: 0.3,
    coreBreathingSpeed: 0.5,
    coreBreathingIntensity: 0.05,
    coreRotationSpeed: 0.1,
    particleOrbitSpeed: 0.2,
    particleCount: 200, // Increased for richer visuals
    particleRadius: 3,
    fadeDuration: 500,
} as const;

export const PERFORMANCE_CONFIG = {
    targetFPS: 60,
    enableShadows: true,
    enablePostProcessing: true,
    particleInstancing: true,
} as const;

/**
 * Voice capabilities map
 */
export const VOICE_COMMANDS = {
    'open guardian': 'https://orion-guardian-ai.vercel.app',
    'launch guardian': 'https://orion-guardian-ai.vercel.app',
    'open biosync': 'https://orion-biosync-oracle.vercel.app',
    'check vitals': 'https://orion-biosync-oracle.vercel.app',
    'open reality anchor': 'https://orion-reality-anchor.vercel.app',
    'help dementia': 'https://orion-reality-anchor.vercel.app',
    'open visualky': 'https://orion-visualky.vercel.app',
    'go home': '/',
} as const;
