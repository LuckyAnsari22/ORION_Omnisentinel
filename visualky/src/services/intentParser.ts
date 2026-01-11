/**
 * INTENT PARSER
 * 
 * Extracts structured intent from voice transcript.
 * 
 * Contract: Always produces { intent, payload? }
 * This is the ONLY place that parses voice into intent.
 * executors never parse—they only execute.
 */

export type VoiceIntent = 
  | 'FIND_OBJECT' 
  | 'DESCRIBE_SCENE' 
  | 'READ_TEXT' 
  | 'HELP' 
  | 'UNKNOWN';

export interface ParsedIntent {
  intent: VoiceIntent;
  payload?: {
    objectName?: string;
    targetText?: string;
  };
  confidence: number; // 0-1 how confident this parsing is
}

/**
 * Parse voice transcript into structured intent
 */
export function parseIntent(transcript: string): ParsedIntent {
  const lower = transcript.toLowerCase().trim();

  // FIND_OBJECT intent
  // Patterns: "find my X", "where is X", "locate X", "show me X"
  if (lower.includes('find') || lower.includes('where') || lower.includes('locate') || lower.includes('show me')) {
    const objectMatch = lower.match(
      /(?:find|where is|locate|show me)\s+(?:my\s+)?([a-z\s]+?)(?:\s+please|\s+please|\?|$)/i
    );
    if (objectMatch) {
      const objectName = objectMatch[1].trim();
      return {
        intent: 'FIND_OBJECT',
        payload: { objectName },
        confidence: 0.95,
      };
    }
  }

  // DESCRIBE_SCENE intent
  // Patterns: "what do you see", "describe", "what's around me", "what's in front"
  if (
    lower.includes('describe') ||
    lower.includes('what do you see') ||
    lower.includes("what's") ||
    lower.includes('what is') ||
    lower.includes('around me') ||
    lower.includes('in front')
  ) {
    return {
      intent: 'DESCRIBE_SCENE',
      confidence: 0.9,
    };
  }

  // READ_TEXT intent
  // Patterns: "read", "what does it say", "show me text"
  if (lower.includes('read') || lower.includes('what does') || lower.includes('what does it say')) {
    return {
      intent: 'READ_TEXT',
      confidence: 0.88,
    };
  }

  // HELP intent
  // Patterns: "help", "how do I", "what can you do"
  if (lower.includes('help') || lower.includes('how do') || lower.includes('what can')) {
    return {
      intent: 'HELP',
      confidence: 0.92,
    };
  }

  // Unknown
  return {
    intent: 'UNKNOWN',
    confidence: 0.1,
  };
}

/**
 * Human-readable intent description for logging
 */
export function describeIntent(parsed: ParsedIntent): string {
  const obj = parsed.payload?.objectName ? ` for "${parsed.payload.objectName}"` : '';
  return `${parsed.intent}${obj} (confidence: ${Math.round(parsed.confidence * 100)}%)`;
}
