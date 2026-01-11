
// Wrapper for Gemini Nano (window.ai) strictly for reasoning
// NO VISION CAPABILITIES - Pure Logic

export interface Evidence {
    targetObject: string;
    foundCandidates: {
        label: string;
        confidence: number;
        position: { x: number, y: number }; // Center points
        boxArea: number; // Rough size proxy
    }[];
}

// Wrapper for Gemini Nano (window.ai) strictly for reasoning
// NO VISION CAPABILITIES - Pure Logic

export interface Evidence {
    targetObject: string;
    foundCandidates: {
        label: string;
        confidence: number;
        position: { x: number, y: number }; // Center points
        boxArea: number; // Rough size proxy
    }[];
}

export class ReasoningService {
    private session: any = null;

    private readonly SYSTEM_PROMPT = `You are LocalLens, a voice-first assistive AI.

You do not see images.
You only reason over structured evidence.

Rules:
• Accuracy over optimism
• Never hallucinate
• Always respond verbally
• Maximum 40 words

If object found:
'I found your {object}. It is at {position}. {distance}. Near {reference}.'

If not found:
'I do not confidently see your {object}. Try adjusting the camera.'

If scene description:
'You are in a {scene}. In front of you is {object}. To your left is {object}. The path ahead is {clear/blocked}.'`;

    async initialize() {
        if (!('ai' in window)) {
            console.error("Gemini Nano not supported");
            return;
        }

        // @ts-ignore
        const capabilities = await window.ai.languageModel.capabilities();
        if (capabilities.available === 'no') return;

        // @ts-ignore
        this.session = await window.ai.languageModel.create({
            systemPrompt: this.SYSTEM_PROMPT
        });
    }

    async reason(evidence: Evidence): Promise<string> {
        if (!this.session) await this.initialize();
        if (!this.session) return "I cannot process this request right now.";

        // Construct structured input prompt
        // Calculate basic clock face position from x,y
        const candidatesText = evidence.foundCandidates.map(c => {
            // 0,0 is top-left, 1,1 is bottom-right? 
            // Assuming normalized 0-1 from MediaPipeService.
            const x = c.position.x;
            let posStr = "center";
            if (x < 0.4) posStr = "left";
            if (x > 0.6) posStr = "right";

            // Rough distance
            const distStr = c.boxArea > 0.3 ? "close to you" : "further away";

            return `- Found "Target Match" (Confidence: ${(c.confidence * 100).toFixed(0)}%) at ${posStr}, ${distStr}`;
        }).join('\n');

        const prompt = `
TARGET: ${evidence.targetObject}

EVIDENCE:
${candidatesText || "No confident candidates found (Confidence < 0.75)."}

Based on this evidence, where is the ${evidence.targetObject}?`;

        try {
            const response = await this.session.prompt(prompt);
            return response.trim();
        } catch (e) {
            console.error("Reasoning failed", e);
            return "I am having trouble reasoning about the scene.";
        }
    }
}

export const reasoningService = new ReasoningService();
