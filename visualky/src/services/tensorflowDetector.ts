/**
 * TENSORFLOW.JS OBJECT DETECTION ENGINE
 * Browser-based object detection using COCO-SSD (YOLO alternative)
 * NO API KEYS NEEDED - Runs entirely in browser
 * 
 * Features:
 * - Detects 80+ object types (person, car, mug, bottle, etc.)
 * - Provides bounding boxes and confidence scores
 * - Calculates distance using focal length formula
 * - Extracts colors from detected regions
 * - Works 100% offline
 */

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import type { ImageAnalysisContext, ProductAnalysis } from './intelligence/gemini3VisionEngine';

interface DetectedObject {
    class: string;
    score: number;
    bbox: [number, number, number, number]; // [x, y, width, height]
    distance?: number; // in cm
    colors?: string[];
}

export class TensorFlowObjectDetector {
    private model: cocoSsd.ObjectDetection | null = null;
    private initialized = false;

    async initialize(): Promise<boolean> {
        try {
            console.log('🤖 Loading TensorFlow.js COCO-SSD model (browser-based)...');

            // Load the model
            this.model = await cocoSsd.load({
                base: 'lite_mobilenet_v2' // Lightweight version for faster loading
            });

            this.initialized = true;
            console.log('✅ TensorFlow.js Object Detection ready! (80+ objects, NO API needed)');
            return true;
        } catch (error) {
            console.error('❌ Failed to load TensorFlow model:', error);
            return false;
        }
    }

    /**
     * Analyze image and detect objects
     */
    async analyzeImage(
        imageData: string | Uint8Array,
        context: ImageAnalysisContext
    ): Promise<ProductAnalysis> {
        if (!this.initialized || !this.model) {
            await this.initialize();
        }

        try {
            console.log('🔍 TensorFlow: Converting image...');
            // Convert image to HTMLImageElement
            const img = await this.loadImage(imageData);
            console.log(`🔍 TensorFlow: Image loaded (${img.width}x${img.height})`);

            // Detect objects with lower threshold for better detection
            console.log('🔍 TensorFlow: Running detection...');
            const predictions = await this.model!.detect(img, undefined, 0.3); // Lower threshold to 0.3
            console.log(`🔍 TensorFlow: Found ${predictions.length} objects:`, predictions.map(p => `${p.class} (${Math.round(p.score * 100)}%)`));

            // Convert to our format with distance and colors
            const detectedObjects = await this.enrichDetections(predictions, img);

            // Generate comprehensive response
            const response = this.generateResponse(detectedObjects, context);

            return {
                productName: detectedObjects[0]?.class || 'Unknown',
                category: this.categorizeObject(detectedObjects[0]?.class || ''),
                description: response,
                colors: detectedObjects[0]?.colors || [],
                confidence: detectedObjects[0]?.score || 0.5,
                source: 'synthesis',
                additionalInfo: {
                    detectedObjects: detectedObjects.length,
                    allObjects: detectedObjects.map(obj => obj.class)
                }
            };
        } catch (error) {
            console.error('❌ TensorFlow detection error:', error);
            return this.fallbackResponse(context);
        }
    }

    /**
     * Load image from various formats
     */
    private async loadImage(imageData: string | Uint8Array): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.onerror = reject;

            if (typeof imageData === 'string') {
                img.src = imageData;
            } else {
                // Convert Uint8Array to blob URL
                const blob = new Blob([imageData.buffer as ArrayBuffer], { type: 'image/jpeg' });
                img.src = URL.createObjectURL(blob);
            }
        });
    }

    /**
     * Enrich detections with distance and color info
     */
    private async enrichDetections(
        predictions: cocoSsd.DetectedObject[],
        img: HTMLImageElement
    ): Promise<DetectedObject[]> {
        const enriched: DetectedObject[] = [];

        for (const pred of predictions) {
            const [x, y, width, height] = pred.bbox;

            // Calculate distance using focal length formula (from the repo)
            const distance = this.calculateDistance(width, height);

            // Extract colors from the detected region
            const colors = await this.extractColorsFromRegion(img, x, y, width, height);

            enriched.push({
                class: pred.class,
                score: pred.score,
                bbox: pred.bbox,
                distance,
                colors
            });
        }

        return enriched;
    }

    /**
     * Calculate distance using focal length formula
     * Formula from repo: distance = (2 × π × 180) ÷ ((w + h) × 360) × 1000 + 3
     */
    private calculateDistance(width: number, height: number): number {
        // Simplified distance estimation in cm
        const focalLength = 615; // Average focal length for smartphone cameras
        const knownWidth = 10; // Assume average object width of 10cm

        // Distance = (Known Width × Focal Length) / Pixel Width
        const distance = (knownWidth * focalLength) / width;

        return Math.round(distance);
    }

    /**
     * Extract dominant colors from detected region
     */
    private async extractColorsFromRegion(
        img: HTMLImageElement,
        x: number,
        y: number,
        width: number,
        height: number
    ): Promise<string[]> {
        try {
            // Create canvas to extract pixel data
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return [];

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // Sample pixels and detect dominant colors
            const colorCounts: Record<string, number> = {};
            const sampleRate = 10; // Sample every 10th pixel for performance

            for (let i = 0; i < data.length; i += 4 * sampleRate) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const colorName = this.rgbToColorName(r, g, b);
                colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;
            }

            // Get top 3 colors
            const sortedColors = Object.entries(colorCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([color]) => color);

            return sortedColors;
        } catch (error) {
            return [];
        }
    }

    /**
     * Convert RGB to color name
     */
    private rgbToColorName(r: number, g: number, b: number): string {
        if (r > 200 && g < 100 && b < 100) return 'red';
        if (r < 100 && g > 200 && b < 100) return 'green';
        if (r < 100 && g < 100 && b > 200) return 'blue';
        if (r > 200 && g > 200 && b < 100) return 'yellow';
        if (r > 200 && g < 100 && b > 200) return 'purple';
        if (r < 100 && g > 200 && b > 200) return 'cyan';
        if (r > 150 && g > 100 && b < 50) return 'orange';
        if (r > 200 && g > 200 && b > 200) return 'white';
        if (r < 50 && g < 50 && b < 50) return 'black';
        if (r > 100 && g > 50 && b < 50) return 'brown';
        return 'gray';
    }

    /**
     * Generate comprehensive response with colors, objects, and spatial info
     */
    private generateResponse(objects: DetectedObject[], context: ImageAnalysisContext): string {
        if (objects.length === 0) {
            return "I don't see any clear objects in this image. Please adjust the camera angle or lighting.";
        }

        const primary = objects[0];
        const colorDesc = primary.colors && primary.colors.length > 0
            ? primary.colors.join(' and ')
            : 'various colors';

        const distanceDesc = primary.distance
            ? `approximately ${primary.distance}cm away`
            : 'in view';

        const position = this.getPosition(primary.bbox);

        if (context.mode === 'scan') {
            let response = `I can see a ${colorDesc} ${primary.class} ${distanceDesc}. `;
            response += `The object is located ${position}. `;

            if (objects.length > 1) {
                const others = objects.slice(1, 3).map(obj => obj.class).join(', ');
                response += `Also visible: ${others}. `;
            }

            response += `Confidence: ${Math.round(primary.score * 100)}%.`;
            return response;
        }

        if (context.mode === 'shopping') {
            const target = context.targetProduct?.toLowerCase() || '';
            const found = objects.some(obj => obj.class.toLowerCase().includes(target));

            if (found) {
                const match = objects.find(obj => obj.class.toLowerCase().includes(target))!;
                return `✅ FOUND: ${match.class} with ${colorDesc} colors! Located ${position}, ${distanceDesc}. Reach forward to grab it.`;
            } else {
                const visible = objects.map(obj => `${obj.class} (${obj.colors?.join(', ') || 'colored'})`).join(', ');
                return `Searching for ${target}... Currently visible: ${visible}. Keep panning the camera.`;
            }
        }

        if (context.mode === 'surroundings') {
            let response = `In your surroundings: `;
            objects.slice(0, 5).forEach((obj, idx) => {
                const pos = this.getPosition(obj.bbox);
                const colors = obj.colors?.join(' and ') || 'colored';
                response += `${colors} ${obj.class} ${pos}`;
                if (idx < objects.length - 1) response += ', ';
            });
            response += `. Total ${objects.length} objects detected.`;
            return response;
        }

        // Default
        return `I can see a ${colorDesc} ${primary.class} located ${position}, ${distanceDesc}.`;
    }

    /**
     * Get position description from bounding box
     */
    private getPosition(bbox: [number, number, number, number]): string {
        const [x, y, width] = bbox;
        const centerX = x + width / 2;

        // Assume image width of 640 (standard)
        if (centerX < 213) return 'on the left';
        if (centerX > 427) return 'on the right';
        return 'in the center';
    }

    /**
     * Categorize object into product category
     */
    private categorizeObject(className: string): string {
        const categories: Record<string, string> = {
            'bottle': 'Beverage',
            'cup': 'Beverage',
            'wine glass': 'Beverage',
            'fork': 'Utensil',
            'knife': 'Utensil',
            'spoon': 'Utensil',
            'bowl': 'Kitchenware',
            'banana': 'Food',
            'apple': 'Food',
            'sandwich': 'Food',
            'orange': 'Food',
            'broccoli': 'Food',
            'carrot': 'Food',
            'pizza': 'Food',
            'donut': 'Food',
            'cake': 'Food',
            'chair': 'Furniture',
            'couch': 'Furniture',
            'bed': 'Furniture',
            'dining table': 'Furniture',
            'laptop': 'Electronics',
            'mouse': 'Electronics',
            'keyboard': 'Electronics',
            'cell phone': 'Electronics',
            'book': 'Stationery',
            'clock': 'Home Decor',
            'vase': 'Home Decor',
            'backpack': 'Accessories',
            'handbag': 'Accessories',
            'tie': 'Accessories',
            'suitcase': 'Accessories'
        };

        return categories[className.toLowerCase()] || 'General Item';
    }

    /**
     * Fallback response
     */
    private fallbackResponse(context: ImageAnalysisContext): ProductAnalysis {
        return {
            productName: 'Item',
            category: 'General',
            description: 'Unable to detect objects clearly. Please ensure good lighting and hold camera steady.',
            colors: [],
            confidence: 0.3,
            source: 'synthesis'
        };
    }
}

// Export singleton
export const tensorflowDetector = new TensorFlowObjectDetector();
