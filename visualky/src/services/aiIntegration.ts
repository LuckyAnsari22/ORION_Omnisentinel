/**
 * AI INTEGRATION BRIDGE
 * Connects existing Visualky architecture with Multi-Engine Intelligence System
 * Provides backward compatibility while enabling advanced features
 * 
 * VISION ENGINES AVAILABLE (Cascading Priority):
 * 1. Gemini 2.0 Flash (API-based, best accuracy) → When API key available
 * 2. Hugging Face (FREE, intelligent) → Free tier fallback
 * 3. OpenRouter (FREE tier) → Additional free fallback
 * 4. Local Smart Analysis (OFFLINE, ALWAYS WORKS) → Final fallback
 */

import { aiService as orchestrator } from './aiServiceOrchestrator';
import { gemini3Engine } from './intelligence/gemini3VisionEngine';
import { smartFallbackEngine } from './intelligence/smartFallbackEngine';
import { modeController } from './modeController';
import { conversationManager } from './conversationManager';
import { spatialScanner } from './spatialScanner';
import { logEngineStatus } from './intelligence/visionEngineConfig';
import { smartVoiceVision } from './smartVoiceVision';

/**
 * Initialize the complete AI system with Intelligent Vision
 * Strategy: Intelligent Cascade (Gemini → Groq → Replicate → Smart Local)
 */
export async function initializeAISystem(apiKey?: string): Promise<boolean> {
  try {
    console.log("🚀 Initializing Intelligent Vision System...");

    // Initialize the intelligent vision system
    const { intelligentVision } = await import('./intelligentVisionSystem');
    await intelligentVision.initialize();

    logEngineStatus();

    // Initialize Smart Voice-Vision System
    console.log("🎤 Initializing Smart Voice-Vision System...");
    try {
      await smartVoiceVision.initialize();
      console.log("✅ Smart Voice-Vision System ready!");
    } catch (e) {
      console.warn("⚠️ Smart Voice-Vision System init issue (continuing):", e);
    }

    // Also initialize legacy engines for compatibility
    console.log("🔧 Loading legacy engines for compatibility...");
    const fallbackReady = await smartFallbackEngine.initialize();
    console.log(fallbackReady ? "✅ Fallback engine ready!" : "⚠️ Fallback init warning");

    // Initialize the orchestrator
    const initialized = await orchestrator.initialize({
      geminiApiKey: apiKey || '',
      enableSpellCorrection: true,
      enableWebSearch: false,
      defaultMode: 'standby'
    });

    if (initialized) {
      console.log("✅ AI System fully initialized!");
      console.log("📱 Ready for intelligent vision analysis");
      return true;
    } else {
      console.warn("⚠️ AI System initialized with warnings");
      return true; // Still allow app to work
    }
  } catch (error) {
    console.error("❌ AI initialization error:", error);
    return true; // Still allow app to work with intelligent local
  }
}

/**
 * Analyze camera frame with INTELLIGENT vision system
 * Uses 4-tier cascade: Gemini → Groq → Replicate → Smart Local
 */
export async function analyzeFrame(imageData: string): Promise<{
  analysis: string;
  mode: string;
  confidence: number;
}> {
  try {
    console.log('📸 Analyzing frame with Intelligent Vision...');

    const currentMode = modeController.getCurrentMode();

    // Use intelligent vision system
    const { intelligentVision } = await import('./intelligentVisionSystem');
    const result = await intelligentVision.analyzeImage(
      imageData,
      currentMode,
      '',
      {}
    );

    console.log(`✅ Frame analyzed by ${result.engine} (confidence: ${result.confidence}):`, result.response);

    return {
      analysis: result.response,
      mode: currentMode,
      confidence: result.confidence
    };
  } catch (error) {
    console.error('❌ Error analyzing frame:', error);
    return {
      analysis: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      mode: modeController.getCurrentMode(),
      confidence: 0
    };
  }
}

/**
 * Set video element for Smart Voice-Vision System
 * Call this when camera starts
 */
export function setVideoElement(video: HTMLVideoElement) {
  smartVoiceVision.setVideoElement(video);
  console.log('📹 Video element registered for smart vision analysis');
}

/**
 * Process voice input with SMART VISION integration
 * Immediately captures and analyzes camera frame for action commands
 */
export async function processVoice(transcript: string): Promise<{
  response: string;
  mode: string;
  confidence: number;
  metadata?: any;
}> {
  try {
    console.log('🎤 Processing voice input:', transcript);

    const lower = transcript.toLowerCase();

    // ============================================
    // SMART VISION COMMANDS (immediate action)
    // ============================================
    if (
      lower.includes('find') ||
      lower.includes('where is') ||
      lower.includes('where are') ||
      lower.includes('what is') ||
      lower.includes('identify') ||
      lower.includes('scan this') ||
      lower.includes('around') ||
      lower.includes('surroundings') ||
      lower.includes('what do you see') ||
      lower.includes('behind')
    ) {
      console.log('🚀 Using Smart Voice-Vision System for immediate camera analysis...');
      const smartResult = await smartVoiceVision.processVoiceCommand(transcript);
      
      return {
        response: smartResult.spokenResponse,
        mode: smartResult.action === 'found' ? 'shopping' : 'scan',
        confidence: smartResult.confidence,
        metadata: {
          detectedObjects: smartResult.detectedObjects,
          action: smartResult.action,
          visualAnalysis: smartResult.visualAnalysis,
          engine: 'smartVoiceVision'
        }
      };
    }

    // ============================================
    // FALLBACK TO ORCHESTRATOR (mode switching, etc)
    // ============================================
    const result = await orchestrator.processVoiceInput(transcript);
    console.log('✅ Voice processed:', result);

    return {
      response: result.response,
      mode: result.mode,
      confidence: result.confidence
    };
  } catch (error) {
    console.error('❌ Error processing voice:', error);
    const currentMode = modeController.getCurrentMode();
    console.log('Current mode:', currentMode);

    return {
      response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      mode: currentMode as unknown as string,
      confidence: 0
    };
  }
}

/**
 * Get the current operating mode
 */
export function getCurrentMode(): {
  mode: string;
  name: string;
  description: string;
} {
  return modeController.getModeInfo();
}

/**
 * Switch to a specific mode
 */
export async function switchMode(mode: 'scan' | 'shopping' | 'surroundings' | 'learning' | 'conversation' | 'standby'): Promise<string> {
  return await orchestrator.switchMode(mode);
}

/**
 * Get all available modes
 */
export function getAvailableModes() {
  return orchestrator.getAvailableModes();
}

/**
 * Learn/Remember an item
 */
export function learnItem(customName: string, description: string, category: string) {
  return orchestrator.learnItem(customName, description, category);
}

/**
 * Get all learned items
 */
export function getLearnedItems() {
  return orchestrator.getLearnedItems();
}

/**
 * Perform 360-degree environmental scan
 */
export async function perform360Scan(
  captureFrame: (direction: string) => Promise<string | Uint8Array>,
  speak: (message: string) => Promise<void>
) {
  try {
    return await orchestrator.perform360Scan(captureFrame, speak);
  } catch (error) {
    console.error('Error performing 360 scan:', error);
    throw error;
  }
}

/**
 * Get conversation context for debugging/analysis
 */
export function getContext() {
  return {
    currentMode: getCurrentMode(),
    conversationState: orchestrator.getConversationState(),
    learnedItems: getLearnedItems(),
    contextSummary: orchestrator.getContextSummary()
  };
}

/**
 * System health check
 */
export async function systemHealthCheck() {
  return await orchestrator.healthCheck();
}

/**
 * Get detailed diagnostics
 */
export function getDiagnostics() {
  return orchestrator.getDiagnostics();
}

/**
 * Clear conversation history
 */
export function clearHistory() {
  orchestrator.clearConversationHistory();
}

/**
 * Recover from error
 */
export async function recoverFromError() {
  return await orchestrator.recoverFromError();
}

// Export the orchestrator for advanced usage
export { orchestrator, gemini3Engine, modeController, conversationManager, spatialScanner };
