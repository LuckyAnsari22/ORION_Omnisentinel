/**
 * System configuration for AI modules
 */
export const SYSTEMS = {
    guardian: {
        id: 'guardian',
        name: 'Guardian AI',
        description: 'Fall Detection System for elderly care',
        color: '#00ff88',
        icon: '🛡️',
        url: '/guardian',
        position: [6, 0, 0] as [number, number, number],
    },
    visualky: {
        id: 'visualky',
        name: 'Visualky',
        description: 'Visual Intelligence Assistant',
        color: '#ff0088',
        icon: '👁️',
        url: '/visualky',
        position: [-6, 0, 0] as [number, number, number],
    },
} as const;

export type SystemId = keyof typeof SYSTEMS;

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
    // Camera transitions
    cameraTransitionDuration: 1.5,
    cameraEasing: 'power2.inOut',

    // Node animations
    nodeHoverScale: 1.2,
    nodeScaleDuration: 0.3,

    // Core animations
    coreBreathingSpeed: 0.5,
    coreBreathingIntensity: 0.05,
    coreRotationSpeed: 0.1,

    // Particle animations
    particleOrbitSpeed: 0.2,
    particleCount: 100,
    particleRadius: 3,

    // Fade transitions
    fadeDuration: 500, // ms
} as const;

/**
 * Performance configuration
 */
export const PERFORMANCE_CONFIG = {
    targetFPS: 60,
    enableShadows: true,
    enablePostProcessing: true,
    particleInstancing: true,
} as const;

/**
 * Voice command configuration
 */
export const VOICE_COMMANDS = {
    'open guardian': '/guardian',
    'launch guardian ai': '/guardian',
    'guardian': '/guardian',
    'open visualky': '/visualky',
    'launch visualky': '/visualky',
    'visualky': '/visualky',
    'go back': '/',
    'home': '/',
    'landing': '/',
} as const;
