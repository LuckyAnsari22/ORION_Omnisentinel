
/**
 * INTELLIGENCE CONTRACTS
 * Defines the strict data structures for the Decision Engine.
 */

// Confidence Levels
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// Risk Levels (Safety Critical)
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// The "Voice" of the System - strictly typed actions
export type DecisionType =
    | 'ANSWER'              // Verified info, safe to speak
    | 'REFUSE'              // Unsafe, low confidence, or risky
    | 'ASK_CLARIFICATION';  // Ambiguous input

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Evidence {
    label: string;
    confidence: number;
    box?: BoundingBox;
    source: 'mediapipe' | 'coco-ssd' | 'gemini-vision' | 'pipeline';
}

export interface DecisionObject {
    decisionType: DecisionType;
    confidence: number;
    risk: RiskLevel;
    message: string; // The ONLY string allowed to be spoken
    debugReasoning: string[]; // For audit trails
}

export interface VisionRequest {
    mode: 'description' | 'find' | 'read' | 'color' | 'navigation' | 'product' | 'learn' | 'surroundings'; // STRICT MODES
    target?: string;
}
