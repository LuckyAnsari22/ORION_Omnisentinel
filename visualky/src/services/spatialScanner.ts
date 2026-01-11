/**
 * SPATIAL SCANNER
 * 360-degree environmental mapping
 * Guides user through rotation, analyzes each direction, builds complete spatial model
 */

import { gemini3Engine } from './intelligence/gemini3VisionEngine';
import type { SpatialAnalysis, ImageAnalysisContext } from './intelligence/gemini3VisionEngine';

export interface DirectionalScan {
  direction: 'front' | 'right' | 'back' | 'left';
  angle: number;
  analysis: SpatialAnalysis;
  timestamp: number;
}

export interface SpatialMap {
  scans: DirectionalScan[];
  completeSummary: string;
  detectedItems: Set<string>;
  hazardAreas: string[];
  navigableSpace: string;
}

class SpatialScanner {
  private isScanning = false;
  private currentScanData: DirectionalScan[] = [];

  /**
   * Start guided 360-degree scan
   * Guides user through each cardinal direction with voice
   */
  async perform360Scan(
    captureCallback: (direction: 'front' | 'right' | 'back' | 'left') => Promise<string | Uint8Array>,
    voiceCallback: (message: string) => Promise<void>
  ): Promise<SpatialMap> {
    this.isScanning = true;
    this.currentScanData = [];

    try {
      // Initial guidance
      await voiceCallback(
        "Let's map out your complete surroundings. I'll guide you to turn slowly in each direction. " +
        "Hold your phone at chest height, pointing forward. Stand in the center of the space. " +
        "Ready? Say 'yes' when you're in position."
      );

      const directions: Array<'front' | 'right' | 'back' | 'left'> = ['front', 'right', 'back', 'left'];
      const directionNames = {
        front: 'forward',
        right: 'to your right (clockwise)',
        back: 'behind you',
        left: 'to your left'
      };

      // Scan each direction
      for (let i = 0; i < directions.length; i++) {
        const direction = directions[i];
        const angle = i * 90;

        // Guide rotation
        if (i > 0) {
          await voiceCallback(
            `Now turn 90 degrees to your right. You should be facing ${directionNames[direction]}. Hold steady.`
          );
          // Wait for user to acknowledge or auto-wait
          await this.waitForUserReady(voiceCallback);
        }

        // Capture and analyze
        await voiceCallback(`Scanning ${direction}. Hold very steady...`);
        const imageData = await captureCallback(direction);

        const analysis = await this.analyzeDirection(imageData, direction);
        this.currentScanData.push({
          direction,
          angle,
          analysis,
          timestamp: Date.now()
        });

        // Immediate feedback
        const itemCount = analysis.detectedItems.length;
        await voiceCallback(
          `Found ${itemCount} items ${direction}. Continuing...`
        );
      }

      // Generate comprehensive spatial summary
      const spatialMap = await this.generateSpatialMap();
      this.isScanning = false;

      return spatialMap;

    } catch (error) {
      console.error('Error during 360 scan:', error);
      this.isScanning = false;
      throw error;
    }
  }

  /**
   * Analyze single direction
   */
  private async analyzeDirection(
    imageData: string | Uint8Array,
    direction: 'front' | 'right' | 'back' | 'left'
  ): Promise<SpatialAnalysis> {
    const directionDescriptions = {
      front: 'in front of the user',
      right: 'to the user\'s right',
      back: 'behind the user',
      left: 'to the user\'s left'
    };

    try {
      const context: ImageAnalysisContext = {
        mode: 'surroundings',
        scanningDirection: direction,
        currentQuery: `Analyze and describe everything visible ${directionDescriptions[direction]}`
      };

      const analysis = await gemini3Engine.analyzeImage(imageData, context);

      // Extract spatial information
      const spatial: SpatialAnalysis = {
        description: analysis.description,
        direction,
        detectedItems: analysis.additionalInfo?.detectedItems || [],
        hazards: this.extractHazards(analysis.description),
        confidence: analysis.confidence
      };

      return spatial;

    } catch (error) {
      console.error(`Error analyzing ${direction}:`, error);
      return {
        description: `Error analyzing ${direction}`,
        direction,
        detectedItems: [],
        confidence: 0
      };
    }
  }

  /**
   * Generate complete spatial map and summary
   */
  private async generateSpatialMap(): Promise<SpatialMap> {
    const detectedItems = new Set<string>();
    const hazards: string[] = [];

    // Collect all items and hazards
    for (const scan of this.currentScanData) {
      scan.analysis.detectedItems.forEach(item => detectedItems.add(item));
      if (scan.analysis.hazards) {
        hazards.push(...scan.analysis.hazards);
      }
    }

    // Build comprehensive summary using Gemini
    const summary = await this.buildSpatialSummary();

    return {
      scans: this.currentScanData,
      completeSummary: summary,
      detectedItems,
      hazardAreas: hazards,
      navigableSpace: this.analyzeNavigableSpace()
    };
  }

  /**
   * Build comprehensive spatial summary using Gemini
   */
  private async buildSpatialSummary(): Promise<string> {
    const scans = this.currentScanData;

    const scansDescription = scans
      .map(scan => `${scan.direction.toUpperCase()}: ${scan.analysis.description}`)
      .join('\n\n');

    const prompt = `A blind user just completed a 360-degree environmental scan. Here's what was detected:

${scansDescription}

Create a COMPREHENSIVE spatial description that:
1. Identifies the type of location/space
2. Describes layout in clear directional terms (front, right, back, left)
3. Categorizes items by function (shopping, hazards, pathways, etc.)
4. Mentions any obstacles or safety concerns
5. Provides navigation guidance
6. Builds a complete mental map

Make it conversational, under 30 seconds of speech.
Focus on practical, actionable information.
Use relative directions consistently.`;

    try {
      const response = await gemini3Engine.analyzeImage(
        new Uint8Array(0), // Empty array for text-only prompt
        {
          mode: 'surroundings',
          currentQuery: prompt
        }
      );

      return response.description;
    } catch (error) {
      console.error('Error building summary:', error);
      return `You are in a space with items in all directions. I detected ${this.currentScanData.length} areas during the scan.`;
    }
  }

  /**
   * Analyze navigable space
   */
  private analyzeNavigableSpace(): string {
    const spacers: string[] = [];

    for (const scan of this.currentScanData) {
      if (scan.analysis.description.toLowerCase().includes('clear') ||
        scan.analysis.description.toLowerCase().includes('open')) {
        spacers.push(scan.direction);
      }
    }

    if (spacers.length === 0) {
      return 'Space is cluttered in all directions';
    } else if (spacers.length === 4) {
      return 'Clear space available in all directions';
    } else {
      return `Clear space: ${spacers.join(', ')}`;
    }
  }

  /**
   * Extract hazards from description
   */
  private extractHazards(description: string): string[] {
    const hazards: string[] = [];
    const hazardKeywords = [
      'obstacle', 'step', 'stairs', 'edge', 'cliff',
      'sharp', 'wet', 'slippery', 'broken', 'hole',
      'open', 'gap', 'dangerous', 'hazard', 'warning',
      'road', 'traffic', 'vehicle', 'person in way'
    ];

    for (const keyword of hazardKeywords) {
      if (description.toLowerCase().includes(keyword)) {
        hazards.push(keyword);
      }
    }

    return hazards;
  }

  /**
   * Analyze specific direction on demand
   */
  async analyzeDirectionOnDemand(
    direction: 'front' | 'right' | 'back' | 'left',
    imageData: string | Uint8Array,
    voiceCallback?: (message: string) => Promise<void>
  ): Promise<string> {
    const directionNames = {
      front: 'in front',
      right: 'to the right',
      back: 'behind',
      left: 'to the left'
    };

    try {
      // Access the private analyzeDirection method correctly
      const analysis = await (this as any).analyzeDirection(imageData, direction);
      const response = `${directionNames[direction]}: ${analysis.description}`;

      if (voiceCallback) {
        await voiceCallback(response);
      }

      return response;
    } catch (error) {
      console.error(`Error analyzing ${direction}:`, error);
      return `Couldn't analyze ${direction}. Please try again.`;
    }
  }

  /**
   * Wait for user to confirm readiness
   */
  private async waitForUserReady(
    _voiceCallback: (message: string) => Promise<void>,
    timeoutMs: number = 10000
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Auto-proceeding with scan...');
        resolve();
      }, timeoutMs);

      // In real implementation, this would listen for "ready" voice command
      // For now, auto-proceed after timeout
    });
  }

  /**
   * Get current scan status
   */
  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  /**
   * Get last scan data
   */
  getLastScan(): DirectionalScan[] {
    return this.currentScanData;
  }

  /**
   * Clear scan data
   */
  clearScanData(): void {
    this.currentScanData = [];
  }
}

// Export singleton
export const spatialScanner = new SpatialScanner();
export default SpatialScanner;
