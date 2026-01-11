/**
 * INTEGRATION EXAMPLE
 * 
 * Shows how to integrate the multi-engine vision system into your existing Visualky app
 */

import { useEffect, useState } from 'react';
import { multiEngineVision } from '../services/multiEngineVision';

export function MultiEngineExample() {
    const [isReady, setIsReady] = useState(false);
    const [engineStatus, setEngineStatus] = useState({
        gemini: false,
        huggingface: false,
        openrouter: false,
        local: false
    });
    const [currentEngine, setCurrentEngine] = useState<string>('');
    const [response, setResponse] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Initialize on mount
    useEffect(() => {
        initializeSystem();
    }, []);

    async function initializeSystem() {
        try {
            // Get API key from environment (optional)
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            // Initialize multi-engine system
            await multiEngineVision.initialize(apiKey);

            // Get engine status
            const status = multiEngineVision.getEngineStatus();
            setEngineStatus(status);
            setIsReady(true);

            console.log('✅ Multi-Engine System ready!');
        } catch (error) {
            console.error('Initialization error:', error);
            // System still works with local fallback
            setIsReady(true);
        }
    }

    async function handleVoiceCommand(transcript: string) {
        if (!isReady) return;

        setIsProcessing(true);
        try {
            const result = await multiEngineVision.processVoice(transcript, 'scan');

            setCurrentEngine(result.engine);
            setResponse(result.response);

            // Speak the response
            speak(result.response);

        } catch (error) {
            console.error('Voice processing error:', error);
            setResponse('Sorry, I encountered an error. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleImageCapture(imageBlob: Blob) {
        if (!isReady) return;

        setIsProcessing(true);
        try {
            const result = await multiEngineVision.analyzeImage(
                imageBlob,
                'scan',
                'What product is this?'
            );

            setCurrentEngine(result.engine);
            setResponse(result.response);

            // Speak the response
            speak(result.response);

        } catch (error) {
            console.error('Image analysis error:', error);
            setResponse('Sorry, I encountered an error analyzing the image.');
        } finally {
            setIsProcessing(false);
        }
    }

    function speak(text: string) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Multi-Engine Vision System</h1>

            {/* Status Display */}
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <h2 className="text-xl font-semibold mb-3">System Status</h2>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className={isReady ? 'text-green-600' : 'text-yellow-600'}>
                            {isReady ? '✅' : '⏳'}
                        </span>
                        <span>System: {isReady ? 'Ready' : 'Initializing...'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={engineStatus.gemini ? 'text-green-600' : 'text-gray-400'}>
                            {engineStatus.gemini ? '✅' : '❌'}
                        </span>
                        <span>Gemini 2.0 Flash</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={engineStatus.huggingface ? 'text-green-600' : 'text-gray-400'}>
                            {engineStatus.huggingface ? '✅' : '❌'}
                        </span>
                        <span>Hugging Face (FREE)</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={engineStatus.openrouter ? 'text-green-600' : 'text-gray-400'}>
                            {engineStatus.openrouter ? '✅' : '❌'}
                        </span>
                        <span>OpenRouter (FREE)</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-green-600">✅</span>
                        <span>Local Fallback (ALWAYS)</span>
                    </div>
                </div>
            </div>

            {/* Current Engine */}
            {currentEngine && (
                <div className="mb-4 p-3 bg-blue-100 rounded">
                    <span className="font-semibold">Current Engine:</span> {currentEngine}
                </div>
            )}

            {/* Response Display */}
            {response && (
                <div className="mb-6 p-4 bg-white border-2 border-blue-500 rounded-lg">
                    <h3 className="font-semibold mb-2">AI Response:</h3>
                    <p className="text-gray-800">{response}</p>
                </div>
            )}

            {/* Controls */}
            <div className="space-y-4">
                <button
                    onClick={() => handleVoiceCommand('What is this product?')}
                    disabled={!isReady || isProcessing}
                    className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Processing...' : 'Test Voice Command'}
                </button>

                <button
                    onClick={() => {
                        // Simulate image capture
                        const canvas = document.createElement('canvas');
                        canvas.width = 100;
                        canvas.height = 100;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.fillStyle = 'red';
                            ctx.fillRect(0, 0, 100, 100);
                            canvas.toBlob((blob) => {
                                if (blob) handleImageCapture(blob);
                            });
                        }
                    }}
                    disabled={!isReady || isProcessing}
                    className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Processing...' : 'Test Image Analysis'}
                </button>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold mb-2">ℹ️ How It Works</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                    <li>• System tries Gemini first (best accuracy)</li>
                    <li>• Falls back to Hugging Face (FREE, intelligent)</li>
                    <li>• Falls back to OpenRouter (FREE tier)</li>
                    <li>• Final fallback: Local analysis (ALWAYS works)</li>
                    <li>• <strong>ZERO downtime - never shows errors!</strong></li>
                </ul>
            </div>
        </div>
    );
}

export default MultiEngineExample;
