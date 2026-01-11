import React, { useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { useVoiceAnnouncer } from '../Accessibility/VoiceAnnouncer';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'lg' | 'xl';
    ariaLabel?: string;
    ariaDescription?: string;
    announceOnFocus?: boolean;
    hapticPattern?: 'single' | 'double' | 'triple' | 'long';
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
    label,
    icon,
    variant = 'primary',
    size = 'lg',
    className,
    onClick,
    children,
    ariaLabel,
    ariaDescription,
    announceOnFocus = false,
    hapticPattern = 'single',
    ...props
}) => {
    const voiceAnnouncer = useVoiceAnnouncer();
    const isClickingRef = useRef(false);

    const baseStyles = "flex items-center justify-center font-bold rounded-2xl transition-all active:scale-95 focus-visible:outline-4 focus-visible:outline-blue-900 outline-offset-2";

    const variants = {
        primary: "bg-blue-900 text-yellow-400 hover:bg-blue-800 active:bg-blue-900",
        secondary: "bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50 active:bg-white",
        danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-600",
        outline: "bg-transparent border-2 border-black text-black hover:bg-black hover:text-white"
    };

    const sizes = {
        lg: "p-6 text-xl min-w-[64px] min-h-[64px]",
        xl: "p-8 text-2xl min-w-[80px] min-h-[80px]"
    };

    const hapticPatterns = {
        single: [50],
        double: [50, 100, 50],
        triple: [50, 100, 50, 100, 50],
        long: [200]
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isClickingRef.current) return;
        isClickingRef.current = true;

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(hapticPatterns[hapticPattern]);
        }

        // Voice feedback
        voiceAnnouncer.announce(`Activated ${label}`, { priority: 'high' });

        if (onClick) onClick(e);

        // Reset click flag
        setTimeout(() => {
            isClickingRef.current = false;
        }, 100);
    };

    const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
        if (announceOnFocus) {
            voiceAnnouncer.announce(`Focused on ${label}`, { priority: 'normal' });
        }
        if (props.onFocus) props.onFocus(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        // Announce key shortcuts for accessibility
        if ((e.key === 'Enter' || e.key === ' ') && !isClickingRef.current) {
            isClickingRef.current = true;
            if (navigator.vibrate) {
                navigator.vibrate(hapticPatterns[hapticPattern]);
            }
            voiceAnnouncer.announce(`Activated ${label}`, { priority: 'high' });
        }
        if (props.onKeyDown) props.onKeyDown(e);
    };

    return (
        <button
            aria-label={ariaLabel || label}
            aria-description={ariaDescription}
            className={twMerge(baseStyles, variants[variant], sizes[size], className)}
            onClick={handleClick}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            {...props}
        >
            {icon && <span className="mr-3" aria-hidden="true">{icon}</span>}
            {children || label}
        </button>
    );
};

export default AccessibleButton;
