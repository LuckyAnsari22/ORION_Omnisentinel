
/**
 * THE ORCHESTRATOR
 * Single Source of Truth.
 * Connects Voice, Camera, and Brain.
 */

import { useSystemState } from './systemState';
import { voiceController } from './voiceController';
import { cameraController } from './cameraController';
import { recoveryManager } from './recoveryManager';
import { evidenceCollector } from './intelligence/evidenceCollector';
import { decisionEngine } from './intelligence/decisionEngine';
import { geminiSpeaker } from './intelligence/geminiSpeaker';
import { geminiVision } from './intelligence/geminiVision';
import { IntelligentPromptEngine } from './advancedPrompts';

class Orchestrator {
    private initialized = false;

    async initialize() {
        if (this.initialized) return;
        this.initialized = true;

        console.log("🎹 Orchestrator: Powering Up");

        // Bind Voice Hooks
        voiceController.setHooks(
            () => this.handleWakeWord(),
            (text) => this.handleIntent(text)
        );

        // Start Idle Loop
        await this.enterIdle();
    }

    // STATE 1: IDLE / LISTENING
    async enterIdle() {
        const { transitionTo } = useSystemState.getState();
        transitionTo('LISTENING'); // Active listening by default for this phase
        await voiceController.startListening();
    }

    // EVENT: Wake Word
    async handleWakeWord() {
        // Acknowledge?
        // For now, implicit. LISTENING state handles it.
        console.log("🎹 Wake Word Detected");
    }

    // EVENT: Intent
    async handleIntent(transcript: string) {
        if (this.isScanning && !transcript.toLowerCase().includes('stop')) {
            // If we are scanning and user speaks something else, STOP scanning to handle new intent
            this.isScanning = false;
        }

        const { transitionTo } = useSystemState.getState();
        console.log("🎹 Intent Received:", transcript);

        // 1. Parse Intent (Simple Keyword Matching for robustness)
        const lower = transcript.toLowerCase();
        let mode: 'description' | 'find' | 'read' | 'color' | 'navigation' | 'product' | 'learn' | 'surroundings' = 'description';
        let target = '';

        const rememberMatch = lower.match(/(?:remember|save) this as (.+)/);

        if (rememberMatch) {
            mode = 'learn';
            target = rememberMatch[1].trim();
        } else if (lower.includes('surroundings') || lower.includes('where am i') || lower.includes('layout') || lower.includes('environment')) {
            mode = 'surroundings';
        } else if (lower.includes('find') || lower.includes('search for') || lower.includes('looking for')) {
            mode = 'find';
            target = lower.split(/find|search for|looking for/)[1]?.trim() || '';

            if (target) {
                // MEMORY CHECK
                const lastSeen = IntelligentPromptEngine.findInHistory(target);
                if (lastSeen) {
                    await voiceController.speak(`I remember seeing ${target} ${lastSeen}. Scanning to confirm.`);
                }

                // START CONTINUOUS LOOP
                await this.startContinuousSearch(target);
                return; // Exit normal flow
            } else {
                await voiceController.speak("What should I find?");
                return;
            }
        } else if (lower.includes('stop') || lower.includes('cancel')) {
            await this.stopScanning();
            return;
        } else if (lower.includes('read')) {
        } else if (lower.includes('read')) {
            mode = 'read';
        } else if (lower.includes('price') || lower.includes('cost') || lower.includes('shop') || lower.includes('brand') || lower.includes('product') || lower.includes('what is this')) {
            mode = 'product';
        }

        try {
            // 2. Capture Phase
            if (!cameraController.isReady()) {
                console.warn("🎹 Camera not ready. Ignoring intent.");
                await voiceController.speak("Please start the camera first.");
                return;
            }

            transitionTo('CAPTURING');
            await voiceController.stopListening();

            // Audio Feedback (Shortened for advanced speed)
            // await voiceController.speak("One moment."); 

            const imageData = await cameraController.captureSnapshot();

            // 3. Thinking Phase
            transitionTo('THINKING');
            const evidence = await evidenceCollector.collect(imageData, target || undefined);
            const decision = decisionEngine.evaluate(evidence, { mode, target });

            // 4. Intelligence Phase (Hybrid)
            let response = "";
            const verifiedLabels = evidence.filter(e => e.confidence > 0.4).map(e => e.label);

            if (verifiedLabels.length > 0 || (mode as string) === 'read' || (mode as string) === 'color' || (mode as string) === 'description' || (mode as string) === 'product' || (mode as string) === 'learn' || (mode as string) === 'surroundings') {
                // Convert Data URL to Image for Gemini
                const img = new Image();
                img.src = imageData;
                await new Promise(r => img.onload = r);

                if ((mode as string) === 'learn' && target) {
                    // Special Learning Pipeline
                    response = await geminiVision.describeScene(img, [], 'description'); // Get visual description
                    // "This looks like a red bottle of shampoo."
                    // Save to memory
                    await import('./contextEngine').then(m => m.contextAwareEngine.learnUserObject(target, response));
                    response = `Okay, I've learned that. I'll remember this is your ${target}.`;
                } else {
                    response = await geminiVision.describeScene(img, verifiedLabels, mode as any);

                    // MEMORY SAVE
                    // Save context for future queries
                    // "I saw keys on the table" -> keys: on the table
                    verifiedLabels.forEach(label => {
                        // We need a simple location heuristic or just save "seen recently"
                        // Ideally Gemini response has location, but parsing it is hard.
                        // For now, save "in the last scene"
                        IntelligentPromptEngine.addContext('object', label, "in the previous view");
                    });
                    IntelligentPromptEngine.addContext('scene', response);
                }

            } else {
                response = geminiSpeaker.verbose(decision);
            }

            // 5. Speaking Phase
            transitionTo('SPEAKING');
            await voiceController.speak(response);

            // 5. Loop Reset
            await this.enterIdle();

        } catch (error) {
            await recoveryManager.handleCriticalError(error, "Orchestrator Flow");
        }
    }

    // UI TRIGGER: Manual Mode execution
    async triggerAction(mode: 'description' | 'find' | 'read' | 'color' | 'navigation' | 'product' | 'learn' | 'surroundings', target?: string) {
        console.log(`🎹 UI Trigger: ${mode} ${target ? `(${target})` : ''}`);

        try {
            if (mode === 'find' && target) {
                await this.startContinuousSearch(target);
                return;
            }

            // 1. Acknowledge
            const phrase = mode === 'read' ? "Reading text" :
                mode === 'color' ? "Identifying colors" :
                    mode === 'navigation' ? "Checking path" :
                        mode === 'product' ? "Scanning product" :
                            mode === 'surroundings' ? "Analyzing surroundings" :
                                "Describing scene";

            await voiceController.speak(phrase);

            // 2. Capture
            if (!cameraController.isReady()) {
                await voiceController.speak("Camera isn't ready yet.");
                return;
            }

            const { transitionTo } = useSystemState.getState();
            transitionTo('CAPTURING');
            const imageData = await cameraController.captureSnapshot();

            // 3. Thinking
            transitionTo('THINKING');
            const evidence = await evidenceCollector.collect(imageData, target);

            // 4. Decision
            const decision = decisionEngine.evaluate(evidence, { mode, target });

            // 4. Intelligence Phase (Hybrid)
            let response = "";
            const verifiedLabels = evidence.filter(e => e.confidence > 0.4).map(e => e.label);

            if (verifiedLabels.length > 0 || mode === 'read' || mode === 'color' || mode === 'description' || mode === 'product' || mode === 'surroundings' || mode === 'learn') {
                const img = new Image();
                img.src = imageData;
                await new Promise(r => img.onload = r);

                response = await geminiVision.describeScene(img, verifiedLabels, mode);
            } else {
                response = geminiSpeaker.verbose(decision);
            }

            // 5. Speaking
            transitionTo('SPEAKING');
            await voiceController.speak(response);

            // 6. Return to Loop
            await this.enterIdleLoop();

        } catch (error) {
            await recoveryManager.handleCriticalError(error, "UI Trigger");
        }
    }

    // SCANNING STATE
    private isScanning = false;
    private scanTarget = '';

    // SEARCH LOOP: Continuous Scanning (Feature 4 of Championship Guide)
    async startContinuousSearch(target: string) {
        if (this.isScanning && this.scanTarget === target) return;

        this.isScanning = true;
        this.scanTarget = target;

        const { transitionTo } = useSystemState.getState();
        transitionTo('SEARCHING' as any); // Need to handle this new state or reuse 'THINKING'/'LISTENING'

        await voiceController.speak(`Scanning for ${target}. Pan your camera slowly.`);

        const scanLoop = async () => {
            if (!this.isScanning) return;

            try {
                // 1. Fast Capture
                // Check if camera is ready
                if (!cameraController.isReady()) {
                    await new Promise(r => setTimeout(r, 1000));
                    if (this.isScanning) scanLoop();
                    return;
                }

                const imageData = await cameraController.captureSnapshot();

                // 2. Fast Evidence Check (Object Detection First)
                const evidence = await evidenceCollector.collect(imageData, this.scanTarget);

                // 3. Evaluate Match
                // Fuzzy match target name with collected evidence
                const match = evidence.find(e =>
                    e.label.toLowerCase().includes(this.scanTarget.toLowerCase()) && e.confidence > 0.5
                );

                if (match) {
                    // FOUND IT!
                    this.isScanning = false;
                    transitionTo('SPEAKING');

                    // Simple spatial hint based on basic tracking (future: use bounding box center)
                    let position = "in view";
                    if (match.box) {
                        // const centerX = match.box.x + (match.box.width / 2); 
                        // TODO: Use centerX to determine left/right if image width is known
                        position = "in front of you";
                    }

                    await voiceController.speak(`Found ${match.label}! It is ${position}.`);
                    await this.enterIdleLoop();
                } else {
                    // Not found, keep scanning
                    // Give subtle feedback every few seconds? Or just silent?
                    // "Scanning..." every 5 seconds is good.
                    // For now, silent loop is faster.
                    await new Promise(r => setTimeout(r, 1500)); // 1.5s delay
                    if (this.isScanning) scanLoop();
                }

            } catch (e) {
                console.error("Scan loop error", e);
                // Fail silently/gracefully in loop, don't crash whole system
                // Maybe retry once more?
                // this.isScanning = false; 
                // Don't kill scanning immediately on one blip
                await new Promise(r => setTimeout(r, 2000));
                if (this.isScanning) scanLoop();
            }
        };

        scanLoop();
    }

    async stopScanning() {
        if (this.isScanning) {
            this.isScanning = false;
            this.scanTarget = '';
            await voiceController.speak("Stopping search.");
            await this.enterIdle();
        }
    }

    async enterIdleLoop() {
        return this.enterIdle();
    }
}

export const orchestrator = new Orchestrator();
