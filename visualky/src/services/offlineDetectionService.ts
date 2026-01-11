/**
 * LocalLens Offline Detection Service
 * Provides fallback scene analysis when Gemini Nano is unavailable
 */

export interface SimpleDetectionResult {
  description: string;
  objectCount: number;
  brightness: 'dark' | 'normal' | 'bright';
  motion: boolean;
  detectionQuality: 'low' | 'medium' | 'high';
}

/**
 * Analyze image properties using Canvas API (works fully offline)
 */
export const analyzeImageOffline = async (
  imageDataUrl: string
): Promise<SimpleDetectionResult> => {
  try {
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            description: 'Unable to analyze image at this time.',
            objectCount: 0,
            brightness: 'normal',
            motion: false,
            detectionQuality: 'low',
          });
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Calculate brightness
        let totalBrightness = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;
          pixelCount++;
        }

        const avgBrightness = totalBrightness / pixelCount;
        const brightnesLevel: 'dark' | 'normal' | 'bright' =
          avgBrightness < 85 ? 'dark' : avgBrightness > 170 ? 'bright' : 'normal';

        // Estimate edge count (rough scene complexity)
        let edgeCount = 0;
        for (let i = 0; i < data.length - 4; i += 4) {
          const diff = Math.abs(data[i] - data[i + 4]);
          if (diff > 30) edgeCount++;
        }

        const objectEstimate = Math.round(edgeCount / 5000);
        const quality: 'low' | 'medium' | 'high' =
          objectEstimate < 2 ? 'low' : objectEstimate < 5 ? 'medium' : 'high';

        // Generate description based on analysis
        let description = 'Scene analysis (offline mode): ';

        if (brightnesLevel === 'dark') {
          description += 'The environment is quite dark. Consider better lighting for clearer analysis. ';
        } else if (brightnesLevel === 'bright') {
          description += 'The lighting is bright and clear. ';
        } else {
          description += 'Lighting conditions are normal. ';
        }

        if (quality === 'high') {
          description += 'Multiple objects detected in the scene.';
        } else if (quality === 'medium') {
          description += 'Some objects visible in the scene.';
        } else {
          description += 'Scene appears relatively simple or uniform.';
        }

        resolve({
          description,
          objectCount: objectEstimate,
          brightness: brightnesLevel,
          motion: false,
          detectionQuality: quality,
        });
      };

      img.onerror = () => {
        resolve({
          description: 'Could not analyze image. Please try a different angle.',
          objectCount: 0,
          brightness: 'normal',
          motion: false,
          detectionQuality: 'low',
        });
      };

      img.src = imageDataUrl;
    });
  } catch (error) {
    console.error('Offline analysis error:', error);
    return {
      description: 'Analysis unavailable. Move to a better lit area and try again.',
      objectCount: 0,
      brightness: 'normal',
      motion: false,
      detectionQuality: 'low',
    };
  }
};

/**
 * Detect colors from image (offline, uses histogram)
 */
export const detectColorsOffline = async (
  imageDataUrl: string
): Promise<string[]> => {
  try {
    const img = new Image();

    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(['Unable to detect colors']);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample colors from image
        const colors: Record<string, number> = {};

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const colorName = rgbToColorName(r, g, b);
          colors[colorName] = (colors[colorName] || 0) + 1;
        }

        // Sort by frequency
        const topColors = Object.entries(colors)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([color]) => color);

        resolve(topColors.length > 0 ? topColors : ['Neutral tones']);
      };

      img.onerror = () => {
        resolve(['Unable to analyze colors']);
      };

      img.src = imageDataUrl;
    });
  } catch (error) {
    return ['Color analysis unavailable'];
  }
};

/**
 * Convert RGB to color name
 */
function rgbToColorName(r: number, g: number, b: number): string {
  // Simple color classification
  if (r > 200 && g < 100 && b < 100) return 'Red';
  if (r > 200 && g > 150 && b < 100) return 'Orange';
  if (r > 200 && g > 200 && b < 100) return 'Yellow';
  if (r < 100 && g > 150 && b < 100) return 'Green';
  if (r < 100 && g < 100 && b > 150) return 'Blue';
  if (r > 100 && g < 150 && b > 150) return 'Cyan';
  if (r > 150 && g < 100 && b > 150) return 'Purple';
  if (r > 100 && g > 100 && b > 100 && r < 200 && g < 200 && b < 200) return 'Gray';
  if (r > 200 && g > 200 && b > 200) return 'White';
  if (r < 50 && g < 50 && b < 50) return 'Black';
  return 'Mixed';
}

/**
 * Text detection using simple contrast analysis (very basic fallback)
 */
export const detectTextOffline = async (): Promise<string> => {
  // This is a very basic fallback
  // Real OCR would require a model, which we don't have offline
  return 'Text detection requires Gemini Nano. Point camera at text for better accuracy.';
};

export default {
  analyzeImageOffline,
  detectColorsOffline,
  detectTextOffline,
};
