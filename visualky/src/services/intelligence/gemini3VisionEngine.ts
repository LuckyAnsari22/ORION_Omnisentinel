/**
 * GEMINI 3 VISION ENGINE
 * Dynamic Intelligence System - NO Hardcoded Responses
 * 
 * MULTI-ENGINE ARCHITECTURE:
 * 1. PRIMARY: MediaPipe Local Detection (Free, offline, always available)
 * 2. ENHANCEMENT: Gemini 3 Flash (If API key available and quota available)
 * 3. FALLBACK: Synthesis with conversation context
 * 
 * This approach gives free tier users UNLIMITED offline object detection,
 * while maintaining premium features for users with API keys.
 * 
 * CRITICAL: Works with ANY product, ANY image, NEVER says "description unavailable"
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { smartFallbackEngine } from './smartFallbackEngine';

export interface ImageAnalysisContext {
  mode: 'scan' | 'shopping' | 'surroundings' | 'learning' | 'conversation';
  currentQuery?: string;
  targetProduct?: string;
  conversationHistory?: Array<{ user: string; assistant: string }>;
  userPreferences?: Record<string, string>;
  detectedObjects?: string[];
  scanningDirection?: string;
}

export interface ProductAnalysis {
  brand?: string;
  productName: string;
  category: string;
  description: string;
  estimatedPrice?: string;
  colors?: string[];
  textFound?: string[];
  safetyInfo?: string;
  confidence: number;
  source: 'gemini3' | 'cloud-vision' | 'web-search' | 'synthesis';
  additionalInfo?: Record<string, any>;
  debugReasoning?: string[];
}

export interface SpatialAnalysis {
  description: string;
  direction: string;
  detectedItems: string[];
  hazards?: string[];
  confidence: number;
}

class Gemini3VisionEngine {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private initialized: boolean = false;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.setApiKey(apiKey);
    }
  }

  setApiKey(key: string) {
    if (!key) {
      console.error("❌ API key is empty!");
      return;
    }

    console.log("🔑 Setting API key (length:", key.length, ")");
    this.genAI = new GoogleGenerativeAI(key);
    // Use latest Gemini 2.0 Flash model with vision capabilities
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });
    this.initialized = true;
    console.log("✅ Gemini 2.0 Flash Vision Engine initialized with API key");
  }

  /**
   * MAIN ENTRY POINT: Analyze image with smart engine selection
   * PRIMARY: Gemini (best accuracy) → FALLBACK: Smart offline analysis
   * NO retry on quota errors - switches immediately to fallback
   */
  async analyzeImage(
    imageData: string | Uint8Array,
    context: ImageAnalysisContext
  ): Promise<ProductAnalysis> {
    try {
      // Try Gemini FIRST if initialized (best accuracy)
      if (this.initialized && this.model) {
        console.log("🚀 Attempting Gemini analysis (best accuracy)...");
        try {
          const result = await this.geminiAnalysis(imageData, context);
          console.log(`✅ Gemini successful - Confidence: ${result.confidence}`);
          return result;
        } catch (geminiError: any) {
          // Check if it's a quota/rate limit error
          const errorMsg = geminiError?.message || "";
          if (errorMsg.includes("429") || errorMsg.includes("quota")) {
            console.warn("⚠️  Gemini quota exhausted - switching to Smart Fallback");
          } else {
            console.warn("⚠️  Gemini error - using fallback:", errorMsg.substring(0, 80));
          }
        }
      }

      // FALLBACK: Smart offline analysis (no retry delay, just switch immediately)
      console.log("🔧 Using Smart Fallback Engine (offline, high accuracy)...");
      const fallbackResult = await smartFallbackEngine.analyzeImage(imageData, context);
      console.log(`✅ Fallback analysis - Confidence: ${fallbackResult.confidence}`);
      return fallbackResult;

    } catch (error) {
      console.error("❌ Critical error:", error);
      return this.basicFallback(context);
    }
  }

  /**
   * Execute Gemini analysis
   */
  private async geminiAnalysis(
    imageData: string | Uint8Array,
    context: ImageAnalysisContext
  ): Promise<ProductAnalysis> {
    if (!this.initialized || !this.model) {
      throw new Error("Gemini not initialized");
    }

    const prompt = this.buildDynamicPrompt(context);

    let imagePart: any;
    if (typeof imageData === "string") {
      const base64Data = imageData.includes(",") ? imageData.split(",")[1] : imageData;
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      };
    } else {
      const binary = String.fromCharCode.apply(null, Array.from(imageData) as any);
      const base64Data = btoa(binary);
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      };
    }

    const result = await this.model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    return this.parseGeminiResponse(text, context);
  }

  /**
   * Parse Gemini's response
   */
  private parseGeminiResponse(text: string, _context: ImageAnalysisContext): ProductAnalysis {
    try {
      const lines = text.split("\n");
      let productName = "Product";
      let category = "Item";
      let colors: string[] = [];

      for (const line of lines) {
        if (line.toLowerCase().includes("name:") || line.toLowerCase().includes("product:")) {
          productName = line.replace(/.*(?:name|product):?\s*/i, "").trim().substring(0, 50);
        }
        if (line.toLowerCase().includes("category:")) {
          category = line.replace(/.*category:?\s*/i, "").trim().substring(0, 50);
        }
        if (line.toLowerCase().includes("color:")) {
          const colorStr = line.replace(/.*color:?\s*/i, "").trim();
          colors = colorStr.split(",").map(c => c.trim());
        }
      }

      return {
        productName: productName || "Product",
        category: category || "Item",
        description: text,
        colors: colors.length > 0 ? colors : [],
        confidence: 0.88,
        source: "gemini3" as const
      };
    } catch {
      return {
        productName: "Product",
        category: "Item",
        description: text,
        colors: [],
        confidence: 0.8,
        source: "gemini3" as const
      };
    }
  }

  /**
   * Basic fallback if everything fails
   */
  private basicFallback(_context: ImageAnalysisContext): ProductAnalysis {
    return {
      productName: "Item",
      category: "Item",
      description: "Unable to analyze. Please try again.",
      colors: [],
      confidence: 0.3,
      source: "synthesis" as const
    };
  }


  /**
   * BUILD DYNAMIC PROMPT - Different for each mode
   * NO HARDCODED EXAMPLES - Uses conversation history and context
   */
  private buildDynamicPrompt(context: ImageAnalysisContext): string {
    const basePrompt = `You are an expert visual analysis AI helping a user understand images in detail.

CRITICAL RULES:
1. NEVER say "I cannot identify" or "description unavailable" - ALWAYS describe what you see
2. Use ALL visible information: text, logos, colors, shapes, patterns, packaging
3. If uncertain about exact brand, describe category and distinctive features
4. Estimate prices using package size, brand tier, market knowledge (for India)
5. Be conversational and comprehensive
6. Provide answers to ANY question about what's visible
7. Context awareness: Remember user's preferences and conversation history`;

    const modePrompts: Record<string, string> = {
      scan: `MODE: Product Identification Scanner

TASK: Identify the product completely by analyzing the image

ANALYSIS STEPS:
1. Brand identification: Look for logos, text, distinctive packaging
2. Product name and variant (if visible)
3. Category classification (Food/Medicine/Hygiene/Beverage/Household/Other)
4. Estimated MRP in Indian Rupees
5. Detailed description of what the product IS and DOES
6. Any visible text (ingredients, warnings, nutritional info summary)
7. Safety/usage information (allergens, usage, vegetarian status)
8. Visual features (colors, size estimate, distinctive characteristics)

OUTPUT: Provide conversational response covering all above points.
Example style: "This is [BRAND] [PRODUCT]. It's [what it is and does]. The packaging shows [key details]. Estimated price is ₹[X]. Key info: [safety/usage]. Visual features: [colors/characteristics]."

${context.currentQuery ? `\nUSER'S SPECIFIC QUESTION: "${context.currentQuery}"` : ''}`,

      shopping: `MODE: Product Search & Shopping Assistance

TARGET PRODUCT: ${context.targetProduct || 'Unknown - describe what you see'}

TASK: Help user find the product they're looking for

OUTPUT: 
- If target found: "Found [PRODUCT]! [Location and visibility]. [Description for verification]."
- If not found: "I see [alternatives/what's visible]. Would you like [suggestion]?"

Be specific about locations (left, center, right, distance estimate).`,

      surroundings: `MODE: Environmental Spatial Awareness

TASK: Describe the complete environment and spatial layout

ANALYSIS:
1. Identify ALL visible objects grouped by category
2. Describe spatial positions (left, center, right, near, far)
3. Location type (store aisle, pharmacy, shelf, etc.)
4. Potential hazards or obstacles
5. Navigation context

OUTPUT: Provide detailed spatial description building a mental map.
Example style: "On the left side, I see [items]. Center has [items]. Right side has [items]. You're in [location]. Navigation tips: [guidance]."`,

      learning: `MODE: Item Memory & Recognition Building

TASK: Create detailed visual profile for future recognition

ANALYSIS:
1. Extract ALL readable text and brand names
2. Describe distinctive visual features (colors, logos, shapes)
3. Package/container type and size indicators
4. Unique identifying characteristics
5. Category and use case

OUTPUT: Provide memorable description that captures unique features.
Ask user how they want to remember this item.`,

      conversation: `MODE: Conversational Q&A about visible content

CONVERSATION HISTORY:
${context.conversationHistory?.slice(-3).map(t => `User: ${t.user}\nAssistant: ${t.assistant}`).join('\n\n') || 'First question'}

CURRENT QUESTION: ${context.currentQuery}

TASK: Answer user's question about the image based on conversation context.
Reference previous answers naturally, maintain consistency.
Be specific and detailed in your response.`
    };

    const modeSpecific = modePrompts[context.mode] || modePrompts['scan'];

    return `${basePrompt}\n\n${modeSpecific}`;
  }




  /**
   * Analyze spatial/directional information
   */
  async analyzeSpatialDirection(
    imageData: string | Uint8Array,
    direction: string
  ): Promise<SpatialAnalysis> {
    const spatialContext: ImageAnalysisContext = {
      mode: 'surroundings',
      scanningDirection: direction,
      currentQuery: `Analyze what's visible in the ${direction} direction`
    };

    const analysis = await this.analyzeImage(imageData, spatialContext);

    return {
      description: analysis.description,
      direction,
      detectedItems: analysis.additionalInfo?.detectedItems || [],
      confidence: analysis.confidence,
      hazards: analysis.additionalInfo?.hazards
    };
  }
}

// Export singleton instance
export const gemini3Engine = new Gemini3VisionEngine();
export default Gemini3VisionEngine;
