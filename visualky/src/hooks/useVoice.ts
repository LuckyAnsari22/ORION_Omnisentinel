import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceAnnouncer } from '../components/Accessibility/VoiceAnnouncer';

export type VoiceCommand = 'describe' | 'read-text' | 'find-object' | 'colors' | 'navigate' | 'settings' | 'help' | 'demo' | 'unknown';

interface UseVoiceOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onCommand?: (command: VoiceCommand, text: string) => void;
  voiceSettings?: {
    rate?: number;
    pitch?: number;
    volume?: number;
  };
}

interface UseVoiceReturn {
  isListening: boolean;
  isSpeaking: boolean;
  speak: (text: string, priority?: 'normal' | 'high' | 'immediate') => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  error: string | null;
  parseCommand: (text: string) => VoiceCommand;
  setSpeechRate: (rate: number) => void;
  setSpeechPitch: (pitch: number) => void;
  speechRate: number;
  speechPitch: number;
}

export const useVoice = (options: UseVoiceOptions = {}): UseVoiceReturn => {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = false,
    onCommand,
    voiceSettings = {},
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(voiceSettings.rate ?? 1.0);
  const [speechPitch, setSpeechPitch] = useState(voiceSettings.pitch ?? 1.0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const voiceAnnouncer = useVoiceAnnouncer();
  const isClickingRef = useRef(false);

  // Command mappings
  const commandKeywords: Record<VoiceCommand, string[]> = {
    'describe': ['describe', 'what do you see', 'what is this', 'tell me', 'scene'],
    'read-text': ['read', 'text', 'sign', 'label', 'menu', 'document', 'read text'],
    'find-object': ['find', 'where', 'look for', 'locate'],
    'colors': ['color', 'colours', 'what color', 'outfit'],
    'navigate': ['navigate', 'obstacles', 'navigation', 'ahead', 'path'],
    'settings': ['settings', 'preferences', 'adjust', 'change voice'],
    'help': ['help', 'how do i', 'tutorial', 'guide'],
    'demo': ['demo', 'demonstration', 'show demo'],
    'unknown': [],
  };

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        voiceAnnouncer.announce('Listening', { priority: 'immediate' });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setError(event.error);
        setIsListening(false);
        voiceAnnouncer.announce(`Error: ${event.error}`, { priority: 'high' });
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript.trim());
          const command = parseCommand(finalTranscript.trim());
          if (onCommand) {
            onCommand(command, finalTranscript.trim());
          }
        } else if (interimTranscript) {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setError("Speech recognition not supported in this browser.");
      voiceAnnouncer.announce("Speech recognition not available", { priority: 'high' });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      synthRef.current.cancel();
    };
  }, [language, continuous, interimResults, onCommand, voiceAnnouncer]);

  const parseCommand = useCallback((text: string): VoiceCommand => {
    const lowerText = text.toLowerCase();

    for (const [command, keywords] of Object.entries(commandKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return command as VoiceCommand;
      }
    }

    return 'unknown';
  }, []);

  const speak = useCallback(async (text: string, priority: 'normal' | 'high' | 'immediate' = 'normal'): Promise<void> => {
    return voiceAnnouncer.announce(text, {
      priority: priority as any,
      rate: speechRate,
      pitch: speechPitch,
    });
  }, [voiceAnnouncer, speechRate, speechPitch]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isClickingRef.current) {
      isClickingRef.current = true;
      try {
        setTranscript('');
        setError(null);
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
        setError("Could not start listening");
        isClickingRef.current = false;
      }
      setTimeout(() => {
        isClickingRef.current = false;
      }, 500);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const handleSpeechRateChange = useCallback((rate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2, rate));
    setSpeechRate(clampedRate);
    speak(`Speech rate set to ${Math.round(clampedRate * 100)} percent`, 'normal');
  }, [speak]);

  const handleSpeechPitchChange = useCallback((pitch: number) => {
    const clampedPitch = Math.max(0.5, Math.min(2, pitch));
    setSpeechPitch(clampedPitch);
  }, []);

  return {
    isListening,
    isSpeaking: voiceAnnouncer.isSpeaking,
    speak,
    startListening,
    stopListening,
    transcript,
    error,
    parseCommand,
    setSpeechRate: handleSpeechRateChange,
    setSpeechPitch: handleSpeechPitchChange,
    speechRate,
    speechPitch,
  };
};
