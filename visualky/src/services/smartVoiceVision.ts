/**
 * INTELLIGENT VOICE + VISION INTEGRATION
 * Voice commands IMMEDIATELY trigger camera analysis
 * NO "mode switched" nonsense - INSTANT ACTION
 */

import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

interface SmartResponse {
  spokenResponse: string;
  visualAnalysis: string;
  confidence: number;
  detectedObjects: string[];
  action: 'found' | 'searching' | 'not_found' | 'describe';
}

class SmartVoiceVisionSystem {
  private tfModel: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private continuousScanning = false;
  
  async initialize() {
    console.log('🚀 Initializing Smart Voice-Vision System...');
    
    try {
      // Load TensorFlow object detection (works offline)
      this.tfModel = await cocoSsd.load();
      console.log('✅ Object detection ready');
    } catch (e) {
      console.error('❌ TensorFlow load error:', e);
      throw e;
    }
  }
  
  setVideoElement(video: HTMLVideoElement) {
    this.videoElement = video;
    console.log('📹 Video element set');
  }
  
  /**
   * MAIN VOICE COMMAND PROCESSOR
   * This is what your aiIntegration.ts should call
   */
  async processVoiceCommand(transcript: string): Promise<SmartResponse> {
    console.log(`🎤 Processing: "${transcript}"`);
    
    const lower = transcript.toLowerCase();
    
    // ============================================
    // FIND/WHERE IS → Scan NOW for specific object
    // ============================================
    if (lower.includes('find') || lower.includes('where is') || lower.includes('where are')) {
      // Extract what they're looking for
      const target = this.extractTargetObject(transcript);
      
      console.log(`🔍 User wants to find: "${target}"`);
      
      // IMMEDIATELY capture and analyze current frame
      const result = await this.scanForObject(target);
      
      return result;
    }
    
    // ============================================
    // WHAT IS THIS → Scan current view and describe
    // ============================================
    if (lower.includes('what is') || lower.includes('identify') || lower.includes('scan this')) {
      const result = await this.identifyCurrentView();
      return result;
    }
    
    // ============================================
    // SURROUNDINGS/AROUND ME → Describe everything
    // ============================================
    if (lower.includes('around') || lower.includes('surroundings') || lower.includes('what do you see')) {
      const result = await this.describeSurroundings();
      return result;
    }
    
    // ============================================
    // BEHIND ME → Guide rotation
    // ============================================
    if (lower.includes('behind')) {
      return {
        spokenResponse: "To see what's behind you, please turn around slowly 180 degrees. I'll scan once you're facing backward.",
        visualAnalysis: 'Awaiting rotation',
        confidence: 1.0,
        detectedObjects: [],
        action: 'describe'
      };
    }
    
    // ============================================
    // DEFAULT → General help
    // ============================================
    return {
      spokenResponse: "I can help you find objects, identify items, or describe your surroundings. Try saying 'Find my mug' or 'What is this?'",
      visualAnalysis: 'Awaiting command',
      confidence: 1.0,
      detectedObjects: [],
      action: 'describe'
    };
  }
  
  /**
   * SCAN FOR SPECIFIC OBJECT
   * Called when user says "find my mug"
   */
  private async scanForObject(targetObject: string): Promise<SmartResponse> {
    
    if (!this.videoElement) {
      return {
        spokenResponse: "Camera not available. Please ensure camera permissions are granted.",
        visualAnalysis: 'No camera',
        confidence: 0,
        detectedObjects: [],
        action: 'not_found'
      };
    }
    
    try {
      // Capture current frame
      const imageData = await this.captureFrame();
      
      // Detect objects in frame
      const detections = await this.tfModel.detect(imageData);
      
      console.log(`🔍 Detected ${detections.length} objects:`, detections.map((d: any) => d.class));
      
      // Check if target object is found
      const foundMatch = this.findMatchingObject(targetObject, detections);
      
      if (foundMatch) {
        // Object FOUND
        const position = this.getObjectPosition(foundMatch.bbox, imageData.width);
        const distance = this.estimateDistance(foundMatch.bbox);
        const confidence = Math.round(foundMatch.score * 100);
        
        const response = this.generateFoundResponse(targetObject, foundMatch.class, position, distance, confidence);
        
        return {
          spokenResponse: response,
          visualAnalysis: `Found: ${foundMatch.class} at ${position}`,
          confidence: foundMatch.score,
          detectedObjects: [foundMatch.class],
          action: 'found'
        };
      } else {
        // Object NOT found in current view
        const otherObjects = detections.map((d: any) => d.class).slice(0, 3);
        const response = this.generateNotFoundResponse(targetObject, otherObjects);
        
        // Start continuous scanning
        this.startContinuousScanning(targetObject);
        
        return {
          spokenResponse: response,
          visualAnalysis: `Not found. Detected: ${otherObjects.join(', ')}`,
          confidence: 0,
          detectedObjects: otherObjects,
          action: 'searching'
        };
      }
    } catch (e) {
      console.error('Error in scanForObject:', e);
      return {
        spokenResponse: `Error scanning for ${targetObject}. Please try again.`,
        visualAnalysis: 'Error',
        confidence: 0,
        detectedObjects: [],
        action: 'not_found'
      };
    }
  }
  
  /**
   * IDENTIFY CURRENT VIEW
   * Called when user says "what is this"
   */
  private async identifyCurrentView(): Promise<SmartResponse> {
    
    if (!this.videoElement) {
      return {
        spokenResponse: "Camera not available.",
        visualAnalysis: 'No camera',
        confidence: 0,
        detectedObjects: [],
        action: 'not_found'
      };
    }
    
    try {
      const imageData = await this.captureFrame();
      const detections = await this.tfModel.detect(imageData);
      
      if (detections.length === 0) {
        return {
          spokenResponse: "I don't see any clear objects in view. Please point the camera at an item and hold it steady.",
          visualAnalysis: 'No objects detected',
          confidence: 0,
          detectedObjects: [],
          action: 'not_found'
        };
      }
      
      // Get primary object
      const primary = detections[0];
      const confidence = Math.round(primary.score * 100);
      
      // Generate intelligent description
      const response = this.generateIdentificationResponse(primary.class, confidence, detections);
      
      return {
        spokenResponse: response,
        visualAnalysis: `Identified: ${primary.class}`,
        confidence: primary.score,
        detectedObjects: detections.map((d: any) => d.class),
        action: 'describe'
      };
    } catch (e) {
      console.error('Error in identifyCurrentView:', e);
      return {
        spokenResponse: "Error identifying objects. Please try again.",
        visualAnalysis: 'Error',
        confidence: 0,
        detectedObjects: [],
        action: 'not_found'
      };
    }
  }
  
  /**
   * DESCRIBE SURROUNDINGS
   * Called when user says "what's around me"
   */
  private async describeSurroundings(): Promise<SmartResponse> {
    
    if (!this.videoElement) {
      return {
        spokenResponse: "Camera not available.",
        visualAnalysis: 'No camera',
        confidence: 0,
        detectedObjects: [],
        action: 'not_found'
      };
    }
    
    try {
      const imageData = await this.captureFrame();
      const detections = await this.tfModel.detect(imageData);
      
      if (detections.length === 0) {
        return {
          spokenResponse: "I'm having trouble detecting objects in your current view. Try moving to a better lit area.",
          visualAnalysis: 'No objects',
          confidence: 0,
          detectedObjects: [],
          action: 'not_found'
        };
      }
      
      // Generate spatial description
      const response = this.generateSpatialDescription(detections, imageData.width);
      
      return {
        spokenResponse: response,
        visualAnalysis: `Surroundings: ${detections.length} objects`,
        confidence: 0.8,
        detectedObjects: detections.map((d: any) => d.class),
        action: 'describe'
      };
    } catch (e) {
      console.error('Error in describeSurroundings:', e);
      return {
        spokenResponse: "Error describing surroundings. Please try again.",
        visualAnalysis: 'Error',
        confidence: 0,
        detectedObjects: [],
        action: 'not_found'
      };
    }
  }
  
  /**
   * CAPTURE FRAME FROM VIDEO
   */
  private async captureFrame(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const video = this.videoElement!;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0);
        
        // Convert to image
        const img = new Image();
        img.src = canvas.toDataURL();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load failed'));
      } catch (e) {
        reject(e);
      }
    });
  }
  
  /**
   * EXTRACT TARGET OBJECT from user speech
   */
  private extractTargetObject(transcript: string): string {
    const lower = transcript.toLowerCase();
    
    // Remove command words
    let target = lower
      .replace(/please/g, '')
      .replace(/find/g, '')
      .replace(/where is/g, '')
      .replace(/where are/g, '')
      .replace(/my/g, '')
      .replace(/the/g, '')
      .trim();
    
    // Map common words to detection classes
    const mappings: Record<string, string> = {
      'mug': 'cup',
      'glass': 'cup',
      'mobile': 'cell phone',
      'phone': 'cell phone',
      'spectacles': 'person',
      'glasses': 'person',
      'keys': 'person',
      'pen': 'person',
      'wallet': 'handbag',
      'bag': 'backpack',
      'charger': 'cell phone',
      'remote': 'remote',
      'bottle': 'bottle',
      'book': 'book',
      'laptop': 'laptop',
      'mouse': 'mouse',
      'keyboard': 'keyboard',
    };
    
    for (const [word, detectionClass] of Object.entries(mappings)) {
      if (target.includes(word)) {
        return detectionClass;
      }
    }
    
    return target;
  }
  
  /**
   * FIND MATCHING OBJECT in detections
   */
  private findMatchingObject(target: string, detections: any[]): any | null {
    
    // Exact match
    const exactMatch = detections.find(d => 
      d.class.toLowerCase() === target.toLowerCase()
    );
    if (exactMatch) return exactMatch;
    
    // Partial match
    const partialMatch = detections.find(d => 
      d.class.toLowerCase().includes(target.toLowerCase()) ||
      target.toLowerCase().includes(d.class.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Similar categories
    const categoryMatch: Record<string, string[]> = {
      'cup': ['bottle', 'bowl'],
      'bottle': ['cup', 'vase'],
      'cell phone': ['remote', 'keyboard'],
      'book': ['laptop'],
    };
    
    for (const detection of detections) {
      const similar = categoryMatch[target];
      if (similar && similar.includes(detection.class)) {
        return detection;
      }
    }
    
    return null;
  }
  
  /**
   * GET OBJECT POSITION (left/center/right)
   */
  private getObjectPosition(bbox: number[], imageWidth: number): string {
    const centerX = (bbox[0] + bbox[2]) / 2;
    const relativePos = centerX / imageWidth;
    
    if (relativePos < 0.33) return 'on your left';
    if (relativePos > 0.67) return 'on your right';
    return 'in the center';
  }
  
  /**
   * ESTIMATE DISTANCE from bounding box size
   */
  private estimateDistance(bbox: number[]): string {
    const width = bbox[2] - bbox[0];
    const height = bbox[3] - bbox[1];
    const size = Math.sqrt(width * width + height * height);
    
    if (size > 200) return 'very close, about 10-20 centimeters';
    if (size > 100) return 'about 30-50 centimeters';
    if (size > 50) return 'about 50-100 centimeters';
    return 'quite far, more than 1 meter';
  }
  
  /**
   * GENERATE "FOUND" RESPONSE
   */
  private generateFoundResponse(
    searched: string, 
    found: string, 
    position: string, 
    distance: string,
    confidence: number
  ): string {
    
    const responses = [
      `Found it! I can see a ${found} ${position}, ${distance} away. Confidence: ${confidence}%. That should be your ${searched}.`,
      
      `Yes! I detect a ${found} ${position}. It's ${distance} from the camera. Detection confidence: ${confidence}%. Is that your ${searched}?`,
      
      `Got it! There's a ${found} ${position}, approximately ${distance}. I'm ${confidence}% confident this is what you're looking for.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  /**
   * GENERATE "NOT FOUND" RESPONSE
   */
  private generateNotFoundResponse(target: string, otherObjects: string[]): string {
    
    if (otherObjects.length === 0) {
      return `I don't see your ${target} in the current view. Please pan the camera slowly around the area and I'll keep scanning.`;
    }
    
    return `I don't see your ${target} right now. I can see ${otherObjects.join(', ')} in the current view. Keep panning the camera and I'll alert you when I find it.`;
  }
  
  /**
   * GENERATE IDENTIFICATION RESPONSE
   */
  private generateIdentificationResponse(
    objectClass: string, 
    confidence: number,
    allDetections: any[]
  ): string {
    
    const productInfo: Record<string, string> = {
      'bottle': 'a bottle, likely for beverages or liquid products',
      'cup': 'a cup or mug, typically used for drinking',
      'cell phone': 'a mobile phone or smartphone device',
      'laptop': 'a laptop computer',
      'book': 'a book or publication',
      'remote': 'a remote control device',
      'keyboard': 'a computer keyboard',
      'mouse': 'a computer mouse',
      'backpack': 'a backpack or bag',
      'handbag': 'a handbag or purse',
    };
    
    const description = productInfo[objectClass] || `a ${objectClass}`;
    
    if (allDetections.length === 1) {
      return `I can see ${description} with ${confidence}% confidence. To get more details like brand name or price, please show me any text or logos on it clearly.`;
    }
    
    const others = allDetections.slice(1, 3).map(d => d.class).join(' and ');
    return `The main item I see is ${description} (${confidence}% confidence). I also detect ${others} in the view.`;
  }
  
  /**
   * GENERATE SPATIAL DESCRIPTION
   */
  private generateSpatialDescription(detections: any[], imageWidth: number): string {
    
    // Group by position
    const left: string[] = [];
    const center: string[] = [];
    const right: string[] = [];
    
    detections.forEach(d => {
      const centerX = (d.bbox[0] + d.bbox[2]) / 2;
      const relativePos = centerX / imageWidth;
      
      if (relativePos < 0.33) {
        left.push(d.class);
      } else if (relativePos > 0.67) {
        right.push(d.class);
      } else {
        center.push(d.class);
      }
    });
    
    let description = `I can see ${detections.length} items around you. `;
    
    if (left.length > 0) {
      description += `On your left: ${left.join(', ')}. `;
    }
    
    if (center.length > 0) {
      description += `In the center: ${center.join(', ')}. `;
    }
    
    if (right.length > 0) {
      description += `On your right: ${right.join(', ')}. `;
    }
    
    description += `Would you like me to do a complete 360-degree scan?`;
    
    return description;
  }
  
  /**
   * START CONTINUOUS SCANNING (while user pans camera)
   */
  private startContinuousScanning(target: string) {
    if (this.continuousScanning) return;
    
    this.continuousScanning = true;
    console.log(`🔄 Starting continuous scan for: ${target}`);
    
    const scanInterval = setInterval(async () => {
      if (!this.continuousScanning) {
        clearInterval(scanInterval);
        return;
      }
      
      try {
        const imageData = await this.captureFrame();
        const detections = await this.tfModel.detect(imageData);
        
        const foundMatch = this.findMatchingObject(target, detections);
        
        if (foundMatch) {
          console.log(`✅ FOUND ${target}!`);
          this.continuousScanning = false;
          clearInterval(scanInterval);
          
          // Alert user
          const position = this.getObjectPosition(foundMatch.bbox, imageData.width);
          const distance = this.estimateDistance(foundMatch.bbox);
          const confidence = Math.round(foundMatch.score * 100);
          
          const alertMessage = `Alert! I found your ${target}! It's ${position}, ${distance} away. Confidence: ${confidence}%.`;
          
          this.speak(alertMessage);
        }
      } catch (e) {
        console.error('Scan error:', e);
      }
    }, 1000); // Scan every second
  }
  
  /**
   * STOP CONTINUOUS SCANNING
   */
  stopContinuousScanning() {
    this.continuousScanning = false;
  }
  
  /**
   * SPEAK TEXT (using browser TTS)
   */
  private speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

// Export singleton
export const smartVoiceVision = new SmartVoiceVisionSystem();
