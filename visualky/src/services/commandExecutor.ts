/**
 * COMMAND EXECUTOR
 * 
 * THE ONLY PLACE WHERE REAL-WORLD ACTIONS HAPPEN
 * 
 * Responsibilities:
 * • Receive parsed intent
 * • Control system state
 * • Start/stop camera
 * • Run vision pipelines
 * • Speak results
 * • Resume listening
 * 
 * Flow: Intent → [THINKING] → Camera → Vision → [SPEAKING] → Resume → [LISTENING]
 * 
 * CRITICAL RULES:
 * • No other component triggers camera, vision, or voice actions
 * • Actions are explicit and sequential, NEVER reactive
 * • All failures are caught and spoken
 * • Listening always resumes at end
 */

import type { ParsedIntent } from './intentParser';
import { useSystemState, type ErrorContext } from './SystemStateStore';
import { useVoiceController } from './voiceSystem';
import { getCameraController } from './cameraControllerEnhanced';
import { analyzeObjectDetection, analyzeSceneDescription, analyzeTextRecognition } from './visionPipeline';

/**
 * Execute a voice command end-to-end
 * This is the ONLY entry point for command execution
 */
export async function executeCommand(intent: ParsedIntent): Promise<void> {
  const store = useSystemState.getState();
  const voiceController = useVoiceController();
  const cameraController = getCameraController();

  try {
    console.log(`🎯 Executing: ${intent.intent}`, intent.payload);

    // Step 1: Transition to THINKING state
    store.transitionToThinking();

    // Step 2: Acknowledge and announce what we're doing
    let acknowledgment = '';
    switch (intent.intent) {
      case 'FIND_OBJECT':
        acknowledgment = `Looking for your ${intent.payload?.objectName || 'item'}`;
        break;
      case 'DESCRIBE_SCENE':
        acknowledgment = 'Analyzing what I see';
        break;
      case 'READ_TEXT':
        acknowledgment = 'Reading text for you';
        break;
      case 'HELP':
        acknowledgment = 'I can find objects, describe scenes, and read text. Try saying "find my keys" or "what do you see"';
        break;
      default:
        acknowledgment = "I didn't understand. Try 'find my object' or 'describe the scene'";
    }

    // Stop listening BEFORE speaking (prevent overlap)
    voiceController.stopListening();

    // Speak acknowledgment (waits for speech to complete)
    await voiceController.speak(acknowledgment);

    // Step 3: Execute intent-specific action
    let result = '';
    if (intent.intent === 'FIND_OBJECT' && intent.payload?.objectName) {
      result = await executeFind(intent.payload.objectName, cameraController);
    } else if (intent.intent === 'DESCRIBE_SCENE') {
      result = await executeDescribe(cameraController);
    } else if (intent.intent === 'READ_TEXT') {
      result = await executeReadText(cameraController);
    } else if (intent.intent === 'HELP') {
      // Already acknowledged above
      result = '';
    } else {
      result = 'I could not process that command.';
    }

    // Step 4: Speak result (if any)
    if (result) {
      await voiceController.speak(result);
    }

    // Step 5: Transition back to LISTENING
    store.transitionToListening();

    // Step 6: Resume listening (critical - must happen at end)
    console.log('✅ Command complete. Resuming listening.');
    voiceController.startListening();
  } catch (error) {
    console.error('❌ Command execution failed:', error);

    // Failure recovery: announce and return to listening
    const store = useSystemState.getState();
    const voiceController = useVoiceController();

    try {
      voiceController.stopListening();
      await voiceController.speak('Something went wrong. I am ready again.');
      store.transitionToListening();
      voiceController.startListening();
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      const errorContext: ErrorContext = {
        code: 'COMMAND_EXECUTION_FAILED',
        message: 'Command execution and recovery failed',
        timestamp: Date.now(),
        recoverable: true,
      };
      store.transitionToError(errorContext);
    }
  }
}

/**
 * FIND_OBJECT execution
 * 1. Start camera
 * 2. Capture one frame
 * 3. Stop camera
 * 4. Run object detection
 * 5. Return location description
 */
async function executeFind(objectName: string, cameraController: any): Promise<string> {
  try {
    console.log(`🔍 Starting FIND: ${objectName}`);

    // Start camera
    await cameraController.start();
    console.log('📷 Camera started');

    // Capture ONE frame
    const frame = await cameraController.captureFrame();
    console.log('📸 Frame captured');

    // Stop camera immediately (don't leave it running)
    await cameraController.stop();
    console.log('🛑 Camera stopped');

    // Run object detection on frame
    const detectionResult = await analyzeObjectDetection(frame, objectName);

    if (!detectionResult) {
      return `I could not find your ${objectName}. Check if it's in view.`;
    }

    // Return location description
    const { found, location, confidence } = detectionResult;

    if (!found) {
      return `I did not find a ${objectName} in the current view. Try moving closer or in better light.`;
    }

    // Describe location in natural language
    const confidencePercent = Math.round(confidence * 100);
    const locationDesc = describeLocationInNaturalLanguage(location);

    return `I found your ${objectName}${locationDesc}. I'm ${confidencePercent}% confident.`;
  } catch (error) {
    console.error('FIND execution error:', error);
    throw error;
  }
}

/**
 * DESCRIBE_SCENE execution
 * 1. Start camera
 * 2. Capture one frame
 * 3. Stop camera
 * 4. Run scene description
 * 5. Return description
 */
async function executeDescribe(cameraController: any): Promise<string> {
  try {
    console.log('🎬 Starting DESCRIBE_SCENE');

    // Start camera
    await cameraController.start();

    // Capture frame
    const frame = await cameraController.captureFrame();

    // Stop camera
    await cameraController.stop();

    // Run scene description
    const description = await analyzeSceneDescription(frame);

    if (!description) {
      return 'I could not analyze the scene. Please try again.';
    }

    return description;
  } catch (error) {
    console.error('DESCRIBE execution error:', error);
    throw error;
  }
}

/**
 * READ_TEXT execution
 * 1. Start camera
 * 2. Capture one frame
 * 3. Stop camera
 * 4. Run OCR
 * 5. Return text
 */
async function executeReadText(cameraController: any): Promise<string> {
  try {
    console.log('📖 Starting READ_TEXT');

    // Start camera
    await cameraController.start();

    // Capture frame
    const frame = await cameraController.captureFrame();

    // Stop camera
    await cameraController.stop();

    // Run text recognition
    const text = await analyzeTextRecognition(frame);

    if (!text) {
      return 'I could not find any readable text. Please try again.';
    }

    return `I read: ${text}`;
  } catch (error) {
    console.error('READ_TEXT execution error:', error);
    throw error;
  }
}

/**
 * Convert bounding box location to natural language
 * e.g., { x: 0.3, y: 0.2, width: 0.1, height: 0.1 } → "in the upper left"
 */
function describeLocationInNaturalLanguage(location: {
  x: number;
  y: number;
  width: number;
  height: number;
}): string {
  const centerX = location.x + location.width / 2;
  const centerY = location.y + location.height / 2;

  let horizontal = '';
  if (centerX < 0.33) horizontal = 'left';
  else if (centerX > 0.67) horizontal = 'right';
  else horizontal = 'center';

  let vertical = '';
  if (centerY < 0.33) vertical = 'top';
  else if (centerY > 0.67) vertical = 'bottom';
  else vertical = 'middle';

  if (vertical === 'middle' && horizontal === 'center') {
    return ' in the center of the view';
  }

  return ` ${vertical} ${horizontal}`;
}
