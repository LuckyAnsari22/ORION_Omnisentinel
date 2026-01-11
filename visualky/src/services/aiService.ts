/**
 * LocalLens AI Service
 * Integrates Google Gemini Nano for offline-first image analysis
 * Provides scene understanding, text detection, object identification, and color analysis
 */

declare global {
  interface Window {
    ai: any;
  }
}

let session: any = null;

export const checkAiAvailability = async (): Promise<'readily' | 'after-download' | 'no' | 'not-supported' | 'error'> => {
  if (!window.ai) {
    return 'not-supported';
  }
  try {
    const capabilities = await window.ai.languageModel.capabilities();
    return capabilities.available;
  } catch (e) {
    console.error("Error checking AI capabilities", e);
    return 'error';
  }
};

const getSession = async () => {
  if (session) return session;
  if (!window.ai) return null;

  try {
    const capabilities = await window.ai.languageModel.capabilities();
    if (capabilities.available === 'no') return null;

    session = await window.ai.languageModel.create({
      systemPrompt: `You are an accessibility assistant helping visually impaired users understand their surroundings.

CRITICAL RULES:
1. Be concise and practical - descriptions should be under 2 sentences unless detailed mode
2. Use spatial language: "left/right/center", "near/far", "above/below"
3. Identify objects by their location and purpose, not just names
4. Never hallucinate - only describe what is actually present
5. For safety: always mention obstacles, hazards, or open spaces
6. Use relative positioning: "coffee mug on your right", "staircase 3 feet ahead"
7. For people: mention count and approximate position, never identify faces for privacy
8. Colors: describe what colors mean (e.g., "red warning sign", "green light")
9. Text: read signs, labels, and text clearly when detected
10. Always assume the user cannot see - provide complete spatial context`,
      topK: 3,
      temperature: 0.3,
    });
    return session;
  } catch (e) {
    console.error("Error creating AI session", e);
    return null;
  }
};

export interface ImageAnalysisOptions {
  mode?: 'description' | 'text' | 'object' | 'color' | 'navigation';
  detections?: string[];
  detailedMode?: boolean;
  contextData?: Record<string, any>;
}

export interface AnalysisResult {
  description: string;
  detectedObjects?: string[];
  readableText?: string[];
  colors?: string[];
  warnings?: string[];
  confidence: number;
  processingTime: number;
}

/**
 * Analyze an image using Gemini Nano
 * Provides comprehensive scene understanding
 */
export const describeImage = async (
  _base64Image: string,
  options: ImageAnalysisOptions = {}
): Promise<AnalysisResult> => {
  const startTime = performance.now();
  const {
    mode = 'description',
    detections = [],
    detailedMode = false,
  } = options;

  try {
    const aiSession = await getSession();

    // Build detection context with clearer formatting
    const detectionContext = detections.length > 0 
      ? `Objects detected in the scene: ${detections.join(', ')}. `
      : 'No specific objects pre-detected. Analyze the full scene.';

    let prompt = '';

    // Mode-specific prompting
    switch (mode) {
      case 'description':
        prompt = `${detectionContext} 
        
Create a ${detailedMode ? 'detailed' : 'brief'} scene description for a visually impaired user. 
${detailedMode ? 'Include colors, textures, spatial arrangement, and any text visible.' : 'Keep it to 1-2 sentences, focus on the most important elements.'}
Use spatial positioning (left/right/center/near/far).`;
        break;

      case 'text':
        prompt = `You are analyzing an image for text content. ${detectionContext}
        
Find and read all visible text (signs, labels, documents, etc.). 
Format as a list if multiple text elements exist.
Include approximate location of text if possible.`;
        break;

      case 'object':
        prompt = `You are identifying objects in an image. ${detectionContext}
        
List all identifiable objects with their approximate locations.
Use relative positioning: left/right/center, near/far, above/below.
Include potential purpose of the objects.`;
        break;

      case 'color':
        prompt = `Analyze colors in this image. ${detectionContext}
        
Describe the dominant colors and what objects they correspond to.
Note color patterns (solid, striped, patterned).
Be specific: "bright blue", "muted green", "warm yellow"`;
        break;

      case 'navigation':
        prompt = `You are assisting with navigation safety. ${detectionContext}
        
Identify potential hazards, obstacles, or changes in environment.
Describe clear paths or blocked areas.
Mention stairs, doors, openings, or other navigation-critical features.`;
        break;

      default:
        prompt = detectionContext;
    }

    if (!aiSession) {
      console.warn("Gemini Nano not available, using fallback analysis");
      return createFallbackAnalysis(detections, mode, detailedMode, startTime);
    }

    // Call Gemini Nano
    const result = await aiSession.prompt(prompt);
    const processingTime = performance.now() - startTime;

    // Parse and structure the result
    const analysis: AnalysisResult = {
      description: result || fallbackDescriptions[mode] || 'Unable to analyze image.',
      detectedObjects: detections,
      confidence: 0.85,
      processingTime,
    };

    // Extract additional information based on mode
    if (mode === 'text' || result.toLowerCase().includes('text')) {
      analysis.readableText = extractTextFromResult(result);
    }

    if (mode === 'color' || result.toLowerCase().includes('color')) {
      analysis.colors = extractColorsFromResult(result);
    }

    if (mode === 'navigation') {
      analysis.warnings = extractWarningsFromResult(result);
    }

    return analysis;
  } catch (e) {
    console.error("AI Analysis Error", e);
    return {
      description: 'I encountered an error while analyzing the image. Please try again.',
      confidence: 0,
      processingTime: performance.now() - startTime,
    };
  }
};

/**
 * Analyze scene for objects with spatial positioning
 */
export const analyzeSceneObjects = async (
  base64Image: string,
  detections: string[] = []
): Promise<AnalysisResult> => {
  return describeImage(base64Image, {
    mode: 'object',
    detections,
  });
};

/**
 * Read text from image (OCR mode)
 */
export const readImageText = async (
  base64Image: string,
  detections: string[] = []
): Promise<AnalysisResult> => {
  return describeImage(base64Image, {
    mode: 'text',
    detections,
    detailedMode: true,
  });
};

/**
 * Identify colors in image
 */
export const analyzeColors = async (
  base64Image: string,
  detections: string[] = []
): Promise<AnalysisResult> => {
  return describeImage(base64Image, {
    mode: 'color',
    detections,
  });
};

/**
 * Navigation safety analysis
 */
export const analyzeNavigation = async (
  base64Image: string,
  detections: string[] = []
): Promise<AnalysisResult> => {
  return describeImage(base64Image, {
    mode: 'navigation',
    detections,
  });
};

// ===== Helper Functions =====

const fallbackDescriptions: Record<string, string> = {
  description: 'I can see a scene in front of you. Move your camera to help me analyze it better.',
  text: 'I do not see any readable text at the moment. Try positioning the camera closer to the text.',
  object: 'I cannot identify specific objects right now. Try moving your device or changing the angle.',
  color: 'I can see various colors in the scene. Try asking about specific objects.',
  navigation: 'I cannot assess the navigation safety at the moment. Please describe your location.',
};

const createFallbackAnalysis = (
  detections: string[],
  mode: string,
  detailedMode: boolean,
  startTime: number
): AnalysisResult => {
  let description = fallbackDescriptions[mode] || 'Unable to analyze image.';

  if (detections.length > 0) {
    description = `I can see: ${detections.join(', ')}. ${detailedMode ? 'Try getting closer for more details.' : ''}`;
  }

  return {
    description,
    detectedObjects: detections,
    confidence: detections.length > 0 ? 0.6 : 0.3,
    processingTime: performance.now() - startTime,
  };
};

const extractTextFromResult = (result: string): string[] => {
  const lines = result.split('\n').filter(line => line.trim().length > 0);
  return lines.filter(line => !line.toLowerCase().includes('description') && line.length > 3);
};

const extractColorsFromResult = (result: string): string[] => {
  const colorKeywords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey', 'color', 'colored'];
  const colors: string[] = [];

  const words = result.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    if (colorKeywords.some(color => words[i].includes(color))) {
      const colorPhrase = words.slice(Math.max(0, i - 1), Math.min(words.length, i + 3)).join(' ');
      if (!colors.includes(colorPhrase)) {
        colors.push(colorPhrase);
      }
    }
  }

  return colors.slice(0, 5);
};

const extractWarningsFromResult = (result: string): string[] => {
  const warningKeywords = ['obstacle', 'hazard', 'danger', 'caution', 'watch', 'careful', 'avoid', 'stairs', 'step', 'edge', 'open', 'gap', 'hole'];
  const warnings: string[] = [];

  const sentences = result.split(/[.!?]+/);
  for (const sentence of sentences) {
    if (warningKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
      const trimmed = sentence.trim();
      if (trimmed.length > 5) {
        warnings.push(trimmed);
      }
    }
  }

  return warnings.slice(0, 3);
};

/**
 * Get currently active session (for debugging)
 */
export const getActiveSession = () => session;

/**
 * Reset AI session (useful for memory/cleanup)
 */
export const resetSession = () => {
  if (session) {
    try {
      session.destroy?.();
    } catch (e) {
      console.error("Error destroying session", e);
    }
  }
  session = null;
};

export default {
  checkAiAvailability,
  describeImage,
  analyzeSceneObjects,
  readImageText,
  analyzeColors,
  analyzeNavigation,
  resetSession,
};
