import { GoogleGenerativeAI } from '@google/generative-ai';
import { IntelligentPromptEngine } from '../advancedPrompts';

// GENERATIVE VISION SERVICE
// Uses Google Gemini (via API) to provide "Rich Intelligence" layer.
// This runs AFTER local verification to provide details local models can't see (angles, text, colors).

class GeminiVisionService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    // We assume the key is available. If not, we might need to ask user or use a public one if set up.
    // Ideally use VITE_GEMINI_API_KEY
    private apiKey: string = import.meta.env.VITE_GEMINI_API_KEY || '';

    initialize() {
        if (!this.apiKey) {
            console.warn("⚠️ Gemini API Key missing. Rich description will be limited.");
            return;
        }
        if (this.genAI) return;

        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fast and capable
        console.log("✨ Gemini Vision Service Initialized");
    }

    async describeScene(
        imageElement: HTMLImageElement,
        verifiedLabels: string[],
        mode: 'description' | 'find' | 'read' | 'color' | 'navigation' | 'product' | 'learn' | 'surroundings' = 'description'
    ): Promise<string> {
        if (!this.model) {
            this.initialize();
            if (!this.model) return `I verified ${verifiedLabels.join(', ')}.`;
        }

        try {
            // 1. Prepare Image
            // We need base64 string
            const canvas = document.createElement('canvas');
            canvas.width = imageElement.width;
            canvas.height = imageElement.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(imageElement, 0, 0);
            const base64Data = canvas.toDataURL('image/jpeg').split(',')[1];

            // 2. Select Prompt
            let prompt = "";
            const context = { userIntent: mode };

            switch (mode) {
                case 'description':
                    prompt = IntelligentPromptEngine.buildScenePrompt("IMAGE", context);
                    break;
                case 'read':
                    prompt = IntelligentPromptEngine.buildTextReadingPrompt('document');
                    break;
                case 'color':
                    prompt = IntelligentPromptEngine.buildColorIdentificationPrompt();
                    break;
                case 'find':
                    // We know what we found locally, ask Gemini to verify/describe it
                    prompt = IntelligentPromptEngine.buildObjectFindingPrompt(verifiedLabels[0] || 'object');
                    break;
                case 'product':
                    prompt = IntelligentPromptEngine.buildProductAnalysisPrompt(verifiedLabels);
                    break;
                case 'surroundings':
                    prompt = IntelligentPromptEngine.buildSurroundingsPrompt(verifiedLabels);
                    break;
                default:
                    prompt = IntelligentPromptEngine.buildScenePrompt("IMAGE");
            }

            // INJECT GROUNDING
            // Critical: We tell Gemini what we *know* is there to prevent hallucinations
            const grounding = `\n\nGROUND TRUTH: Computer vision has positively detected: ${verifiedLabels.join(', ')}. Focus on these.`;

            const result = await this.model.generateContent([
                prompt + grounding,
                { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]);

            const text = result.response.text();
            return this.cleanResponse(text);

        } catch (e) {
            console.error("Gemini Vision Error:", e);
            return `I see ${verifiedLabels.join(', ')}. (Detailed description unavailable)`;
        }
    }

    private cleanResponse(text: string): string {
        // Remove bolding **, headings, etc for speech
        return text.replace(/\*\*/g, '').replace(/#/g, '').trim();
    }
}

export const geminiVision = new GeminiVisionService();
