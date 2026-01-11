/**
 * LocalLens Toast Notification System
 * Provides visual feedback with accessibility support
 */

import { useCallback, useRef, useState } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const typeConfig: Record<ToastType, { bg: string; border: string; icon: string }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-300 border-l-4',
    icon: 'ℹ️',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-300 border-l-4',
    icon: '✓',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300 border-l-4',
    icon: '⚠️',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-300 border-l-4',
    icon: '✕',
  },
};

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = `toast-${toastIdRef.current++}`;
    const toast: Toast = { id, type, message, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const error = useCallback((message: string, duration?: number) => {
    return show(message, 'error', duration);
  }, [show]);

  const success = useCallback((message: string, duration?: number) => {
    return show(message, 'success', duration);
  }, [show]);

  const warning = useCallback((message: string, duration?: number) => {
    return show(message, 'warning', duration);
  }, [show]);

  const info = useCallback((message: string, duration?: number) => {
    return show(message, 'info', duration);
  }, [show]);

  return { toasts, show, dismiss, error, success, warning, info };
};

// Toast Container Component
export const ToastContainer = ({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 space-y-3 pointer-events-none z-50"
      role="region"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => {
        const config = typeConfig[toast.type];
        return (
          <div
            key={toast.id}
            className={`${config.bg} ${config.border} p-4 rounded-lg shadow-lg pointer-events-auto max-w-sm animate-slide-in`}
            role="alert"
            aria-label={`${toast.type}: ${toast.message}`}
          >
            <div className="flex gap-3 items-start">
              <span className="text-xl shrink-0" aria-hidden="true">
                {config.icon}
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-black">{toast.message}</p>
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-gray-400 hover:text-gray-600 font-bold"
                aria-label={`Dismiss ${toast.type}`}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default { useToast, ToastContainer };
