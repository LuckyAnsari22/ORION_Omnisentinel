import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
                const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
                const altMatch = shortcut.alt ? event.altKey : !event.altKey;
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        },
        [shortcuts]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);
};

export const useGlobalKeyboardShortcuts = () => {
    const navigate = useNavigate();
    const { setTheme, announceToScreenReader } = useAccessibility();

    const shortcuts: KeyboardShortcut[] = [
        {
            key: 'h',
            ctrl: true,
            description: 'Go to home',
            action: () => {
                navigate('/');
                announceToScreenReader('Navigated to home page');
            },
        },
        {
            key: '1',
            ctrl: true,
            description: 'Go to Guardian AI',
            action: () => {
                window.location.href = 'https://omnisentinel-guardian.vercel.app';
            },
        },
        {
            key: '2',
            ctrl: true,
            description: 'Go to Visualky',
            action: () => {
                window.location.href = 'https://visualky.vercel.app';
            },
        },
        {
            key: 't',
            ctrl: true,
            shift: true,
            description: 'Toggle theme',
            action: () => {
                // Cycle through themes
                const themes = ['default', 'highContrastDark', 'highContrastLight', 'lowLight'];
                const currentTheme = localStorage.getItem('accessibility-theme') || 'default';
                const currentIndex = themes.indexOf(currentTheme);
                const nextTheme = themes[(currentIndex + 1) % themes.length];
                setTheme(nextTheme as any);
                announceToScreenReader(`Theme changed to ${nextTheme}`);
            },
        },
        {
            key: '/',
            ctrl: true,
            description: 'Show keyboard shortcuts',
            action: () => {
                announceToScreenReader('Keyboard shortcuts: Ctrl+H for home, Ctrl+1 for Guardian AI, Ctrl+2 for Visualky, Ctrl+Shift+T to toggle theme');
            },
        },
    ];

    useKeyboardShortcuts(shortcuts);

    return shortcuts;
};

export const useFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTabKey as any);
        firstElement?.focus();

        return () => {
            container.removeEventListener('keydown', handleTabKey as any);
        };
    }, [containerRef]);
};
