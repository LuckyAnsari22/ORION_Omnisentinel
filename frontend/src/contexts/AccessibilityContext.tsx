import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode =
    | 'default'
    | 'highContrastDark'
    | 'highContrastLight'
    | 'lowLight'
    | 'protanopia'
    | 'deuteranopia'
    | 'largeText';

export type HapticPattern = number[];

interface AccessibilityContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    keyboardNavEnabled: boolean;
    setKeyboardNavEnabled: (enabled: boolean) => void;
    hapticEnabled: boolean;
    setHapticEnabled: (enabled: boolean) => void;
    triggerHaptic: (pattern: HapticPattern) => void;
    announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within AccessibilityProvider');
    }
    return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeMode>('default');
    const [fontSize, setFontSize] = useState(16);
    const [keyboardNavEnabled, setKeyboardNavEnabled] = useState(true);
    const [hapticEnabled, setHapticEnabled] = useState(true);

    // Load preferences from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('accessibility-theme') as ThemeMode;
        const savedFontSize = localStorage.getItem('accessibility-fontSize');
        const savedHaptic = localStorage.getItem('accessibility-haptic');

        if (savedTheme) setThemeState(savedTheme);
        if (savedFontSize) setFontSize(parseInt(savedFontSize));
        if (savedHaptic) setHapticEnabled(savedHaptic === 'true');
    }, []);

    const setTheme = (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        localStorage.setItem('accessibility-theme', newTheme);
        applyTheme(newTheme);
    };

    const applyTheme = (theme: ThemeMode) => {
        const root = document.documentElement;

        // Remove all theme classes
        root.classList.remove(
            'theme-default',
            'theme-high-contrast-dark',
            'theme-high-contrast-light',
            'theme-low-light',
            'theme-protanopia',
            'theme-deuteranopia',
            'theme-large-text'
        );

        // Add new theme class
        const themeClass = theme.replace(/([A-Z])/g, '-$1').toLowerCase();
        root.classList.add(`theme-${themeClass}`);

        // Apply theme-specific CSS variables
        const themes = {
            default: {
                '--bg-primary': '#0A0E1A',
                '--bg-secondary': '#151922',
                '--text-primary': '#FFFFFF',
                '--text-secondary': '#B0B0B0',
                '--accent-primary': '#00D9FF',
                '--accent-secondary': '#9945FF',
            },
            highContrastDark: {
                '--bg-primary': '#000000',
                '--bg-secondary': '#1A1A1A',
                '--text-primary': '#FFFFFF',
                '--text-secondary': '#FFFFFF',
                '--accent-primary': '#FFFF00',
                '--accent-secondary': '#00FFFF',
            },
            highContrastLight: {
                '--bg-primary': '#FFFFFF',
                '--bg-secondary': '#F0F0F0',
                '--text-primary': '#000000',
                '--text-secondary': '#000000',
                '--accent-primary': '#0000FF',
                '--accent-secondary': '#FF0000',
            },
            lowLight: {
                '--bg-primary': '#1A0A0A',
                '--bg-secondary': '#2A1A1A',
                '--text-primary': '#FFCCCC',
                '--text-secondary': '#FFAAAA',
                '--accent-primary': '#FF6666',
                '--accent-secondary': '#FF9999',
            },
            protanopia: {
                '--bg-primary': '#0A0E1A',
                '--bg-secondary': '#151922',
                '--text-primary': '#FFFFFF',
                '--text-secondary': '#B0B0B0',
                '--accent-primary': '#00AAFF',
                '--accent-secondary': '#FFAA00',
            },
            deuteranopia: {
                '--bg-primary': '#0A0E1A',
                '--bg-secondary': '#151922',
                '--text-primary': '#FFFFFF',
                '--text-secondary': '#B0B0B0',
                '--accent-primary': '#FF6600',
                '--accent-secondary': '#0066FF',
            },
            largeText: {
                '--bg-primary': '#0A0E1A',
                '--bg-secondary': '#151922',
                '--text-primary': '#FFFFFF',
                '--text-secondary': '#B0B0B0',
                '--accent-primary': '#00D9FF',
                '--accent-secondary': '#9945FF',
                '--base-font-size': '20px',
                '--line-height': '1.8',
            },
        };

        const themeVars = themes[theme];
        Object.entries(themeVars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    };

    const triggerHaptic = (pattern: HapticPattern) => {
        if (!hapticEnabled || !navigator.vibrate) return;
        navigator.vibrate(pattern);
    };

    const announceToScreenReader = (message: string) => {
        const announcement = document.getElementById('sr-announcer');
        if (announcement) {
            announcement.textContent = message;
        }
    };

    // Apply initial theme
    useEffect(() => {
        applyTheme(theme);
    }, []);

    const value: AccessibilityContextType = {
        theme,
        setTheme,
        fontSize,
        setFontSize: (size: number) => {
            setFontSize(size);
            localStorage.setItem('accessibility-fontSize', size.toString());
            document.documentElement.style.setProperty('--base-font-size', `${size}px`);
        },
        keyboardNavEnabled,
        setKeyboardNavEnabled,
        hapticEnabled,
        setHapticEnabled: (enabled: boolean) => {
            setHapticEnabled(enabled);
            localStorage.setItem('accessibility-haptic', enabled.toString());
        },
        triggerHaptic,
        announceToScreenReader,
    };

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
            {/* Screen reader announcer */}
            <div
                id="sr-announcer"
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
                style={{
                    position: 'absolute',
                    left: '-10000px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                }}
            />
        </AccessibilityContext.Provider>
    );
};
