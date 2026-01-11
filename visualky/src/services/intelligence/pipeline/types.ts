export interface PipelineObject {
    label: string;
    score: number;
    box: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    categoryScore?: number; // Raw detection score
    similarityScore?: number; // Semantic score
    finalConfidence?: number; // Fused score
    debugLog?: string[];
}

export interface PipelineResult {
    objects: PipelineObject[];
    timestamp: number;
    debugTrace: any[];
}
