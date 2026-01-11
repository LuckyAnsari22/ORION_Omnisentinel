import { GoogleGenerativeAI } from "@google/generative-ai";

/*
REFERENCE: https://developer.chrome.com/docs/ai/built-in-apis

Key Requirements:
1. Check if browser supports AI APIs
2. Request capabilities
3. Initialize session
4. Handle errors gracefully
*/

interface GeminiCapabilities {
    available: 'readily' | 'after-download' | 'no';
    defaultTemperature: number;
    defaultTopK: number;
    maxTopK: number;
}

class GeminiNanoService {
    private session: any = null;
    private capabilities: GeminiCapabilities | null = null;
    private cloudModel: any = null;

    setApiKey(key: string) {
        const genAI = new GoogleGenerativeAI(key);
        // Use the flash model for speed
        this.cloudModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("☁️ Connected to Cloud Gemini API");
    }

    hasApiKey(): boolean {
        return !!this.cloudModel;
    }

    async initialize(): Promise<boolean> {
        // Auto-load API key from environment if available
        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (envKey && !this.cloudModel) {
            this.setApiKey(envKey);
        }

        try {
            // STEP 1: Check browser support for Nano
            if (!('ai' in window)) {
                console.warn('AI APIs not supported. Will fallback to Cloud or Simulation.');
                return false;
            }

            // STEP 2: Check capabilities
            // @ts-ignore (AI API is experimental)
            this.capabilities = await window.ai.languageModel.capabilities();

            if (this.capabilities?.available === 'no') {
                console.warn('Gemini Nano not available. Will fallback to Cloud or Simulation.');
                return false;
            }

            // STEP 3: Download model if needed
            if (this.capabilities?.available === 'after-download') {
                console.log('Downloading Gemini Nano model...');
            }

            // STEP 4: Create session
            // @ts-ignore
            this.session = await window.ai.languageModel.create({
                temperature: 0.7,
                topK: 3,
            });

            console.log('✅ Gemini Nano initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize Gemini Nano:', error);
            return false;
        }
    }

    // SIMULATED FALLBACK GENERATOR - Now Intelligent!
    private getSimulatedResponse(type: string, objectName?: string, detections: string[] = []): string {
        // If we have actual detections from MediaPipe, use them!
        if (detections.length > 0) {
            const uniqueItems = Array.from(new Set(detections));
            const itemsList = uniqueItems.join(', ');

            if (type === 'scene') {
                return `I see the following items: ${itemsList}.`;
            }
            if (type === 'object' && objectName) {
                const found = uniqueItems.find(i => i.toLowerCase().includes(objectName.toLowerCase()));
                if (found) return `Yes, I found ${found} in the view.`;
                return `I don't see ${objectName}, but I do see ${itemsList}.`;
            }
        }

        // Previous blind fallback
        const responses: Record<string, string[]> = {
            scene: [
                "I am currently in simulation mode. Point me at objects so I can detect them locally.",
                "Camera active. Waiting for object recognition results."
            ],
            object: [
                `Searching for ${objectName}...`,
                `I need to see the scene better to find ${objectName}.`
            ],
            text: [
                "No text capabilities in simulation mode.",
            ],
            color: [
                "Unable to identify colors in simulation mode."
            ]
        };

        const list = responses[type] || responses['scene'];
        return "(Simulated) " + list[Math.floor(Math.random() * list.length)];
    }

    async analyzeScene(imageData: string, context?: string, detections: string[] = []): Promise<string> {
        // 1. Try On-Device Nano
        if (this.session) {
            try {
                const prompt = `Describe this scene. Context: ${context || ''} Objects visible: ${detections.join(', ')}`;
                return await this.session.prompt(prompt);
            } catch (e) {
                console.warn("Nano prompt failed", e);
            }
        }

        // 2. Try Cloud API (Best Quality)
        if (this.cloudModel) {
            try {
                // Convert base64 "data:image/jpeg;base64,..." to pure base64
                const base64Data = imageData.split(',')[1];
                const imagePart = {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg",
                    },
                };
                const result = await this.cloudModel.generateContent([
                    `You are an AI assistant for the visually impaired. Keep it concise (30 words). ${context || 'Describe this scene.'}`,
                    imagePart
                ]);
                const response = await result.response;
                return response.text();
            } catch (e) {
                console.error("Cloud API failed", e);
            }
        }

        // 3. Fallback to Intelligent Simulation
        return this.getSimulatedResponse('scene', undefined, detections);
    }

    async findObject(imageData: string, objectName: string, detections: string[] = []): Promise<string> {
        if (this.session) {
            try {
                const prompt = `Find "${objectName}". Visible items: ${detections.join(', ')}.`;
                return await this.session.prompt(prompt);
            } catch (e) {
                console.warn("Nano prompt failed for findObject", e);
            }
        }

        if (this.cloudModel) {
            try {
                const base64Data = imageData.split(',')[1];
                const result = await this.cloudModel.generateContent([
                    `Find "${objectName}" in this image. Describe its location. If not found, say so.`,
                    { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                ]);
                return result.response.text();
            } catch (e) {
                console.error("Cloud API failed for findObject", e);
            }
        }

        return this.getSimulatedResponse('object', objectName, detections);
    }

    async readText(imageData: string): Promise<string> {
        // Nano usually can't read text without multimodal input. Cloud is best here.
        if (this.cloudModel) {
            try {
                const base64Data = imageData.split(',')[1];
                const result = await this.cloudModel.generateContent([
                    `Read all visible text in this image. Return just the text.`,
                    { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                ]);
                return result.response.text();
            } catch (e) {
                console.error("Cloud API failed for readText", e);
            }
        }
        return this.getSimulatedResponse('text');
    }

    async identifyColors(imageData: string): Promise<string> {
        if (this.cloudModel) {
            try {
                const base64Data = imageData.split(',')[1];
                const result = await this.cloudModel.generateContent([
                    `Identify main colors and patterns in this view.`,
                    { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                ]);
                return result.response.text();
            } catch (e) {
                console.error("Cloud API failed for identifyColors", e);
            }
        }
        return this.getSimulatedResponse('color');
    }

    // Cleanup
    async destroy(): Promise<void> {
        if (this.session) {
            await this.session.destroy();
            this.session = null;
        }
    }
}

export const geminiService = new GeminiNanoService();
