/**
 * ENHANCED AI SERVICE ORCHESTRATOR
 * Coordinates all intelligence systems:
 * - Gemini 3 Vision Engine
 * - Mode Controller
 * - Conversation Manager
 * - Spatial Scanner
 * - Fallback mechanisms
 */

import { gemini3Engine } from './intelligence/gemini3VisionEngine';
import { modeController } from './modeController';
import type { AppMode } from './modeController';
import { conversationManager } from './conversationManager';
import { spatialScanner } from './spatialScanner';

export interface AIServiceConfig {
  geminiApiKey: string;
  enableSpellCorrection?: boolean;
  enableWebSearch?: boolean;
  defaultMode?: AppMode;
}

export interface ProcessingResult {
  response: string;
  confidence: number;
  mode: AppMode;
  metadata?: Record<string, any>;
  error?: string;
}

class AIServiceOrchestrator {
  private initialized = false;
  private config: AIServiceConfig | null = null;

  /**
   * Initialize the AI service with API key
   */
  async initialize(config: AIServiceConfig): Promise<boolean> {
    try {
      this.config = config;

      // Initialize Gemini 3 Engine
      gemini3Engine.setApiKey(config.geminiApiKey);
      console.log("✅ Gemini 3 Vision Engine initialized");

      // Set default mode if specified
      if (config.defaultMode) {
        await modeController.switchMode(config.defaultMode);
      } else {
        await modeController.switchMode('standby');
      }

      this.initialized = true;
      console.log("✅ AI Service Orchestrator fully initialized");

      return true;
    } catch (error) {
      console.error("Failed to initialize AI Service:", error);
      return false;
    }
  }

  /**
   * Check initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * MAIN ENTRY: Process camera frame
   * Integrates all intelligence systems
   */
  async processCameraFrame(imageData: string | Uint8Array): Promise<ProcessingResult> {
    if (!this.initialized) {
      return {
        response: "AI Service not initialized. Please check API key.",
        confidence: 0,
        mode: 'standby',
        error: 'NOT_INITIALIZED'
      };
    }

    try {
      const startTime = performance.now();

      // Process through current mode
      const response = await modeController.processCamera(imageData);
      const mode = modeController.getCurrentMode();

      const processingTime = performance.now() - startTime;

      return {
        response,
        confidence: 0.85,
        mode,
        metadata: {
          processingTimeMs: processingTime,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error("Error processing camera frame:", error);
      return {
        response: "Error processing image. Please try again.",
        confidence: 0,
        mode: modeController.getCurrentMode(),
        error: 'PROCESSING_ERROR'
      };
    }
  }

  /**
   * MAIN ENTRY: Process voice input
   * Handles mode switching, intent parsing, response generation
   */
  async processVoiceInput(transcript: string): Promise<ProcessingResult> {
    if (!this.initialized) {
      return {
        response: "AI Service not initialized.",
        confidence: 0,
        mode: 'standby',
        error: 'NOT_INITIALIZED'
      };
    }

    try {
      const startTime = performance.now();

      // Check for mode switching
      const modeIntents: Record<string, AppMode> = {
        'scan': 'scan',
        'identify': 'scan',
        'shopping': 'shopping',
        'find': 'shopping',
        'search': 'shopping',
        'surroundings': 'surroundings',
        'around': 'surroundings',
        'learn': 'learning',
        'remember': 'learning',
        'conversation': 'conversation',
        'ask': 'conversation',
        'standby': 'standby'
      };

      for (const [keyword, mode] of Object.entries(modeIntents)) {
        if (transcript.toLowerCase().includes(keyword)) {
          const modeResponse = await modeController.switchMode(mode);
          const processingTime = performance.now() - startTime;

          return {
            response: modeResponse,
            confidence: 0.9,
            mode,
            metadata: {
              processingTimeMs: processingTime,
              modeSwitch: true
            }
          };
        }
      }

      // Process through current mode
      const response = await modeController.processVoice(transcript);
      const mode = modeController.getCurrentMode();

      // Add to conversation history
      conversationManager.addTurn(transcript, response, mode);

      const processingTime = performance.now() - startTime;

      return {
        response,
        confidence: 0.85,
        mode,
        metadata: {
          processingTimeMs: processingTime,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error("Error processing voice input:", error);
      return {
        response: "I didn't understand that. Please try again.",
        confidence: 0,
        mode: modeController.getCurrentMode(),
        error: 'VOICE_PROCESSING_ERROR'
      };
    }
  }

  /**
   * Switch to specific mode
   */
  async switchMode(mode: AppMode): Promise<string> {
    return await modeController.switchMode(mode);
  }

  /**
   * Get current mode info
   */
  getCurrentModeInfo() {
    return modeController.getModeInfo();
  }

  /**
   * Get all available modes
   */
  getAvailableModes() {
    return modeController.getAllModes();
  }

  /**
   * Perform 360-degree scan
   */
  async perform360Scan(
    captureCallback: (direction: any) => Promise<any>,
    voiceCallback: (message: string) => Promise<void>
  ) {
    try {
      await modeController.switchMode('surroundings');
      return await spatialScanner.perform360Scan(captureCallback, voiceCallback);
    } catch (error) {
      console.error("Error performing 360 scan:", error);
      throw error;
    }
  }

  /**
   * Learn/Remember an item
   */
  learnItem(
    customName: string,
    visualDescription: string,
    category: string
  ) {
    return conversationManager.learnItem(customName, visualDescription, category);
  }

  /**
   * Get learned items
   */
  getLearnedItems() {
    return conversationManager.getAllLearnedItems();
  }

  /**
   * Get conversation state
   */
  getConversationState() {
    return conversationManager.getState();
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory() {
    conversationManager.clearHistory();
  }

  /**
   * Update user preference
   */
  setUserPreference(key: string, value: string) {
    conversationManager.updatePreference(key, value);
  }

  /**
   * Get context summary for AI
   */
  getContextSummary(): string {
    return conversationManager.getContextSummary();
  }

  /**
   * Error recovery
   */
  async recoverFromError(): Promise<string> {
    console.log("🔄 Attempting error recovery...");
    
    // Clear conversation history if corrupted
    conversationManager.clearHistory();
    
    // Reset to standby mode
    await modeController.switchMode('standby');

    return "System recovered. Back to standby mode.";
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    initialized: boolean;
    geminiReady: boolean;
    modes: number;
    learnedItems: number;
    conversationTurns: number;
  }> {
    const state = conversationManager.getState();

    return {
      initialized: this.initialized,
      geminiReady: !!this.config?.geminiApiKey,
      modes: modeController.getAllModes().length,
      learnedItems: state.learnedItemsCount,
      conversationTurns: state.historyLength
    };
  }

  /**
   * Get diagnostic info
   */
  getDiagnostics() {
    return {
      initialized: this.initialized,
      currentMode: modeController.getModeInfo(),
      conversationState: conversationManager.getState(),
      availableModes: modeController.getAllModes(),
      configReady: !!this.config?.geminiApiKey
    };
  }
}

// Export singleton
export const aiService = new AIServiceOrchestrator();
export default AIServiceOrchestrator;
