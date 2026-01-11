/**
 * VISION ENGINE CONFIGURATION
 * Strategy: Multi-Engine Cascade (Gemini → Hugging Face → OpenRouter → Local)
 */

export type VisionEngineType = 'gemini' | 'multi-engine' | 'fallback';

// PRIMARY: Multi-Engine System (cascading fallbacks)
// FALLBACK: Smart offline analysis (always available)
export const PRIMARY_ENGINE: VisionEngineType = 'multi-engine';
export const FALLBACK_ENGINE: VisionEngineType = 'fallback';

export const ENGINE_CONFIG = {
  'multi-engine': {
    name: 'Multi-Engine Vision System',
    type: 'hybrid' as const,
    cost: 'Free tier (multiple providers)',
    requiresInternet: true,
    requiresAPIKey: false, // API key optional, works without it
    offlineCapable: true, // Has local fallback
    priority: 1,
    description: 'Cascading AI: Gemini → Hugging Face → OpenRouter → Local (ZERO DOWNTIME)'
  },
  gemini: {
    name: 'Google Gemini 2.0 Flash',
    type: 'api' as const,
    cost: 'Free tier (15 req/min, ~1,500/day)',
    requiresInternet: true,
    requiresAPIKey: true,
    offlineCapable: false,
    priority: 2,
    description: 'Advanced vision model with detailed analysis (BEST ACCURACY)'
  },
  fallback: {
    name: 'Smart Offline Analysis',
    type: 'local' as const,
    cost: 'Free',
    requiresInternet: false,
    requiresAPIKey: false,
    offlineCapable: true,
    priority: 3,
    description: 'Intelligent offline analysis using image processing'
  }
};

export interface VisionEngine {
  initialize(apiKey?: string): Promise<boolean>;
  analyzeImage(imageData: string | Uint8Array, prompt: string, context?: any): Promise<string>;
  isAvailable(): boolean;
  getName(): string;
}

export function getActiveEngine() {
  return ENGINE_CONFIG[PRIMARY_ENGINE];
}

export function getFallbackEngine() {
  return ENGINE_CONFIG[FALLBACK_ENGINE];
}

export function logEngineStatus() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   MULTI-ENGINE VISION SYSTEM                         ║
╠══════════════════════════════════════════════════════╣
║   🥇 Gemini 2.0 Flash (Best Accuracy)                ║
║   🥈 Hugging Face (FREE, Intelligent)                ║
║   🥉 OpenRouter (FREE Tier)                          ║
║   🛡️  Local Fallback (ALWAYS Available)              ║
╠══════════════════════════════════════════════════════╣
║   Status: Ready for analysis                         ║
║   Strategy: Automatic cascade with zero downtime     ║
╚══════════════════════════════════════════════════════╝
  `);
}
