import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Camera, Volume2 } from 'lucide-react';
import {
  analyzeFrame,
  processVoice,
  switchMode,
  getAvailableModes,
  getLearnedItems,
  setVideoElement
} from '../services/aiIntegration';

interface AnalysisResult {
  analysis: string;
  mode: string;
  confidence: number;
}

/**
 * MAIN INTELLIGENT INTERFACE COMPONENT
 * Hackathon-grade UI with accessibility-first design
 */
export const IntelligentInterface: React.FC<{ apiKey: string }> = ({ apiKey }) => {
  const [currentMode, setCurrentMode] = useState('standby');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [learnedItems, setLearnedItems] = useState<any[]>([]);
  const [feedback, setFeedback] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize on mount
  useEffect(() => {
    initializeSystems();
    loadLearnedItems();
  }, [apiKey]);

  // Register video element for Smart Voice-Vision System
  useEffect(() => {
    if (videoRef.current && isCameraActive) {
      setVideoElement(videoRef.current);
      console.log('📹 Video element registered for smart voice analysis');
    }
  }, [videoRef.current, isCameraActive]);

  const initializeSystems = async () => {
    try {
      const { initializeAISystem } = await import('../services/aiIntegration');
      await initializeAISystem(apiKey);

      // Auto-switch to Scan mode for camera analysis
      const { switchMode } = await import('../services/aiIntegration');
      await switchMode('scan');
      setCurrentMode('scan');

      setFeedback('✅ System ready. Start camera and click Analyze, or say a command.');
    } catch (error) {
      setFeedback('❌ Error initializing system. Check API key.');
      console.error('Init error:', error);
    }
  };

  const loadLearnedItems = () => {
    try {
      const items = getLearnedItems();
      setLearnedItems(items);
    } catch (error) {
      console.error('Error loading learned items:', error);
    }
  };

  /**
   * Text-to-speech
   */
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, []);

  /**
   * Capture frame from camera and analyze
   */
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Camera or canvas not initialized');
      setFeedback('Camera not ready');
      return;
    }

    try {
      console.log('📸 Capturing frame...');
      const context = canvasRef.current.getContext('2d');
      if (!context) {
        console.error('❌ Canvas context failed');
        setFeedback('Canvas error');
        return;
      }

      context.drawImage(videoRef.current, 0, 0, 640, 480);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      console.log('📸 Frame captured, sending to analysis...');

      setFeedback('Analyzing image...');
      const result = await analyzeFrame(imageData);
      console.log('✅ Analysis result:', result);

      setAnalysisResult({
        analysis: result.analysis,
        mode: result.mode,
        confidence: result.confidence
      });
      setCurrentMode(result.mode);
      setFeedback(`✅ ${result.analysis}`);

      // Speak result
      speakText(result.analysis);
    } catch (error) {
      console.error('❌ Error in captureAndAnalyze:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setFeedback(`Error: ${errorMsg}`);
    }
  }, [speakText]);

  /**
   * Start camera
   */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setFeedback('Camera active. Point at objects.');
      }
    } catch (error) {
      setFeedback('Error accessing camera');
    }
  }, []);

  /**
   * Stop camera
   */
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(false);
    }
  }, []);

  /**
   * Voice control
   */
  const startVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.language = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setFeedback('Listening...');
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('🎤 Transcript captured:', transcript);
      setFeedback(`You said: "${transcript}" - Processing...`);

      try {
        console.log('⏳ Sending to processVoice...');
        const result = await processVoice(transcript);
        console.log('✅ Got result:', result);

        setAnalysisResult({
          analysis: result.response,
          mode: result.mode,
          confidence: result.confidence
        });
        setCurrentMode(result.mode);
        setFeedback(`Assistant: ${result.response}`);
        speakText(result.response);
      } catch (error) {
        console.error('❌ Error processing voice:', error);
        setFeedback(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    recognition.onerror = (event: any) => {
      setFeedback(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [speakText]);

  /**
   * Mode switching
   */
  const handleModeSwitch = useCallback(async (mode: string) => {
    try {
      const result = await switchMode(mode as any);
      setCurrentMode(mode);
      setFeedback(result);
      speakText(result);
    } catch (error) {
      setFeedback('Error switching mode');
    }
  }, [speakText]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-900 to-black p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          🛍️ Intelligent Shopping Assistant
        </h1>
        <p className="text-gray-300">
          Mode: <span className="font-semibold text-blue-400">{currentMode.toUpperCase()}</span>
        </p>
      </div>

      {/* Camera Feed */}
      <div className="bg-black rounded-lg overflow-hidden mb-6 aspect-video max-w-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ display: isCameraActive ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
        {!isCameraActive && (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <p className="text-gray-400">Camera inactive</p>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="bg-blue-900 bg-opacity-50 border-l-4 border-blue-400 p-4 rounded mb-6 max-w-2xl">
          <h3 className="text-white font-semibold mb-2">Analysis Result:</h3>
          <p className="text-gray-100 text-lg leading-relaxed">
            {analysisResult.analysis}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Confidence: {(analysisResult.confidence * 100).toFixed(0)}%
          </p>
        </div>
      )}

      {/* Learned Items */}
      {learnedItems.length > 0 && (
        <div className="bg-green-900 bg-opacity-30 border border-green-500 rounded p-4 mb-6 max-w-2xl">
          <h3 className="text-green-300 font-semibold mb-2">✓ Learned Items ({learnedItems.length}):</h3>
          <div className="space-y-1">
            {learnedItems.map(item => (
              <p key={item.id} className="text-green-200 text-sm">
                • {item.customName}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-3 max-w-2xl mb-6">
        {/* Camera Controls */}
        <button
          onClick={() => isCameraActive ? stopCamera() : startCamera()}
          className={`py-4 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 text-white transition ${isCameraActive
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
          aria-label={isCameraActive ? 'Stop camera' : 'Start camera'}
        >
          <Camera size={20} />
          {isCameraActive ? 'Stop Camera' : 'Start Camera'}
        </button>

        {/* Capture Button */}
        <button
          onClick={captureAndAnalyze}
          disabled={!isCameraActive}
          className="py-4 px-4 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          aria-label="Analyze current frame"
        >
          📸 Analyze
        </button>

        {/* Voice Input */}
        <button
          onClick={startVoiceInput}
          className={`py-4 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 text-white transition ${isListening
              ? 'bg-red-600 animate-pulse'
              : 'bg-green-600 hover:bg-green-700'
            }`}
          aria-label="Start voice input"
        >
          <Mic size={20} />
          {isListening ? 'Listening...' : 'Voice'}
        </button>

        {/* Speaker Test */}
        <button
          onClick={() => speakText('System ready')}
          className="py-4 px-4 rounded-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2 transition"
          aria-label="Test speaker"
        >
          <Volume2 size={20} />
          Test Sound
        </button>
      </div>

      {/* Mode Selector */}
      <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded p-4 mb-6 max-w-2xl">
        <h3 className="text-white font-semibold mb-3">Operating Modes:</h3>
        <div className="grid grid-cols-2 gap-2">
          {getAvailableModes().map(mode => (
            <button
              key={mode.mode}
              onClick={() => handleModeSwitch(mode.mode)}
              className={`py-2 px-3 rounded text-sm font-semibold transition ${currentMode === mode.mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }`}
              title={mode.description}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status/Feedback */}
      <div className="bg-gray-800 bg-opacity-50 border-l-4 border-yellow-500 p-4 rounded max-w-2xl">
        <p className="text-gray-100">
          {feedback || 'System ready'}
        </p>
      </div>
    </div>
  );
};

export default IntelligentInterface;
