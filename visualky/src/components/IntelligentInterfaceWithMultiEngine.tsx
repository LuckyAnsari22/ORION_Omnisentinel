import { useState, useEffect, useRef } from 'react';
import { Camera, Mic, X, Sparkles, Scan, MessageSquare, AlertCircle, Settings, Brain, Volume2, VolumeX, RefreshCw, Download } from 'lucide-react';
import { multiEngineVision } from '../services/multiEngineVision';
import type { VisionResult, EngineStatus } from '../services/multiEngineVision';

// ==================== TYPES ====================
interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    engine?: string;
    confidence?: number;
}

// ==================== CONVERSATION MANAGER ====================
class ConversationManager {
    private messages: Message[] = [];
    private maxMessages: number = 20;

    addMessage(role: 'user' | 'assistant', content: string, engine?: string, confidence?: number) {
        this.messages.push({
            role,
            content,
            timestamp: Date.now(),
            engine,
            confidence
        });

        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
        }

        console.log(`📝 Message added: ${role} - ${content.substring(0, 50)}...`);
    }

    getMessages(): Message[] {
        return this.messages;
    }

    clearHistory() {
        this.messages = [];
        console.log('🗑️ Conversation history cleared');
    }
}

// ==================== SPEECH SYNTHESIS ====================
class SpeechManager {
    private synth: SpeechSynthesis;
    private enabled: boolean = true;

    constructor() {
        this.synth = window.speechSynthesis;
    }

    speak(text: string) {
        if (!this.enabled) return;

        this.synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = this.synth.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;

        this.synth.speak(utterance);
    }

    stop() {
        this.synth.cancel();
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stop();
        return this.enabled;
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}

// ==================== MAIN COMPONENT ====================
export default function IntelligentInterfaceWithMultiEngine() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentResponse, setCurrentResponse] = useState<{
        text: string;
        timestamp: number;
        confidence?: number;
        engine?: string;
        isError?: boolean;
    } | null>(null);
    const [showResponse, setShowResponse] = useState(false);
    const [currentMode, setCurrentMode] = useState<'scan' | 'ask'>('scan');
    const [isListening, setIsListening] = useState(false);
    const [userQuestion, setUserQuestion] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [tempApiKey, setTempApiKey] = useState('');
    const [speechEnabled, setSpeechEnabled] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [showChatHistory, setShowChatHistory] = useState(false);
    const [engineStatus, setEngineStatus] = useState<EngineStatus>({
        gemini: false,
        huggingface: false,
        openrouter: false,
        tensorflow: false,
        local: true
    });
    const [isInitialized, setIsInitialized] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const recognitionRef = useRef<any>(null);

    const conversationManagerRef = useRef(new ConversationManager());
    const speechManagerRef = useRef(new SpeechManager());

    // Initialize multi-engine vision system
    useEffect(() => {
        const initializeSystem = async () => {
            try {
                const savedKey = localStorage.getItem('gemini_api_key');
                if (savedKey) {
                    setApiKey(savedKey);
                    setTempApiKey(savedKey);
                }

                // Initialize multi-engine system
                await multiEngineVision.initialize(savedKey || undefined);

                // Get engine status
                const status = multiEngineVision.getEngineStatus();
                setEngineStatus(status);
                setIsInitialized(true);

                console.log('✅ Multi-Engine Vision System initialized');
            } catch (error) {
                console.error('❌ Initialization error:', error);
                // System still works with local fallback
                setIsInitialized(true);
            }
        };

        initializeSystem();
    }, []);

    // Initialize camera
    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Update messages from conversation manager
    useEffect(() => {
        const interval = setInterval(() => {
            setMessages(conversationManagerRef.current.getMessages());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: 1280, height: 720 }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera access failed:', err);
            alert('Camera access denied. Please enable camera permissions.');
        }
    };

    const captureFrame = (): string | null => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.8);
    };

    const handleAnalysis = async (result: VisionResult) => {
        console.log('✅ Analysis result:', result);

        setCurrentResponse({
            text: result.response,
            timestamp: Date.now(),
            confidence: result.confidence,
            engine: result.engine,
            isError: false
        });
        setShowResponse(true);

        conversationManagerRef.current.addMessage(
            'assistant',
            result.response,
            result.engine,
            result.confidence
        );

        if (speechEnabled) {
            speechManagerRef.current.speak(result.response);
        }

        if (currentMode === 'scan') {
            setTimeout(() => {
                setShowResponse(false);
            }, 8000);
        }
    };

    const handleCapture = async () => {
        if (isAnalyzing || !isInitialized) return;

        const frame = captureFrame();
        if (!frame) return;

        setIsAnalyzing(true);

        try {
            // Convert mode to match multi-engine expectations
            const mode = currentMode === 'scan' ? 'scan' : 'conversation';

            if (currentMode === 'ask' && userQuestion) {
                conversationManagerRef.current.addMessage('user', userQuestion);
            }

            // Use multi-engine vision system
            const result = await multiEngineVision.analyzeImage(
                frame,
                mode,
                currentMode === 'ask' ? userQuestion : ''
            );

            await handleAnalysis(result);

            if (currentMode === 'ask') {
                setUserQuestion('');
            }

        } catch (error) {
            console.error('❌ Analysis failed:', error);

            setCurrentResponse({
                text: error instanceof Error
                    ? `Analysis failed: ${error.message}. Please try again.`
                    : 'Analysis failed. Please try again.',
                timestamp: Date.now(),
                confidence: 0,
                isError: true
            });
            setShowResponse(true);

            setTimeout(() => setShowResponse(false), 5000);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition not supported in your browser');
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            setUserQuestion(transcript);
            console.log('🎤 Voice input:', transcript);

            // Process voice command through multi-engine
            try {
                const result = await multiEngineVision.processVoice(transcript, currentMode === 'scan' ? 'scan' : 'conversation');

                conversationManagerRef.current.addMessage('user', transcript);
                await handleAnalysis(result);
            } catch (error) {
                console.error('Voice processing error:', error);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const switchMode = (mode: 'scan' | 'ask') => {
        setCurrentMode(mode);
        setShowResponse(false);
        speechManagerRef.current.stop();
    };

    const toggleSpeech = () => {
        const enabled = speechManagerRef.current.toggle();
        setSpeechEnabled(enabled);
    };

    const saveApiKey = async () => {
        localStorage.setItem('gemini_api_key', tempApiKey);
        setApiKey(tempApiKey);

        // Reinitialize multi-engine with new API key
        await multiEngineVision.initialize(tempApiKey);
        const status = multiEngineVision.getEngineStatus();
        setEngineStatus(status);

        setShowSettings(false);
        alert('API key saved successfully! Multi-engine system updated.');
    };

    const clearApiKey = async () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setTempApiKey('');

        // Reinitialize without API key
        await multiEngineVision.initialize();
        const status = multiEngineVision.getEngineStatus();
        setEngineStatus(status);
    };

    const clearHistory = () => {
        conversationManagerRef.current.clearHistory();
        setMessages([]);
        alert('Chat history cleared!');
    };

    const exportChat = () => {
        const chatData = JSON.stringify(messages, null, 2);
        const blob = new Blob([chatData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-history-${Date.now()}.json`;
        a.click();
    };

    const getEngineStatusColor = (engine: keyof EngineStatus) => {
        return engineStatus[engine] ? 'text-green-400' : 'text-gray-500';
    };

    const getEngineIcon = (engineName: string) => {
        switch (engineName) {
            case 'gemini': return '🥇';
            case 'huggingface': return '🥈';
            case 'openrouter': return '🥉';
            case 'local': return '🛡️';
            default: return '🤖';
        }
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* Video Feed */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay UI */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none z-40">
                <div className="flex items-center gap-3 pointer-events-auto">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 hover:bg-black/80 transition-all"
                    >
                        <Settings className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={() => setShowChatHistory(!showChatHistory)}
                        className="p-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 hover:bg-black/80 transition-all relative"
                    >
                        <MessageSquare className="w-5 h-5 text-white" />
                        {messages.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {messages.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Engine Status Indicator */}
                    <div className="px-3 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center gap-2">
                        <span className="text-xs text-white/60">Engine:</span>
                        <span className="text-xs text-white font-medium">
                            {engineStatus.gemini ? '🥇 Gemini' :
                                engineStatus.huggingface ? '🥈 HuggingFace' :
                                    engineStatus.openrouter ? '🥉 OpenRouter' :
                                        '🛡️ Local'}
                        </span>
                    </div>

                    <button
                        onClick={toggleSpeech}
                        className="p-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 hover:bg-black/80 transition-all"
                    >
                        {speechEnabled ? (
                            <Volume2 className="w-5 h-5 text-white" />
                        ) : (
                            <VolumeX className="w-5 h-5 text-white/50" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mode Indicator */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-30">
                <div className="flex items-center gap-2 bg-black/70 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20">
                    {currentMode === 'scan' ? (
                        <>
                            <Scan className="w-5 h-5 text-blue-400" />
                            <span className="text-white font-medium">Scan Mode</span>
                        </>
                    ) : (
                        <>
                            <Brain className="w-5 h-5 text-purple-400" />
                            <span className="text-white font-medium">Ask Mode</span>
                        </>
                    )}
                </div>
            </div>

            {/* Response Display */}
            {showResponse && currentResponse && (
                <div className={`absolute top-32 left-4 right-4 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border animate-fadeIn z-50 ${currentResponse.isError
                    ? 'bg-red-900/90 border-red-500/30'
                    : 'bg-black/90 border-white/20'
                    }`}>
                    <div className="flex items-start gap-3">
                        {currentResponse.isError ? (
                            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                        ) : (
                            <Sparkles className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-lg leading-relaxed break-words">
                                {currentResponse.text}
                            </p>
                            {!currentResponse.isError && (
                                <div className="mt-3 space-y-2">
                                    {/* Confidence Bar */}
                                    {currentResponse.confidence !== undefined && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${currentResponse.confidence * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-white/60 whitespace-nowrap">
                                                {Math.round(currentResponse.confidence * 100)}%
                                            </span>
                                        </div>
                                    )}
                                    {/* Engine Badge */}
                                    {currentResponse.engine && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-white/40">Powered by:</span>
                                            <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
                                                {getEngineIcon(currentResponse.engine)} {currentResponse.engine}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowResponse(false)}
                            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Chat History Sidebar */}
            {showChatHistory && (
                <div className="absolute top-0 right-0 w-96 h-full bg-black/95 backdrop-blur-xl border-l border-white/20 p-4 overflow-y-auto z-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold text-lg">Chat History</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={exportChat}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                title="Export chat"
                            >
                                <Download className="w-4 h-4 text-white" />
                            </button>
                            <button
                                onClick={clearHistory}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                title="Clear history"
                            >
                                <RefreshCw className="w-4 h-4 text-white" />
                            </button>
                            <button
                                onClick={() => setShowChatHistory(false)}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {messages.length === 0 ? (
                            <p className="text-white/40 text-center py-8">No messages yet</p>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg ${msg.role === 'user'
                                        ? 'bg-blue-500/20 border border-blue-500/30'
                                        : 'bg-white/10 border border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-white/60">
                                            {msg.role === 'user' ? 'You' : 'AI'}
                                        </span>
                                        {msg.engine && (
                                            <span className="text-xs text-white/40">
                                                {getEngineIcon(msg.engine)} {msg.engine}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-white text-sm">{msg.content}</p>
                                    {msg.confidence !== undefined && (
                                        <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-400 rounded-full"
                                                style={{ width: `${msg.confidence * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full border border-white/20">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white text-xl font-semibold">Settings</h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Engine Status */}
                        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                            <h3 className="text-white font-medium mb-3">Multi-Engine Status</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-white/60 text-sm">🥇 Gemini 2.0 Flash</span>
                                    <span className={`text-sm ${getEngineStatusColor('gemini')}`}>
                                        {engineStatus.gemini ? '✅ Active' : '❌ Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/60 text-sm">🥈 Hugging Face (FREE)</span>
                                    <span className={`text-sm ${getEngineStatusColor('huggingface')}`}>
                                        {engineStatus.huggingface ? '✅ Active' : '❌ Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/60 text-sm">🥉 OpenRouter (FREE)</span>
                                    <span className={`text-sm ${getEngineStatusColor('openrouter')}`}>
                                        {engineStatus.openrouter ? '✅ Active' : '❌ Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/60 text-sm">🛡️ Local Fallback</span>
                                    <span className="text-sm text-green-400">✅ Always Active</span>
                                </div>
                            </div>
                        </div>

                        {/* API Key Input */}
                        <div className="mb-4">
                            <label className="text-white text-sm mb-2 block">
                                Gemini API Key (Optional - for best accuracy)
                            </label>
                            <input
                                type="password"
                                value={tempApiKey}
                                onChange={(e) => setTempApiKey(e.target.value)}
                                placeholder="Enter your Gemini API key..."
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <p className="text-white/40 text-xs mt-2">
                                Get your free API key from{' '}
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                >
                                    Google AI Studio
                                </a>
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={saveApiKey}
                                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Save API Key
                            </button>
                            {apiKey && (
                                <button
                                    onClick={clearApiKey}
                                    className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors border border-red-500/30"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {!apiKey && (
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <p className="text-blue-300 text-sm">
                                    ℹ️ System works without API key using FREE engines (Hugging Face, OpenRouter, Local)
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none z-30">
                {/* Mode Switcher */}
                <div className="flex justify-center mb-4 pointer-events-auto">
                    <div className="flex gap-2 bg-black/60 backdrop-blur-xl p-2 rounded-full border border-white/20">
                        <button
                            onClick={() => switchMode('scan')}
                            className={`px-6 py-3 rounded-full font-medium transition-all ${currentMode === 'scan'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Scan className="w-4 h-4" />
                                <span>Scan</span>
                            </div>
                        </button>
                        <button
                            onClick={() => switchMode('ask')}
                            className={`px-6 py-3 rounded-full font-medium transition-all ${currentMode === 'ask'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4" />
                                <span>Ask</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Question Input (Ask Mode) */}
                {currentMode === 'ask' && (
                    <div className="mb-4 pointer-events-auto">
                        <div className="max-w-2xl mx-auto bg-black/60 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={userQuestion}
                                    onChange={(e) => setUserQuestion(e.target.value)}
                                    placeholder="Ask anything about the image..."
                                    className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-lg"
                                    onKeyPress={(e) => e.key === 'Enter' && handleCapture()}
                                />
                                <button
                                    onClick={handleVoiceInput}
                                    className={`p-3 rounded-full transition-all ${isListening
                                        ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse'
                                        : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    <Mic className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Capture Button */}
                <div className="flex justify-center pointer-events-auto">
                    <button
                        onClick={handleCapture}
                        disabled={isAnalyzing || !isInitialized}
                        className={`relative group ${isAnalyzing || !isInitialized ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20 group-hover:scale-110 transition-transform">
                            {isAnalyzing ? (
                                <RefreshCw className="w-8 h-8 text-white animate-spin" />
                            ) : (
                                <Camera className="w-8 h-8 text-white" />
                            )}
                        </div>
                    </button>
                </div>

                {/* Status Text */}
                <div className="text-center mt-4 pointer-events-none">
                    <p className="text-white/60 text-sm">
                        {!isInitialized
                            ? 'Initializing multi-engine system...'
                            : isAnalyzing
                                ? 'Analyzing with multi-engine AI...'
                                : currentMode === 'scan'
                                    ? 'Tap to scan any product'
                                    : 'Ask me anything about the image'}
                    </p>
                </div>
            </div>
        </div>
    );
}
