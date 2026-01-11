/**
 * MODE CONTROLLER
 * 5+ Distinct operating modes with completely different behaviors
 * Each mode has unique AI prompts, behavior, and voice feedback
 */

import { gemini3Engine } from './intelligence/gemini3VisionEngine';
import type { ImageAnalysisContext, ProductAnalysis } from './intelligence/gemini3VisionEngine';
import { conversationManager } from './conversationManager';

export type AppMode = 'standby' | 'scan' | 'shopping' | 'surroundings' | 'learning' | 'conversation';

export interface ModeState {
  currentMode: AppMode;
  isActive: boolean;
  modeStartTime: number;
  modeData: Record<string, any>;
}

export interface ModeHandler {
  onEnter(): Promise<string>; // Voice feedback when entering
  onExit(): Promise<void>;
  processCamera(imageData: string | Uint8Array): Promise<string>;
  processVoice(transcript: string): Promise<string>;
  getName(): string;
  getDescription(): string;
}

/**
 * SCAN MODE: Product Identification
 * Instantly identify any product shown to camera
 */
class ScanMode implements ModeHandler {
  private lastScannedProduct: ProductAnalysis | null = null;

  async onEnter(): Promise<string> {
    return "Product scanner active. Point camera at any item and I'll identify it completely for you.";
  }

  async onExit(): Promise<void> {
    this.lastScannedProduct = null;
  }

  async processCamera(imageData: string | Uint8Array): Promise<string> {
    try {
      const context: ImageAnalysisContext = {
        mode: 'scan',
        currentQuery: 'Identify this product completely'
      };

      const analysis = await gemini3Engine.analyzeImage(imageData, context);
      this.lastScannedProduct = analysis;

      // Add to conversation history
      conversationManager.addTurn(
        'User scanned a product',
        analysis.description,
        'scan'
      );

      return analysis.description;
    } catch (error) {
      console.error('Error in scan mode:', error);
      return "Sorry, I couldn't analyze that image. Please try again with better lighting.";
    }
  }

  async processVoice(transcript: string): Promise<string> {
    const lower = transcript.toLowerCase();

    // "Remember this as..." command
    if (lower.includes('remember') || lower.includes('save')) {
      const match = transcript.match(/(?:remember|save|learn)\s+(?:this\s+)?as\s+(.+)/i);
      if (match && this.lastScannedProduct) {
        const customName = match[1].trim();
        conversationManager.learnItem(
          customName,
          this.lastScannedProduct.description,
          this.lastScannedProduct.category
        );
        return `Got it! I'll remember this as "${customName}". Next time I see something similar, I'll call it that.`;
      }
    }

    // Questions about last scanned product
    if (this.lastScannedProduct) {
      if (lower.includes('price') || lower.includes('cost')) {
        return `The estimated price is ${this.lastScannedProduct.estimatedPrice || 'not visible on packaging'}. This can vary by store and location.`;
      }

      if (lower.includes('color') || lower.includes('look')) {
        const colors = this.lastScannedProduct.colors?.join(', ') || 'various colors';
        return `This product features ${colors}. ${this.lastScannedProduct.description}`;
      }

      if (lower.includes('safe') || lower.includes('allergen') || lower.includes('warning')) {
        return this.lastScannedProduct.safetyInfo || 'No specific safety warnings visible on the packaging.';
      }

      if (lower.includes('ingredient') || lower.includes('what')) {
        return `This is a ${this.lastScannedProduct.category}. ${this.lastScannedProduct.description}`;
      }
    }

    return "I'm ready to scan. Point camera at a product and I'll identify it. Or ask me a question about what you just scanned.";
  }

  getName(): string {
    return 'Scan';
  }

  getDescription(): string {
    return 'Identify any product instantly';
  }
}

/**
 * SHOPPING MODE: Find Specific Products
 * Help user find a product they're looking for
 */
class ShoppingMode implements ModeHandler {
  private targetProduct: string | null = null;
  private searchActive = false;
  private foundLocations: string[] = [];

  async onEnter(): Promise<string> {
    return "Shopping mode active. Tell me what you're looking for and I'll help you find it. You can also pan camera across shelves and I'll alert you when I spot the product.";
  }

  async onExit(): Promise<void> {
    this.targetProduct = null;
    this.searchActive = false;
    this.foundLocations = [];
  }

  async processCamera(imageData: string | Uint8Array): Promise<string> {
    if (!this.searchActive || !this.targetProduct) {
      return "Tell me what product you're looking for first.";
    }

    try {
      const context: ImageAnalysisContext = {
        mode: 'shopping',
        targetProduct: this.targetProduct,
        currentQuery: `Is the ${this.targetProduct} visible in this view?`
      };

      const analysis = await gemini3Engine.analyzeImage(imageData, context);

      // Check if target product was found
      if (analysis.description.toLowerCase().includes('found') || 
          analysis.description.toLowerCase().includes('yes')) {
        this.foundLocations.push(analysis.description);
        return `✅ Found it! ${analysis.description}`;
      }

      return `${analysis.description} (Still searching for ${this.targetProduct})`;
    } catch (error) {
      console.error('Error in shopping mode:', error);
      return `Error searching. Please point camera at a different shelf.`;
    }
  }

  async processVoice(transcript: string): Promise<string> {
    const lower = transcript.toLowerCase();

    // Extract product name from various phrasings
    let match = transcript.match(/(?:find|search for|looking for|need|where|show me|where are|looking for|i need|i want)\s+(?:(?:my|the|a)\s+)?(.+?)(?:\?|$)/i);
    
    if (match) {
      this.targetProduct = match[1].trim();
      this.searchActive = true;
      this.foundLocations = [];

      console.log(`🛍️ Shopping Mode: Looking for "${this.targetProduct}"`);

      // Check if it's a learned item
      const learned = conversationManager.findLearnedItem(this.targetProduct);
      if (learned) {
        return `Looking for your "${learned.customName}" - ${learned.visualDescription.substring(0, 100)}. Pan camera slowly across the shelves. I'll alert you when I see it.`;
      }

      return `Searching for ${this.targetProduct}. Pan your camera slowly across the shelves and I'll alert you when I find it.`;
    }

    // Stop search
    if (lower.includes('stop') || lower.includes('found') || lower.includes('done')) {
      this.searchActive = false;
      if (this.foundLocations.length > 0) {
        return `Great! I found ${this.targetProduct} in ${this.foundLocations.length} location(s). Happy shopping!`;
      }
      return "Search stopped. Let me know if you need help finding something else.";
    }

    // Give search guidance
    if (lower.includes('help') || lower.includes('where')) {
      return "Move your camera slowly from left to right across the shelf. I'll let you know as soon as I spot " + (this.targetProduct || "it") + ".";
    }

    return `What product are you looking for? Say "find [product name]"`;
  }

  getName(): string {
    return 'Shopping';
  }

  getDescription(): string {
    return 'Find products you\'re looking for';
  }
}

/**
 * SURROUNDINGS MODE: Environmental Awareness
 * Describe complete spatial layout and environment
 */
class SurroundingsMode implements ModeHandler {
  private lastSpatialAnalysis: any = null;

  async onEnter(): Promise<string> {
    return "Surroundings mode active. I can describe what's around you in detail. Say what you want to know: \"What's on my left?\", \"Describe my surroundings\", or \"Do a 360-degree scan\".";
  }

  async onExit(): Promise<void> {
    this.lastSpatialAnalysis = null;
  }

  async processCamera(imageData: string | Uint8Array): Promise<string> {
    try {
      const context: ImageAnalysisContext = {
        mode: 'surroundings',
        currentQuery: 'Describe all visible objects and spatial layout'
      };

      const analysis = await gemini3Engine.analyzeImage(imageData, context);
      this.lastSpatialAnalysis = analysis;

      conversationManager.addTurn(
        'User requested surroundings description',
        analysis.description,
        'surroundings'
      );

      return analysis.description;
    } catch (error) {
      console.error('Error in surroundings mode:', error);
      return "I couldn't analyze your surroundings. Please hold the camera steady and try again.";
    }
  }

  async processVoice(transcript: string): Promise<string> {
    const lower = transcript.toLowerCase();

    // Directional queries
    if (lower.includes('left')) {
      return this.lastSpatialAnalysis?.description || "Point camera to your left and I'll describe what's there.";
    }

    if (lower.includes('right')) {
      return this.lastSpatialAnalysis?.description || "Point camera to your right and I'll describe what's there.";
    }

    if (lower.includes('behind') || lower.includes('back')) {
      return "Turn 180 degrees backward and point camera back. I'll describe what's behind you.";
    }

    // 360-degree scan
    if (lower.includes('360') || lower.includes('complete') || lower.includes('all around')) {
      return `Let's do a complete 360-degree scan. I'll guide you through each direction. 
      Stand in the center and hold your phone at chest height. 
      First, face forward and point the camera. Say "ready" when you are.`;
    }

    // Default
    return "What would you like to know? Ask about specific directions (left, right, behind) or request a complete 360-degree scan.";
  }

  getName(): string {
    return 'Surroundings';
  }

  getDescription(): string {
    return 'Explore your complete environment';
  }
}

/**
 * LEARNING MODE: Remember and Recognize Items
 * Create visual profiles of items for future recognition
 */
class LearningMode implements ModeHandler {
  private currentLearningItem: ProductAnalysis | null = null;

  async onEnter(): Promise<string> {
    return "Learning mode active. Point camera at an item to learn it, then tell me what to remember it as.";
  }

  async onExit(): Promise<void> {
    this.currentLearningItem = null;
  }

  async processCamera(imageData: string | Uint8Array): Promise<string> {
    try {
      const context: ImageAnalysisContext = {
        mode: 'learning',
        currentQuery: 'Create detailed visual profile for learning and future recognition'
      };

      const analysis = await gemini3Engine.analyzeImage(imageData, context);
      this.currentLearningItem = analysis;

      return `I'm analyzing this item in detail. ${analysis.description}\n\nNow tell me what you want to remember this as. Say "remember this as [name]"`;
    } catch (error) {
      console.error('Error in learning mode:', error);
      return "Couldn't analyze the item. Please try again with better lighting.";
    }
  }

  async processVoice(transcript: string): Promise<string> {
    const lower = transcript.toLowerCase();

    // Remember command
    if (lower.includes('remember') || lower.includes('save') || lower.includes('call')) {
      const match = transcript.match(/(?:remember|save|call)\s+(?:this|it)\s+(?:as\s+)?(.+)/i);
      if (match && this.currentLearningItem) {
        const name = match[1].trim();
        conversationManager.learnItem(
          name,
          this.currentLearningItem.description,
          this.currentLearningItem.category
        );

        return `Perfect! I've learned "${name}" and will recognize it in the future. ${this.currentLearningItem.description}`;
      }
    }

    if (lower.includes('again') || lower.includes('another')) {
      return "Point camera at another item to learn.";
    }

    return "Tell me what to remember this as.";
  }

  getName(): string {
    return 'Learning';
  }

  getDescription(): string {
    return 'Learn and remember items';
  }
}

/**
 * CONVERSATION MODE: Multi-turn Dialogue
 * Answer questions about images with conversation memory
 */
class ConversationMode implements ModeHandler {
  private currentContext: any = null;

  async onEnter(): Promise<string> {
    return "Conversation mode active. Show me something and ask me any questions about it. I'll remember what we discussed.";
  }

  async onExit(): Promise<void> {
    this.currentContext = null;
  }

  async processCamera(imageData: string | Uint8Array): Promise<string> {
    try {
      const context: ImageAnalysisContext = {
        mode: 'conversation',
        currentQuery: 'Analyze for discussion',
        conversationHistory: this.currentContext?.history
      };

      const analysis = await gemini3Engine.analyzeImage(imageData, context);
      this.currentContext = { analysis, history: [] };

      return analysis.description;
    } catch (error) {
      console.error('Error in conversation mode:', error);
      return "I couldn't analyze that. Show me again please.";
    }
  }

  async processVoice(transcript: string): Promise<string> {
    if (!this.currentContext) {
      return "Show me something first by pointing camera.";
    }

    try {
      const context: ImageAnalysisContext = {
        mode: 'conversation',
        currentQuery: transcript,
        conversationHistory: this.currentContext.history
      };

      const analysis = await gemini3Engine.analyzeImage(
        this.currentContext.lastImageData,
        context
      );

      // Add to context history
      this.currentContext.history.push({
        user: transcript,
        assistant: analysis.description
      });

      conversationManager.addTurn(
        transcript,
        analysis.description,
        'conversation'
      );

      return analysis.description;
    } catch (error) {
      console.error('Error processing voice in conversation mode:', error);
      return "I couldn't process that question. Ask me again please.";
    }
  }

  getName(): string {
    return 'Conversation';
  }

  getDescription(): string {
    return 'Ask questions about what you see';
  }
}

/**
 * STANDBY MODE: Idle/Listening
 */
class StandbyMode implements ModeHandler {
  async onEnter(): Promise<string> {
    return "Ready. Choose a mode or ask me something.";
  }

  async onExit(): Promise<void> {}

  async processCamera(): Promise<string> {
    return "Choose a mode first. Say 'scan', 'find', 'surroundings', 'learn', or 'ask'.";
  }

  async processVoice(_transcript: string): Promise<string> {
    return "Please choose a mode.";
  }

  getName(): string {
    return 'Standby';
  }

  getDescription(): string {
    return 'Idle mode';
  }
}

/**
 * MODE CONTROLLER - Manages mode switching and dispatch
 */
class ModeController {
  private currentMode: AppMode = 'standby';
  private modeHandlers: Map<AppMode, ModeHandler>;

  constructor() {
    this.modeHandlers = new Map();
    this.modeHandlers.set('standby', new StandbyMode());
    this.modeHandlers.set('scan', new ScanMode());
    this.modeHandlers.set('shopping', new ShoppingMode());
    this.modeHandlers.set('surroundings', new SurroundingsMode());
    this.modeHandlers.set('learning', new LearningMode());
    this.modeHandlers.set('conversation', new ConversationMode());
  }

  async switchMode(newMode: AppMode): Promise<string> {
    if (!this.modeHandlers.has(newMode)) {
      return `Unknown mode: ${newMode}`;
    }

    // Exit current mode
    const currentHandler = this.modeHandlers.get(this.currentMode);
    if (currentHandler) {
      await currentHandler.onExit();
    }

    // Enter new mode
    this.currentMode = newMode;
    const newHandler = this.modeHandlers.get(newMode);
    const message = await newHandler!.onEnter();

    console.log(`🔄 Mode switched: ${this.currentMode} - ${message}`);
    return message;
  }

  async processCamera(imageData: string | Uint8Array): Promise<string> {
    const handler = this.modeHandlers.get(this.currentMode);
    if (!handler) {
      return "Mode not found.";
    }

    return await handler.processCamera(imageData);
  }

  async processVoice(transcript: string): Promise<string> {
    // Check for mode switching commands
    const modeCommands: Record<string, AppMode> = {
      'scan': 'scan',
      'shopping': 'shopping',
      'find': 'shopping',
      'surroundings': 'surroundings',
      'around': 'surroundings',
      'learn': 'learning',
      'remember': 'learning',
      'ask': 'conversation',
      'talk': 'conversation',
      'conversation': 'conversation'
    };

    for (const [keyword, mode] of Object.entries(modeCommands)) {
      if (transcript.toLowerCase().includes(keyword)) {
        await this.switchMode(mode);
        break;
      }
    }

    const handler = this.modeHandlers.get(this.currentMode);
    if (!handler) {
      return "Mode not found.";
    }

    return await handler.processVoice(transcript);
  }

  getCurrentMode(): AppMode {
    return this.currentMode;
  }

  getModeInfo(): { mode: AppMode; name: string; description: string } {
    const handler = this.modeHandlers.get(this.currentMode);
    return {
      mode: this.currentMode,
      name: handler?.getName() || 'Unknown',
      description: handler?.getDescription() || ''
    };
  }

  getAllModes(): Array<{ mode: AppMode; name: string; description: string }> {
    return Array.from(this.modeHandlers.entries()).map(([mode, handler]) => ({
      mode,
      name: handler.getName(),
      description: handler.getDescription()
    }));
  }
}

// Export singleton
export const modeController = new ModeController();
export default ModeController;
