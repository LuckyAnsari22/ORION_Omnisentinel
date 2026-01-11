/**
 * ENHANCED ACCESSIBLE OVERLAY UI
 * 
 * User-friendly interface with visible controls:
 * - Camera capture button
 * - Voice input toggle
 * - Mode selection
 * - Status indicators
 * - Keyboard shortcuts
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSystemState, useSystemStateValue } from '../../services/SystemStateStore';
import { Camera, Mic, MicOff, Eye, ShoppingBag, BookOpen, Compass, Settings, HelpCircle } from 'lucide-react';
import { verifiedPipeline } from '../../services/intelligence/verifiedAnalysisPipeline';
import type { AnalysisContext } from '../../services/intelligence/verifiedAnalysisPipeline';

/**
 * Main control panel with all interactive elements
 */
export const EnhancedOverlayUI: React.FC = () => {
    const state = useSystemStateValue();
    const transitionToListening = useSystemState((s) => s.transitionToListening);
    const transitionToIdle = useSystemState((s) => s.transitionToIdle);
    const setAnalysisResult = useSystemState((s: any) => s.setAnalysisResult);
    const setConfidenceScore = useSystemState((s: any) => s.setConfidenceScore);

    const [isListening, setIsListening] = useState(false);
    const [currentMode, setCurrentMode] = useState<'general' | 'product' | 'learn' | 'surroundings'>('general');
    const [showHelp, setShowHelp] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<string>('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initialize camera
    useEffect(() => {
        const initCamera = async () => {
            try {
                console.log('📷 Requesting camera access...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user', // Changed from 'environment' to 'user' for desktop
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });

                console.log('✅ Camera access granted');
                setCameraStream(stream);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;

                    // CRITICAL: Must call play() to start the video stream
                    try {
                        await videoRef.current.play();
                        console.log('✅ Camera stream playing');
                    } catch (playErr) {
                        console.error('Error starting video playback:', playErr);
                    }
                }
            } catch (err) {
                console.error('❌ Camera access error:', err);
                setLastResult('Camera access denied. Please allow camera permissions in your browser.');
            }
        };

        initCamera();

        return () => {
            if (cameraStream) {
                console.log('🛑 Stopping camera stream');
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Initialize AI engines
    useEffect(() => {
        const initAI = async () => {
            try {
                // Get API key from environment or localStorage
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY ||
                    localStorage.getItem('gemini_api_key') ||
                    '';

                console.log('🔍 Initializing Verified Analysis Pipeline...');
                await verifiedPipeline.initialize(apiKey);
                console.log('✅ Verified Analysis Pipeline ready');
                console.log('ℹ️ Analysis will prioritize ACCURACY over AVAILABILITY');
            } catch (err) {
                console.error('❌ AI initialization error:', err);
            }
        };

        initAI();
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // C key for capture
            if (e.key === 'c' || e.key === 'C') {
                if (e.target === document.body) {
                    e.preventDefault();
                    handleCapture();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isProcessing]); // Re-bind when isProcessing changes

    // Handle camera capture
    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current || isProcessing) return;

        setIsProcessing(true);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                setIsProcessing(false);
                return;
            }

            // Check if video is ready
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                setLastResult('Camera not ready. Please wait a moment and try again.');
                setIsProcessing(false);
                return;
            }

            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw current frame
            ctx.drawImage(video, 0, 0);

            // Convert canvas to base64 data URL (better compatibility with all engines)
            const base64Image = canvas.toDataURL('image/jpeg', 0.95);

            console.log('📸 Image captured, analyzing...');

            // Analyze with VERIFIED PIPELINE (4-stage verification)
            // This prioritizes ACCURACY over AVAILABILITY
            const context: AnalysisContext = {
                mode: currentMode === 'product' ? 'shopping' :
                    currentMode === 'learn' ? 'learning' :
                        currentMode === 'surroundings' ? 'surroundings' : 'scan',
                userQuery: '',
                confidenceThreshold: 0.5 // Require 50% confidence minimum
            };

            console.log('🔍 Running verified analysis pipeline...');
            const verifiedAnalysis = await verifiedPipeline.analyzeImage(base64Image, context);

            // Generate honest description from verified analysis
            const description = verifiedPipeline.generateDescription(verifiedAnalysis, context);

            // Log analysis details
            console.log('📊 Analysis Results:');
            console.log(`  Objects: ${verifiedAnalysis.objects.length}`);
            console.log(`  Confidence: ${(verifiedAnalysis.overallConfidence * 100).toFixed(1)}%`);
            console.log(`  Source: ${verifiedAnalysis.analysisSource}`);
            console.log(`  Stages: ${verifiedAnalysis.stagesCompleted.join(', ')}`);
            if (verifiedAnalysis.uncertaintyReasons.length > 0) {
                console.log(`  Uncertainties: ${verifiedAnalysis.uncertaintyReasons.join('; ')}`);
            }

            setLastResult(description);
            setAnalysisResult(description);
            setConfidenceScore(verifiedAnalysis.overallConfidence);

            console.log('✅ Analysis complete');

            // Speak the result
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(description);
                utterance.rate = parseFloat(localStorage.getItem('speech_rate') || '1');
                utterance.lang = localStorage.getItem('speech_language') || 'en-US';
                window.speechSynthesis.speak(utterance);
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setLastResult('Failed to analyze image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle voice toggle
    const handleVoiceToggle = () => {
        if (isListening) {
            setIsListening(false);
            transitionToIdle();
        } else {
            setIsListening(true);
            transitionToListening();
        }
    };

    // Mode configurations
    const modes = [
        { id: 'general', label: 'General', icon: Eye, description: 'Describe what you see' },
        { id: 'product', label: 'Shopping', icon: ShoppingBag, description: 'Product information' },
        { id: 'learn', label: 'Learn', icon: BookOpen, description: 'Educational insights' },
        { id: 'surroundings', label: 'Navigate', icon: Compass, description: 'Surroundings awareness' },
    ] as const;

    return (
        <div className="fixed inset-0 z-40 pointer-events-none">
            {/* Camera Preview - Small live preview in corner */}
            <div className="absolute top-20 left-4 pointer-events-auto">
                <div className="relative rounded-lg overflow-hidden border-2 border-white/30 shadow-lg">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-48 h-36 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-2 py-1">
                        <p className="text-white text-xs">📷 Live Camera</p>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Top Status Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    {/* Status Indicator */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${state === 'IDLE' ? 'bg-blue-500/20 border-blue-500/50 text-blue-100' :
                        state === 'LISTENING' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-100' :
                            state === 'THINKING' ? 'bg-purple-500/20 border-purple-500/50 text-purple-100' :
                                'bg-orange-500/20 border-orange-500/50 text-orange-100'
                        }`}>
                        <span className="animate-pulse">●</span>
                        <span className="font-medium text-sm">
                            {state === 'IDLE' ? 'Ready' :
                                state === 'LISTENING' ? 'Listening...' :
                                    state === 'THINKING' ? 'Analyzing...' :
                                        'Speaking...'}
                        </span>
                    </div>

                    {/* Help Button */}
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
                        aria-label="Toggle help"
                    >
                        <HelpCircle className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Help Panel */}
            {showHelp && (
                <div className="absolute top-20 right-4 p-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 pointer-events-auto max-w-md">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">How to Use VisualKy</h3>
                    <div className="space-y-3 text-sm text-gray-700">
                        <div>
                            <p className="font-semibold">📸 Camera Button</p>
                            <p className="text-gray-600">Capture and analyze what's in front of you</p>
                        </div>
                        <div>
                            <p className="font-semibold">🎤 Voice Button</p>
                            <p className="text-gray-600">Ask questions or give commands</p>
                        </div>
                        <div>
                            <p className="font-semibold">🎯 Modes</p>
                            <p className="text-gray-600">Choose different analysis types</p>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                            <p className="font-semibold mb-2">Keyboard Shortcuts:</p>
                            <ul className="space-y-1 text-xs text-gray-600">
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> - Toggle voice</li>
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded">C</kbd> - Capture image</li>
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> - Cancel</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Mode Selector */}
            <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-auto">
                <div className="flex flex-col gap-2">
                    {modes.map((mode) => {
                        const Icon = mode.icon;
                        const isActive = currentMode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => setCurrentMode(mode.id as any)}
                                className={`group relative p-3 rounded-xl backdrop-blur-md border transition-all ${isActive
                                    ? 'bg-blue-500/30 border-blue-400/50 scale-110'
                                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                                    }`}
                                aria-label={mode.label}
                                title={mode.description}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'text-blue-100' : 'text-white'}`} />

                                {/* Tooltip */}
                                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {mode.description}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Result Display */}
            {lastResult && (
                <div className="absolute top-1/2 right-4 -translate-y-1/2 max-w-md pointer-events-auto">
                    <div className="p-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Analysis Result
                        </h4>
                        <p className="text-gray-900 leading-relaxed">{lastResult}</p>
                    </div>
                </div>
            )}

            {/* Bottom Control Panel */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-auto">
                <div className="max-w-4xl mx-auto">
                    {/* Main Controls */}
                    <div className="flex items-center justify-center gap-6">
                        {/* Voice Toggle */}
                        <button
                            onClick={handleVoiceToggle}
                            className={`p-6 rounded-full backdrop-blur-md border-2 transition-all transform hover:scale-110 ${isListening
                                ? 'bg-cyan-500/30 border-cyan-400 shadow-lg shadow-cyan-500/50'
                                : 'bg-white/10 border-white/30 hover:bg-white/20'
                                }`}
                            aria-label={isListening ? 'Stop listening' : 'Start listening'}
                        >
                            {isListening ? (
                                <Mic className="w-8 h-8 text-cyan-100 animate-pulse" />
                            ) : (
                                <MicOff className="w-8 h-8 text-white" />
                            )}
                        </button>

                        {/* Camera Capture */}
                        <button
                            onClick={handleCapture}
                            disabled={isProcessing}
                            className={`p-8 rounded-full backdrop-blur-md border-4 transition-all transform hover:scale-110 ${isProcessing
                                ? 'bg-purple-500/30 border-purple-400 animate-pulse'
                                : 'bg-blue-500/30 border-blue-400 hover:bg-blue-500/40 shadow-lg shadow-blue-500/50'
                                }`}
                            aria-label="Capture and analyze"
                        >
                            <Camera className="w-10 h-10 text-white" />
                        </button>

                        {/* Settings */}
                        <button
                            onClick={() => window.location.href = '/settings'}
                            className="p-6 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 hover:bg-white/20 transition-all transform hover:scale-110"
                            aria-label="Settings"
                        >
                            <Settings className="w-8 h-8 text-white" />
                        </button>
                    </div>

                    {/* Instruction Text */}
                    <div className="mt-6 text-center">
                        <p className="text-white/80 text-sm">
                            {isProcessing ? 'Analyzing image...' :
                                isListening ? 'Listening for your command...' :
                                    'Tap camera to analyze or microphone to speak'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-white text-lg font-medium">Analyzing with AI...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedOverlayUI;
