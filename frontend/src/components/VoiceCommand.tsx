import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import annyang from 'annyang';
import { useAppStore } from '../store/appStore';
import { VOICE_COMMANDS } from '../utils/constants';

export const VoiceCommand = () => {
    const navigate = useNavigate();
    const {
        setVoiceEnabled,
        setLastCommand,
        setTransitioning,
        setCurrentSystem
    } = useAppStore();

    const [isSupported, setIsSupported] = useState(false);
    const [listening, setListening] = useState(false);

    useEffect(() => {
        if (annyang) {
            setIsSupported(true);

            // Define commands
            const commands: Record<string, () => void> = {};

            // Map commands from constants
            Object.entries(VOICE_COMMANDS).forEach(([trigger, route]) => {
                commands[trigger] = () => {
                    console.log(`Voice Command: ${trigger} -> ${route}`);
                    setLastCommand(trigger);

                    if (route === '/') {
                        setTransitioning(true);
                        setTimeout(() => {
                            navigate('/');
                            setCurrentSystem('landing');
                            setTransitioning(false);
                        }, 500);
                    } else if (route.includes('guardian')) {
                        navigate('/guardian');
                        setCurrentSystem('guardian');
                    } else if (route.includes('visualky')) {
                        navigate('/visualky');
                        setCurrentSystem('visualky');
                    }
                };
            });

            // Add commands
            annyang.addCommands(commands);

            // Start listening
            annyang.start({ autoRestart: true, continuous: false });
            setVoiceEnabled(true);
            setListening(true);

            // Cleanup
            return () => {
                annyang.abort();
                setVoiceEnabled(false);
            };
        } else {
            console.warn("Speech Recognition not supported in this browser.");
            setVoiceEnabled(false);
        }
    }, [navigate, setVoiceEnabled, setLastCommand, setTransitioning, setCurrentSystem]);

    if (!isSupported) return null;

    return (
        <div className="voice-indicator">
            {listening && (
                <>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        background: '#ff0088',
                        borderRadius: '50%',
                        animation: 'pulse 1s infinite'
                    }} />
                    <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                        VOICE ACTIVE
                    </span>
                    <span style={{
                        fontSize: '0.7em',
                        opacity: 0.7,
                        marginLeft: '8px',
                        borderLeft: '1px solid rgba(255,255,255,0.2)',
                        paddingLeft: '8px'
                    }}>
                        "Open Guardian" • "Open Visualky"
                    </span>
                </>
            )}
        </div>
    );
};
