import { DynamicSystemPrompt } from './intelligenceSpec';

export class IntelligentPromptEngine {

    // CORE PRINCIPLE: Precision + Context + Examples = Accuracy

    /**
     * SCENE ANALYSIS - Hyper-specific prompt
     * Reference: https://ai.google.dev/gemini-api/docs/prompting-strategies#be_specific
     */
    static buildScenePrompt(
        _imageData: string,
        userContext?: {
            previousScene?: string,
            userIntent?: string,
            timeOfDay?: string,
            location?: string,
            userObjects?: string[]
        }
    ): string {
        // Generate dynamic system instruction
        const systemPrompt = DynamicSystemPrompt.generate({
            failures: ["Confusing shadows for objects", "Missing small items on cluttered tables"], // Placeholder for learned failures
            userObjects: userContext?.userObjects || [],
            location: userContext?.location || "Unknown",
            confidence: 0.9
        });

        return `${systemPrompt}

CONTEXT:
${userContext?.previousScene ? `- Previous scene: ${userContext.previousScene}` : ''}
${userContext?.timeOfDay ? `- Time: ${userContext.timeOfDay}` : ''}
${userContext?.location ? `- Location type: ${userContext.location}` : ''}
${userContext?.userIntent ? `- User wants to: ${userContext.userIntent}` : ''}

TASK: Analyze this image with EXTREME precision following this exact structure:

1. IMMEDIATE SAFETY (First sentence, critical):
   - Any hazards? (steps, obstacles, spills, sharp objects)
   - Clearance ahead? (can walk forward safely?)
   Format: "SAFETY: [clear/warning] - [details if warning]"

2. SCENE TYPE & LAYOUT (Second sentence):
   - Room type or environment
   - Approximate size and boundaries
   Format: "ENVIRONMENT: You're in a [size] [room type]."

3. OBJECTS & SPATIAL POSITIONS (Use clock positions + distance):
   For each significant object:
   - Name + exact position (clock position: 12=front, 3=right, 6=behind, 9=left)
   - Height level (floor/low/waist/chest/head/above)
   - Distance (within reach / 3 feet / 6 feet / across room)
   Format: "At [clock position], [height]: [object] at [distance]"

4. TEXT & LABELS (if any):
   - Exact text visible
   - What it's on (sign, label, screen)
   Format: "TEXT: '[exact text]' on [location]"

5. NAVIGATION GUIDANCE (final sentence):
   - Suggested safe direction to walk
   - What to reach for if looking for something
   Format: "NAVIGATION: [specific guidance]"

EXAMPLES OF PERFECT RESPONSES:

Example 1 (Kitchen):
"SAFETY: Clear ahead - no obstacles detected. ENVIRONMENT: You're in a medium kitchen, about 12x10 feet. At 12 o'clock, waist height: kitchen counter with sink at 4 feet. At 2 o'clock, floor level: dining chair at 6 feet. At 9 o'clock, chest height: refrigerator within reach. At 10 o'clock, waist height: stove at 3 feet - handle on your left. TEXT: 'OFF' on stove dial. NAVIGATION: Safe to walk straight ahead for 4 feet, then counter begins."

Example 2 (Office):
"SAFETY: Warning - chair at 1 o'clock, 2 feet ahead - shin height obstacle. ENVIRONMENT: You're in a small office, about 10x10 feet. At 12 o'clock, waist height: desk with laptop at 3 feet. At 3 o'clock, floor to ceiling: bookshelf within reach. At 6 o'clock behind you, head height: door frame. At 10 o'clock, chest height: window at 5 feet. NAVIGATION: Step right to avoid chair, then desk is directly ahead."

CRITICAL RULES:
- Use clock positions (12/3/6/9) + height descriptors ALWAYS
- Estimate distances in feet/within reach
- Mention ALL obstacles that could cause tripping
- Keep total response under 80 words for fast audio playback
- Prioritize SAFETY > OBJECTS > NAVIGATION
- Use present tense ("you're in", not "this is")
- Be direct: no "I see" or "It appears" - state facts

Now analyze this image:`;
    }

    /**
   * OBJECT FINDING - Laser-focused search
   * Reference: https://ai.google.dev/gemini-api/docs/thinking (use step-by-step)
   */
    static buildObjectFindingPrompt(
        objectName: string,
        _roomContext?: string,
        _lastKnownLocation?: string
    ): string {
        return `You are an on-device vision assistant for a visually impaired user.
Your task is to LOCATE a specific object in the image with high precision.

CRITICAL RULES (FOLLOW STRICTLY):
1. ONLY report objects you are confident are visible.
2. If you are unsure, explicitly say you are unsure — DO NOT GUESS.
3. Use spatial reasoning, not labels.
4. Cross-check the object with its surroundings.
5. Prefer accuracy over optimism.

TARGET OBJECT: "${objectName}"

STEP-BY-STEP REASONING (INTERNAL — DO NOT SPEAK):
- Scan the entire image systematically (left → center → right, top → bottom)
- Identify shapes, materials, and typical object features
- Verify size consistency relative to nearby objects
- Verify context (table, floor, hand, bag, shelf, etc.)
- Confirm the object appears at least once clearly

OUTPUT FORMAT (SPEAK EXACTLY THIS WAY):

IF OBJECT IS FOUND:
"I found your ${objectName}. It is [relativePosition]. 
It is [distanceEstimate]. 
It is [supportingContext]."

IF OBJECT IS NOT FOUND:
"I do not see your ${objectName} in this image. 
Try checking nearby surfaces or adjusting the camera angle."

SPATIAL LANGUAGE RULES:
- Horizontal: left / center / right
- Vertical: top / middle / bottom
- Distance: very close / arm’s reach / a few steps away / far
- Reference nearby objects if helpful

WORD LIMIT:
- Maximum 25 words
- No filler words
- No explanations

SAFETY:
If the object could be confused with another item, say so.

Now analyze the image and respond.`;
    }

    /**
     * TEXT READING - OCR enhancement
     * Reference: https://ai.google.dev/gemini-api/docs/vision#read-text
     */
    static buildTextReadingPrompt(textContext?: 'label' | 'document' | 'sign' | 'screen'): string {
        return `You are a precision text reader for visually impaired users.

${textContext ? `EXPECTED TYPE: ${textContext}` : ''}

TEXT EXTRACTION PROTOCOL:

1. DETECT all visible text (even small/blurry)
2. STRUCTURE the information logically
3. CONTEXT - what the text is on/part of
4. PRIORITY - most important info first

OUTPUT FORMAT:

"TEXT FOUND: [what type - label/sign/document]

CONTENT:
[Exact text, preserving line breaks and structure]

LOCATION: [where text appears in image]
TYPE: [printed/handwritten/digital]
CONTEXT: [what it's on - product label, street sign, etc.]"

EXAMPLES:

Example 1 (Product Label):
"TEXT FOUND: Product label

CONTENT:
Organic Whole Milk
1 Gallon (3.78L)
Best By: JAN 15 2026
Keep Refrigerated

LOCATION: Center of image on white carton
TYPE: Printed text
CONTEXT: Milk carton label with red logo at top"

Example 2 (Prescription):
"TEXT FOUND: Medication label - IMPORTANT

CONTENT:
[Patient Name]
Take 1 tablet by mouth daily
Medication: [Name] 50mg
Refills: 2 remaining
Dr. [Name]

LOCATION: White prescription bottle label
TYPE: Printed text
CONTEXT: Critical medication information - read carefully"

If NO TEXT:
"NO TEXT: No visible text detected in this image. The image shows [brief description]. If you're looking for text, try getting closer or adjusting the angle."

CRITICAL RULES:
- Read text EXACTLY as written (spelling, capitalization, punctuation)
- Preserve structure (line breaks, lists, formatting)
- Flag important info (expiration dates, warnings, prices)
- Mention text size/clarity (large/small, clear/blurry)
- Provide context (what object the text is on)
- For documents, note layout (header, paragraphs, bullet points)
- For multiple text areas, prioritize by importance

SPECIAL HANDLING:
- Medical labels: Flag as IMPORTANT, read carefully
- Expiration dates: Always mention prominently
- Prices: Include currency and amount clearly
- Warnings: Read first, emphasize
- Handwriting: Note if difficult to read

Now extract text from this image:`;
    }

    /**
     * COLOR/CLOTHING IDENTIFICATION - Fashion assistance
     */
    static buildColorIdentificationPrompt(itemType?: string): string {
        return `You are a color and fashion consultant for visually impaired users.

${itemType ? `ANALYZING: ${itemType}` : 'ANALYZING: Clothing or item'}

COLOR ANALYSIS PROTOCOL:

1. PRIMARY COLORS - Main colors (largest areas)
2. SECONDARY COLORS - Accent colors
3. PATTERNS - Describe any patterns
4. FASHION ADVICE - Matching recommendations
5. CONDITION - Note stains, wear, etc.

OUTPUT FORMAT:

"COLOR ANALYSIS:

PRIMARY: [Main color(s)] - [percentage if multiple]
SECONDARY: [Accent colors if any]
PATTERN: [Solid/Striped/Plaid/Floral/etc. with details]
STYLE: [Formal/Casual, Long/Short, etc.]

MATCHING: [Does it match common items? Suggestions]
CONDITION: [Clean/Stained/Wrinkled - be honest]"

EXAMPLES:

Example 1 (Shirt):
"COLOR ANALYSIS:

PRIMARY: Navy blue (solid) - 100%
SECONDARY: None
PATTERN: Solid color, no pattern
STYLE: Collared button-up shirt, long sleeves

MATCHING: Navy blue is neutral - pairs well with gray, khaki, or white pants. Good for professional settings.
CONDITION: Clean, appears pressed"

Example 2 (Outfit):
"COLOR ANALYSIS:

PRIMARY: Light blue (70%) with white stripes (30%)
SECONDARY: Navy blue buttons
PATTERN: Vertical stripes, thin lines about 1 inch apart
STYLE: Casual button-up shirt, short sleeves

MATCHING: This blue striped shirt looks great with navy, khaki, or dark jeans. Avoid other patterns on bottom.
CONDITION: Clean and well-maintained"

Example 3 (Shoes):
"COLOR ANALYSIS:

PRIMARY: Black leather (95%)
SECONDARY: White sole (5%)
PATTERN: Solid black, smooth texture
STYLE: Athletic sneakers, low-top

MATCHING: Black sneakers are versatile - work with any pant color. Good for casual wear.
CONDITION: Some scuffing visible on toe area, but overall good condition"

CRITICAL RULES:
- Name specific colors (not just "red" but "burgundy red" or "cherry red")
- Describe patterns precisely (stripe width, pattern spacing)
- Give honest condition assessment (helps with presentation)
- Provide practical matching advice
- Mention texture if relevant (leather/cotton/wool)
- Note any logos or branding if visible
- For outfits, assess top-to-bottom coordination

COLOR MATCHING BASICS:
- Neutrals (black/white/gray/navy) match everything
- Earth tones (brown/khaki/olive) pair well together
- Avoid pattern-on-pattern unless experienced
- Dark + light = good contrast
- Similar tones = cohesive look

Now analyze this image:`;
    }

    /**
     * CONTEXT MANAGER - Maintains conversation memory
     */
    static contextMemory: {
        previousScenes: string[];
        objectHistory: Map<string, string>;
        userPreferences: Map<string, any>;
    } = {
            previousScenes: [],
            objectHistory: new Map(),
            userPreferences: new Map()
        };

    static addContext(type: 'scene' | 'object', data: string, location?: string): void {
        if (type === 'scene') {
            this.contextMemory.previousScenes.push(data);
            if (this.contextMemory.previousScenes.length > 5) {
                this.contextMemory.previousScenes.shift(); // Keep last 5 scenes
            }
        } else if (type === 'object' && location) {
            this.contextMemory.objectHistory.set(data, location);
        }
    }

    static getRecentContext(): string {
        if (this.contextMemory.previousScenes.length === 0) return '';
        return this.contextMemory.previousScenes[this.contextMemory.previousScenes.length - 1];
    }

    static findInHistory(objectName: string): string | null {
        const lowerObj = objectName.toLowerCase();
        // Simple search in object history map
        for (const [key, location] of this.contextMemory.objectHistory.entries()) {
            if (key.includes(lowerObj) || lowerObj.includes(key)) {
                return location;
            }
        }
        return null;
    }

    /**
     * SHOPPING AGENT - Brand & Price Estimation
     * Feature 1 & 6 of Championship Guide
     */
    static buildProductAnalysisPrompt(verifiedLabels: string[]): string {
        return `You are an expert shopping assistant for visually impaired users in India.
Your goal is to identify the product, estimate its price, and provide practical context.

DETECTED OBJECTS (Computer Vision): ${verifiedLabels.join(', ')}

TASK: Analyze the image and perform this 4-step reasoning:

1. IDENTIFY: Exact brand and product name (e.g., "Maggi 2-Minute Noodles", "Dettol Antiseptic Liquid").
2. CATEGORIZE: What is it? (Food, Medicine, Hygiene, Beverage).
3. ESTIMATE PRICE: Estimate the typical price in Indian Rupees (₹) for the visible size. Be realistic.
4. CONTEXT: Add one helpful tip (e.g., "Vegetarian", "Contains caffeine", "For external use only").

OUTPUT FORMAT (Speak exactly this way):
"This is [Brand/Product Name]. It is a [Category].
Estimated price is ₹[Price].
[Helpful Context Tip]."

EXAMPLE:
"This is Good Day Butter Cookies by Britannia. It is a snack.
Estimated price is ₹20 for this small pack.
It contains cashew nuts."

SAFETY:
- If it looks like medicine, read the name carefully.
- If unsure, say "I can't clearly identify the brand."
- Do not hallucinate text that isn't visible.

Now analyze this product:`;
    }
    /**
     * SURROUNDINGS AWARENESS (Feature 2)
     * "You are in the snacks aisle..."
     */
    static buildSurroundingsPrompt(verifiedLabels: string[]): string {
        return `You are a spatial awareness assistant for a blind user.
Your goal is to describe the environment structure and group items spatially.

DETECTED OBJECTS: ${verifiedLabels.join(', ')}

TASK:
1. Analyze the scene layout (Left / Center / Right).
2. Group objects by category (e.g., "Snacks on the left", "Medicines on the right").
3. Identify the "Aisle" or "Zone" type.

OUTPUT FORMAT:
"You are in [Zone/Aisle Name].
On your left, I see [Category/Items].
In front of you are [Category/Items].
On your right is [Category/Items]."

EXAMPLE:
"You are in the snacks aisle.
On your left, I see Lays chips and Kurkure.
In front of you are biscuits.
On your right is the beverage section."

Keep it brief and spatially clear. No extra fluff.
Now analyze the surroundings:`;
    }
}
