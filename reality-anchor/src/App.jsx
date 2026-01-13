import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Eye, Navigation, User, Coffee, Tv, Sparkles, X } from 'lucide-react';
import './App.css';

// Initialize Gemini
const API_KEY = "AIzaSyDBGGhd0SxfpouxkD_JKmdOEMJCaAq3MAU";
const genAI = new GoogleGenerativeAI(API_KEY);

function App() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [camError, setCamError] = useState(null);

  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const loopRef = useRef(null);

  useEffect(() => {
    init();
    return () => cancelAnimationFrame(loopRef.current);
  }, []);

  const init = async () => {
    try {
      await tf.ready();
      modelRef.current = await cocoSsd.load();
      setLoading(false);
      startCamera();
    } catch (err) {
      console.error("Initialization error:", err);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          detectLoop();
        };
      }
    } catch (e) {
      console.error("Camera access failed:", e);
      if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        setCamError("CAMERA BUSY: Please close OTHER tabs using the camera (BioSync, etc) and Refresh.");
      } else {
        setCamError("CAMERA ERROR: " + e.message);
      }
    }
  };

  const detectLoop = async () => {
    if (videoRef.current && modelRef.current && videoRef.current.readyState === 4) {
      if (!isAnalyzing) {
        const preds = await modelRef.current.detect(videoRef.current);
        setPredictions(preds);
      }
    }
    loopRef.current = requestAnimationFrame(detectLoop);
  };

  const analyzeSceneWithGemini = async () => {
    if (!videoRef.current) return;
    setIsAnalyzing(true);
    setAiAnalysis("Thinking...");

    try {
      // Capture Frame
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);

      const base64Data = canvas.toDataURL("image/jpeg").split(",")[1];

      const visionPrompt = "You are an assistant for a patient with dementia. Describe what is in this image briefly, kindly, and clearly. Highlight any important items like water, medicine, or loved ones. Do not use complex words. Keep it under 2 sentences.";
      const imagePart = { inlineData: { data: base64Data, mimeType: "image/jpeg" } };

      // FALLBACK LOGIC - VISION
      // Added 1.5-pro and updated flash versions
      const visionModels = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-1.5-flash-8b"];
      let responseText = null;

      // Try Vision Models
      for (const modelName of visionModels) {
        try {
          console.log(`Attempting Vision Model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([visionPrompt, imagePart]);
          const response = await result.response;
          responseText = response.text();
          if (responseText) break;
        } catch (e) {
          console.warn(`Vision Model ${modelName} failed:`, e);
        }
      }

      // TEXT-ONLY FALLBACK (If Vision Fails)
      if (!responseText) {
        console.log("Vision failed. Trying Text-Only fallback.");
        try {
          const detectedObjects = predictions.length > 0 ? predictions.map(p => p.class).join(", ") : "an unclear scene";
          const textPrompt = `I am an AI assistant for a dementia patient. Local sensors detect: [${detectedObjects}]. Write a short description.`;
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(textPrompt);
          const response = await result.response;
          responseText = response.text() + " (Text-based Analysis)";
        } catch (textError) {
          console.error("Text Fallback Failed:", textError);
        }
      }

      if (responseText) {
        setAiAnalysis(responseText);
      } else {
        throw new Error("All AI models failed.");
      }

    } catch (error) {
      console.warn("Gemini Unavailable - Switching to Smart Simulation:", error);

      // SMART SIMULATION FALLBACK
      const detected = predictions.length > 0 ? predictions[0].class : 'unknown';
      const simResponse = getSimulatedResponse(detected);
      setAiAnalysis(simResponse + " (Offline Mode)");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSimulatedResponse = (label) => {
    const responses = {
      'person': "I see a person. If they look familiar, try saying hello!",
      'cup': "There is a drink here. Staying hydrated is very important.",
      'bottle': "I see a bottle. Have some water if you are thirsty.",
      'chair': "There is a place to sit. Take a rest if you need to.",
      'couch': "I see a couch. A comfortable spot to relax.",
      'tv': "There is a TV here.",
      'laptop': "I see a computer. Good for connecting with family.",
      'cell phone': "A phone is nearby. Do you want to call someone?",
      'book': "I see a book. Reading is good for the mind.",
      'plant': "A plant is here. Nature is soothing.",
      'unknown': "I can't clearly identify this, but I'm here to help."
    };
    return responses[label] || `I see a ${label}. It is safe.`;
  };

  const getContext = (classLabel) => {
    switch (classLabel) {
      case 'person': return { text: 'Person', icon: <User size={20} />, helper: 'Familiar Face?' };
      case 'cup':
      case 'bottle': return { text: 'Drink', icon: <Coffee size={20} />, helper: 'Stay hydrated' };
      case 'chair':
      case 'couch': return { text: 'Seat', icon: <Navigation size={20} />, helper: 'Rest here' };
      case 'tv':
      case 'laptop': return { text: 'Screen', icon: <Tv size={20} />, helper: 'Information' };
      default: return { text: classLabel, icon: <Eye size={20} />, helper: 'Object' };
    }
  };

  return (
    <div className="app-container">
      {loading && (
        <div className="loading-screen">
          <Eye size={48} className="animate-pulse" />
          <h2>Starting Anchor...</h2>
        </div>
      )}

      {camError && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.9)', zIndex: 9999, color: 'red', display: 'flex',
          justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center'
        }}>
          <X size={64} />
          <h3>{camError}</h3>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px' }}>REFRESH</button>
        </div>
      )}

      <video ref={videoRef} className="camera-view" playsInline autoPlay muted />

      <div className="header-overlay">
        <h1 style={{ margin: 0, color: '#5a4bda', fontSize: '1.2rem', background: 'rgba(255,255,255,0.8)', padding: '5px 10px', borderRadius: '8px' }}>REALITY ANCHOR</h1>
      </div>

      {/* Real-time Overlay */}
      {!aiAnalysis && (
        <div className="ar-overlay">
          {predictions.map((pred, i) => {
            if (pred.score < 0.6) return null;
            const [x, y, w, h] = pred.bbox;
            const ctx = getContext(pred.class);
            const cx = x + w / 2;
            const cy = y;
            return (
              <div key={i} className="anchor-card" style={{ left: `${cx}px`, top: `${cy}px` }}>
                <div style={{ color: '#5a4bda' }}>{ctx.icon}</div>
                <div className="label-text">{ctx.text}</div>
                <div className="helper-text">{ctx.helper}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Controls */}
      <div style={{ position: 'absolute', bottom: '2rem', left: 0, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 100 }}>
        {aiAnalysis ? (
          <div className="ai-result-card" style={{
            background: 'white', padding: '1.5rem', borderRadius: '16px', width: '90%', maxWidth: '400px',
            boxShadow: '0 10px 30px rgba(90, 75, 218, 0.3)', border: '2px solid #5a4bda', animation: 'popIn 0.3s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '8px', color: '#5a4bda', fontWeight: 'bold' }}>
                <Sparkles size={20} /> GEMINI ANALYSIS
              </div>
              <button onClick={() => setAiAnalysis(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#666" />
              </button>
            </div>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.5', color: '#333' }}>{aiAnalysis}</p>
          </div>
        ) : (
          <button onClick={analyzeSceneWithGemini} disabled={isAnalyzing} style={{
            background: 'linear-gradient(135deg, #5a4bda, #8a2be2)', color: 'white', border: 'none',
            padding: '1rem 2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(90, 75, 218, 0.4)',
            opacity: isAnalyzing ? 0.8 : 1
          }}>
            {isAnalyzing ? (
              <><Sparkles className="animate-spin" /> OBSERVING...</>
            ) : (
              <><Eye /> WHAT IS THIS?</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
