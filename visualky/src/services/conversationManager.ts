/**
 * CONVERSATION MANAGER
 * Multi-turn context awareness, learned items, user preferences
 * Enables natural conversation with memory
 */

import type { ImageAnalysisContext } from './intelligence/gemini3VisionEngine';

export interface ConversationTurn {
  timestamp: number;
  userInput: string;
  assistantResponse: string;
  mode: string;
  imageContext?: {
    detectedObjects: string[];
    description: string;
  };
}

export interface LearnedItem {
  id: string;
  customName: string;
  visualDescription: string;
  category: string;
  lastSeen: number;
  frequency: number;
  imageHash?: string; // For future recognition
}

export interface UserProfile {
  preferences: Record<string, string>;
  frequentlyAskedAbout: string[];
  learnedItems: Map<string, LearnedItem>;
  location?: string;
  language: string;
}

class ConversationManager {
  private conversationHistory: ConversationTurn[] = [];
  private userProfile: UserProfile = {
    preferences: {},
    frequentlyAskedAbout: [],
    learnedItems: new Map(),
    language: 'en'
  };
  private maxHistoryLength = 20; // Keep last 20 turns
  private learnedItemsStorage = 'visualky_learned_items';

  constructor() {
    this.loadLearnedItems();
  }

  /**
   * Process user input and maintain context
   */
  async processUtterance(
    userInput: string,
    mode: string,
    imageContext?: { detectedObjects: string[]; description: string }
  ): Promise<ImageAnalysisContext> {
    // Build context for AI with conversation history
    const context: ImageAnalysisContext = {
      mode: mode as any,
      currentQuery: userInput,
      conversationHistory: this.getFormattedHistory(),
      userPreferences: this.userProfile.preferences,
      detectedObjects: imageContext?.detectedObjects
    };

    // Understand user intent and extract parameters
    const intent = this.parseIntent(userInput);
    
    if (intent.type === 'find') {
      context.targetProduct = intent.target;
      context.mode = 'shopping';
    } else if (intent.type === 'remember') {
      context.mode = 'learning';
      context.currentQuery = `Remember this as: ${intent.target}`;
    } else if (intent.type === 'surroundings' || intent.type === '360scan') {
      context.mode = 'surroundings';
    }

    return context;
  }

  /**
   * Add conversation turn to history
   */
  addTurn(
    userInput: string,
    assistantResponse: string,
    mode: string,
    imageContext?: { detectedObjects: string[]; description: string }
  ) {
    const turn: ConversationTurn = {
      timestamp: Date.now(),
      userInput,
      assistantResponse,
      mode,
      imageContext
    };

    this.conversationHistory.push(turn);

    // Keep history size manageable
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }

    console.log(`📝 Conversation Turn ${this.conversationHistory.length}: "${userInput}" -> "${assistantResponse.substring(0, 50)}..."`);
  }

  /**
   * Get formatted conversation history for AI context
   */
  private getFormattedHistory(count: number = 5): Array<{ user: string; assistant: string }> {
    return this.conversationHistory
      .slice(Math.max(0, this.conversationHistory.length - count))
      .map(turn => ({
        user: turn.userInput,
        assistant: turn.assistantResponse
      }));
  }

  /**
   * PARSE INTENT from user input
   * Extracts intent type and relevant parameters
   */
  private parseIntent(input: string): {
    type: 'scan' | 'find' | 'remember' | 'surroundings' | '360scan' | 'question' | 'unknown';
    target?: string;
  } {
    const lower = input.toLowerCase();

    // Remember/Learn intent
    if (lower.includes('remember') || lower.includes('save') || lower.includes('learn')) {
      const match = input.match(/(?:remember|save|learn)\s+(?:this\s+)?as\s+(.+)/i);
      return {
        type: 'remember',
        target: match ? match[1].trim() : 'this item'
      };
    }

    // Find/Search intent
    if (lower.includes('find') || lower.includes('search') || lower.includes('looking for') || lower.includes('where')) {
      const match = input.match(/(?:find|search for|looking for)\s+(.+?)(?:\?|$|and|or)/i);
      return {
        type: 'find',
        target: match ? match[1].trim() : 'unknown product'
      };
    }

    // 360/Surroundings intent
    if (lower.includes('360') || lower.includes('complete') || lower.includes('surroundings')) {
      return { type: '360scan' };
    }

    if (lower.includes('where') || lower.includes('around') || lower.includes('environment')) {
      return { type: 'surroundings' };
    }

    // Check if reference to learned item (e.g., "that one", "the thing")
    if (lower.includes('that') || lower.includes('this') || lower.includes('the one')) {
      return { type: 'question' }; // Will use context to understand
    }

    // Default to scan/question
    return { type: 'question' };
  }

  /**
   * Learn/Remember a new item
   */
  learnItem(
    customName: string,
    visualDescription: string,
    category: string,
    imageHash?: string
  ): LearnedItem {
    const id = `learned_${Date.now()}`;
    
    const learnedItem: LearnedItem = {
      id,
      customName,
      visualDescription,
      category,
      lastSeen: Date.now(),
      frequency: 1,
      imageHash
    };

    this.userProfile.learnedItems.set(customName.toLowerCase(), learnedItem);
    this.saveLearnedItems();

    console.log(`🧠 Learned item: "${customName}" - ${visualDescription.substring(0, 50)}...`);
    return learnedItem;
  }

  /**
   * Find learned item by name or description
   */
  findLearnedItem(query: string): LearnedItem | undefined {
    const lowerQuery = query.toLowerCase();
    
    // Exact match
    let item = this.userProfile.learnedItems.get(lowerQuery);
    if (item) {
      item.frequency++;
      item.lastSeen = Date.now();
      return item;
    }

    // Partial match
    for (const [key, value] of this.userProfile.learnedItems.entries()) {
      if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
        value.frequency++;
        value.lastSeen = Date.now();
        return value;
      }
    }

    return undefined;
  }

  /**
   * Get all learned items
   */
  getAllLearnedItems(): LearnedItem[] {
    return Array.from(this.userProfile.learnedItems.values())
      .sort((a, b) => b.frequency - a.frequency); // Sort by frequency
  }

  /**
   * Check if item is in view based on detected objects
   */
  checkLearnedItemsInView(detectedObjects: string[]): LearnedItem[] {
    const foundItems: LearnedItem[] = [];

    for (const learned of this.userProfile.learnedItems.values()) {
      // Check if visual description keywords match detected objects
      const keywords = learned.visualDescription
        .split(/\s+/)
        .filter(w => w.length > 3)
        .map(w => w.toLowerCase());

      for (const keyword of keywords) {
        if (detectedObjects.some(obj => obj.toLowerCase().includes(keyword))) {
          foundItems.push(learned);
          break;
        }
      }
    }

    return foundItems;
  }

  /**
   * Update user preferences
   */
  updatePreference(key: string, value: string) {
    this.userProfile.preferences[key] = value;
    console.log(`⚙️ Preference updated: ${key} = ${value}`);
  }

  /**
   * Get conversation summary for context
   */
  getContextSummary(): string {
    const recentTurns = this.conversationHistory.slice(-3);
    const learnedItemsList = Array.from(this.userProfile.learnedItems.keys()).join(', ');
    
    return `
RECENT CONVERSATION:
${recentTurns.map(t => `- User: "${t.userInput}"\n  Assistant: "${t.assistantResponse.substring(0, 100)}..."`).join('\n')}

LEARNED ITEMS: ${learnedItemsList || 'None yet'}
PREFERENCES: ${Object.entries(this.userProfile.preferences).map(([k, v]) => `${k}=${v}`).join(', ') || 'None set'}
    `;
  }

  /**
   * Storage persistence for learned items
   */
  private saveLearnedItems() {
    try {
      const items: Record<string, LearnedItem> = {};
      for (const [key, value] of this.userProfile.learnedItems.entries()) {
        items[key] = value;
      }
      localStorage.setItem(this.learnedItemsStorage, JSON.stringify(items));
    } catch (error) {
      console.warn("Failed to save learned items:", error);
    }
  }

  private loadLearnedItems() {
    try {
      const stored = localStorage.getItem(this.learnedItemsStorage);
      if (stored) {
        const items = JSON.parse(stored);
        this.userProfile.learnedItems = new Map(Object.entries(items));
        console.log(`📚 Loaded ${this.userProfile.learnedItems.size} learned items`);
      }
    } catch (error) {
      console.warn("Failed to load learned items:", error);
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    console.log("🗑️ Conversation history cleared");
  }

  /**
   * Get current conversation state for debugging
   */
  getState() {
    return {
      historyLength: this.conversationHistory.length,
      learnedItemsCount: this.userProfile.learnedItems.size,
      preferences: this.userProfile.preferences,
      recentTurns: this.conversationHistory.slice(-5)
    };
  }
}

// Export singleton
export const conversationManager = new ConversationManager();
export default ConversationManager;
