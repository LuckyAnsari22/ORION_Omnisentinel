import React, { useState } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import type { ThemeMode } from '../contexts/AccessibilityContext';

export const AccessibilityPanel: React.FC = () => {
    const { theme, setTheme, fontSize, setFontSize, hapticEnabled, setHapticEnabled } = useAccessibility();
    const [isOpen, setIsOpen] = useState(false);

    const themes: { value: ThemeMode; label: string; description: string }[] = [
        { value: 'default', label: 'Default Dark', description: 'Standard dark theme' },
        { value: 'highContrastDark', label: 'High Contrast Dark', description: 'Maximum contrast for visibility' },
        { value: 'highContrastLight', label: 'High Contrast Light', description: 'Light background, high contrast' },
        { value: 'lowLight', label: 'Low Light', description: 'Red-shifted for night viewing' },
        { value: 'protanopia', label: 'Protanopia', description: 'Red-blind friendly' },
        { value: 'deuteranopia', label: 'Deuteranopia', description: 'Green-blind friendly' },
        { value: 'largeText', label: 'Large Text', description: 'Increased font sizes' },
    ];

    return (
        <>
            {/* Floating accessibility button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Accessibility settings"
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent-primary text-bg-primary shadow-lg hover:scale-110 transition-transform focus:outline-none focus:ring-4 focus:ring-accent-primary/50"
                style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--bg-primary)',
                }}
            >
                <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
            </button>

            {/* Accessibility panel */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-6 z-50 w-96 rounded-xl shadow-2xl p-6 backdrop-blur-md"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Accessibility
                        </h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            aria-label="Close accessibility panel"
                            className="w-8 h-8 rounded-full hover:bg-white/10 transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Theme selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>
                            THEME
                        </label>
                        <div className="space-y-2">
                            {themes.map((t) => (
                                <button
                                    key={t.value}
                                    onClick={() => setTheme(t.value)}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${theme === t.value ? 'ring-2' : 'hover:bg-white/5'
                                        }`}
                                    style={{
                                        backgroundColor: theme === t.value ? 'var(--accent-primary)20' : 'transparent',
                                        borderColor: theme === t.value ? 'var(--accent-primary)' : 'transparent',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <div className="font-semibold">{t.label}</div>
                                    <div className="text-xs opacity-70">{t.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font size slider */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>
                            FONT SIZE: {fontSize}px
                        </label>
                        <input
                            type="range"
                            min="12"
                            max="24"
                            value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((fontSize - 12) / 12) * 100}%, rgba(255,255,255,0.1) ${((fontSize - 12) / 12) * 100}%, rgba(255,255,255,0.1) 100%)`,
                            }}
                        />
                    </div>

                    {/* Haptic feedback toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Haptic Feedback
                            </div>
                            <div className="text-xs opacity-70" style={{ color: 'var(--text-secondary)' }}>
                                Vibration on interactions
                            </div>
                        </div>
                        <button
                            onClick={() => setHapticEnabled(!hapticEnabled)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${hapticEnabled ? 'bg-accent-primary' : 'bg-white/20'
                                }`}
                            style={{
                                backgroundColor: hapticEnabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)',
                            }}
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${hapticEnabled ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Keyboard shortcuts hint */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="text-xs opacity-70" style={{ color: 'var(--text-secondary)' }}>
                            <div className="font-bold mb-2">KEYBOARD SHORTCUTS</div>
                            <div>Ctrl+H - Home</div>
                            <div>Ctrl+1 - Guardian AI</div>
                            <div>Ctrl+2 - Visualky</div>
                            <div>Ctrl+Shift+T - Toggle theme</div>
                            <div>Ctrl+/ - Show all shortcuts</div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
