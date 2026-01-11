/**
 * ACCESSIBLE OVERLAY UI
 * 
 * Transparent status layer that provides:
 * - Voice transcript display
 * - Processing indicators
 * - Confidence feedback
 * - Error messages
 * - Full keyboard navigation
 * 
 * Accessibility first: ARIA labels, screen reader support, keyboard-only operation
 */

import React, { useMemo } from 'react';
import { useSystemState, useSystemStateValue, useAudioLevel } from '../../services/SystemStateStore';

/**
 * Status indicator (visual + accessible)
 */
const StatusIndicator: React.FC = () => {
  const state = useSystemStateValue();

  const statusConfig = useMemo(() => {
    const config: Record<string, { color: string; label: string; icon: string }> = {
      'IDLE': { color: 'bg-blue-500', label: 'Ready', icon: '●' },
      'LISTENING': { color: 'bg-cyan-500', label: 'Listening...', icon: '◆' },
      'THINKING': { color: 'bg-purple-500', label: 'Analyzing...', icon: '◆' },
      'SPEAKING': { color: 'bg-orange-500', label: 'Speaking...', icon: '◆' },
      'ERROR': { color: 'bg-red-500', label: 'Error', icon: '✕' },
    };
    return config[state] || config['IDLE'];
  }, [state]);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.color} text-white text-sm font-medium transition-all duration-300`}
      role="status"
      aria-live="polite"
      aria-label={`System status: ${statusConfig.label}`}
    >
      <span className="animate-pulse">{statusConfig.icon}</span>
      <span>{statusConfig.label}</span>
    </div>
  );
};

/**
 * Transcript display (voice input feedback)
 */
const TranscriptDisplay: React.FC = () => {
  const transcript = useSystemState((s: any) => s.transcript);
  const isFinal = useSystemState((s: any) => s.transcriptFinal);

  if (!transcript) return null;

  return (
    <div
      className="max-w-md p-3 bg-white/80 backdrop-blur rounded-lg border border-blue-200 shadow-md"
      role="complementary"
      aria-label="Voice transcript"
    >
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
        Listening
      </p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">
        {transcript}
        {!isFinal && <span className="animate-pulse">|</span>}
      </p>
      <p className="text-xs text-gray-500 mt-2">
        {isFinal ? '✓ Captured' : '◆ Recording...'}
      </p>
    </div>
  );
};

/**
 * Confidence score bar
 */
const ConfidenceIndicator: React.FC = () => {
  const confidenceScore = useSystemState((s: any) => s.confidenceScore);
  const analysisResult = useSystemState((s: any) => s.analysisResult);

  if (!analysisResult) return null;

  const percentage = (confidenceScore * 100).toFixed(0);
  const confidence = parseFloat(percentage);

  let confidenceColor = 'bg-red-500';
  let confidenceLabel = 'Low';

  if (confidence >= 80) {
    confidenceColor = 'bg-green-500';
    confidenceLabel = 'High';
  } else if (confidence >= 60) {
    confidenceColor = 'bg-yellow-500';
    confidenceLabel = 'Medium';
  }

  return (
    <div
      className="w-full max-w-xs"
      role="progressbar"
      aria-label={`Confidence: ${percentage}%`}
      aria-valuenow={confidence}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-600">Confidence</span>
        <span className="text-xs font-bold text-gray-700">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${confidenceColor} transition-all duration-300`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{confidenceLabel} confidence</p>
    </div>
  );
};

/**
 * Error message display
 */
const ErrorDisplay: React.FC = () => {
  const state = useSystemState((s: any) => s.state);
  const errorContext = useSystemState((s: any) => s.errorContext);

  if (state !== 'ERROR' || !errorContext) return null;

  const errorMessages: Record<string, string> = {
    'voice-not-available': 'Voice recognition not available. Please check your browser settings.',
    'network-error': 'Network error. Please check your connection.',
    'no-speech-detected': 'No speech detected. Please try again.',
    'service-unavailable': 'Service temporarily unavailable. Retrying...',
    'permission-denied': 'Microphone access denied. Please enable permissions.',
  };

  const errorMessage = errorMessages[errorContext.type] || 'An error occurred. Please try again.';

  return (
    <div
      className="max-w-md p-4 bg-red-50 border-l-4 border-red-500 rounded shadow-md"
      role="alert"
      aria-live="assertive"
      aria-label="Error notification"
    >
      <p className="text-sm font-semibold text-red-700">⚠ Error</p>
      <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
      <p className="text-xs text-red-500 mt-2">
        {errorContext.recoverable ? 'System will attempt recovery automatically.' : 'Please refresh the page to continue.'}
      </p>
    </div>
  );
};

/**
 * Processing progress indicator
 */
const ProgressIndicator: React.FC = () => {
  const state = useSystemState((s: any) => s.state);
  const processingProgress = useSystemState((s: any) => s.processingProgress);

  if (state !== 'THINKING' && state !== 'SPEAKING') return null;

  return (
    <div
      className="w-full max-w-xs"
      role="progressbar"
      aria-label={`Processing: ${(processingProgress * 100).toFixed(0)}%`}
      aria-valuenow={processingProgress * 100}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-600">Processing</span>
        <span className="text-xs font-bold text-gray-700">
          {(processingProgress * 100).toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${processingProgress * 100}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Audio level indicator
 */
const AudioLevelIndicator: React.FC = () => {
  const state = useSystemState((s: any) => s.state);
  const audioLevel = useAudioLevel();

  if (state !== 'LISTENING') return null;

  // Create visual bars
  const bars = Array.from({ length: 10 });
  const activeBars = Math.ceil((audioLevel.amplitude / 1) * 10);

  return (
    <div
      className="flex gap-1 items-end"
      role="complementary"
      aria-label="Audio input level"
    >
      {bars.map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-sm transition-all duration-100 ${
            i < activeBars ? 'bg-cyan-500 h-6' : 'bg-gray-300 h-2'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

/**
 * Keyboard shortcuts help (accessible via keyboard)
 */
const KeyboardHelp: React.FC = () => {
  const [showHelp, setShowHelp] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {showHelp && (
        <div
          className="max-w-md p-4 bg-white/90 backdrop-blur rounded-lg border border-gray-300 shadow-lg"
          role="complementary"
          aria-label="Keyboard shortcuts"
        >
          <h3 className="text-sm font-bold text-gray-700 mb-2">Keyboard Shortcuts</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">Space</kbd> - Toggle listening</li>
            <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> - Cancel operation</li>
            <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">Ctrl+/</kbd> - Toggle this help</li>
            <li><kbd className="px-1 py-0.5 bg-gray-100 rounded">Tab</kbd> - Navigate UI</li>
          </ul>
        </div>
      )}
    </>
  );
};

/**
 * Main overlay UI component
 */
export const AccessibleOverlayUI: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-between p-4 md:p-8 z-40">
      {/* Top section: Status + Indicators */}
      <div className="pointer-events-auto flex flex-col items-center gap-4">
        <StatusIndicator />
        <AudioLevelIndicator />
      </div>

      {/* Center section: Transcript + Progress */}
      <div className="pointer-events-auto flex flex-col items-center gap-4">
        <TranscriptDisplay />
        <ProgressIndicator />
      </div>

      {/* Bottom section: Confidence + Error + Help */}
      <div className="pointer-events-auto flex flex-col items-center gap-4 w-full">
        <ConfidenceIndicator />
        <ErrorDisplay />
        <KeyboardHelp />
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        <StatusIndicator />
      </div>
    </div>
  );
};

export default AccessibleOverlayUI;
