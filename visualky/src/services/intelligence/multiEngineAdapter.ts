/**
 * MULTI-ENGINE ADAPTER
 * 
 * Integrates the new multi-engine vision system with existing Visualky architecture
 * Provides seamless fallback between Gemini, Hugging Face, OpenRouter, and local analysis
 */

import { multiEngineVision } from '../multiEngineVision';
import type { VisionEngine } from './visionEngineConfig';

/**
 * Multi-Engine Vision Adapter
 * Implements the VisionEngine interface for compatibility with existing system
 */
export class MultiEngineAdapter implements VisionEngine {
    private initialized = false;

    async initialize(apiKey?: string): Promise<boolean> {
        try {
            await multiEngineVision.initialize(apiKey);
            this.initialized = true;
            console.log('✅ Multi-Engine Adapter initialized');
            return true;
        } catch (error) {
            console.error('❌ Multi-Engine Adapter initialization failed:', error);
            // Even if initialization fails, local fallback is always available
            this.initialized = true;
            return true;
        }
    }

    async analyzeImage(
        imageData: string | Uint8Array,
        prompt: string,
        context?: any
    ): Promise<string> {
        if (!this.initialized) {
            throw new Error('Multi-Engine Adapter not initialized');
        }

        // Extract mode from context or default to 'scan'
        const mode = context?.mode || 'scan';

        try {
            const result = await multiEngineVision.analyzeImage(imageData, mode, prompt);

            // Log which engine was used
            console.log(`🎯 Analysis completed using: ${result.engine} (confidence: ${result.confidence})`);

            return result.response;
        } catch (error) {
            console.error('❌ Multi-Engine analysis failed:', error);
            throw error;
        }
    }

    async processVoiceCommand(transcript: string, currentMode: string): Promise<{
        response: string;
        suggestedMode?: string;
    }> {
        if (!this.initialized) {
            throw new Error('Multi-Engine Adapter not initialized');
        }

        try {
            const result = await multiEngineVision.processVoice(transcript, currentMode);

            return {
                response: result.response,
                suggestedMode: result.mode !== currentMode ? result.mode : undefined
            };
        } catch (error) {
            console.error('❌ Voice processing failed:', error);
            throw error;
        }
    }

    getEngineStatus() {
        return multiEngineVision.getEngineStatus();
    }

    isAvailable(): boolean {
        return this.initialized;
    }

    getName(): string {
        const status = multiEngineVision.getEngineStatus();
        if (status.gemini) return 'Gemini 2.0 Flash (Multi-Engine)';
        if (status.huggingface) return 'Hugging Face (Multi-Engine)';
        if (status.openrouter) return 'OpenRouter (Multi-Engine)';
        return 'Local Fallback (Multi-Engine)';
    }
}

// Export singleton instance
export const multiEngineAdapter = new MultiEngineAdapter();
