import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { SYSTEMS } from '../utils/constants';

interface SystemProxyProps {
    systemId: keyof typeof SYSTEMS;
}

export const SystemProxy = ({ systemId }: SystemProxyProps) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const { setCurrentSystem, setTransitioning } = useAppStore();

    const system = SYSTEMS[systemId];
    // Retrieve URL, handle environment variables if set in Vite config
    const baseUrl = systemId === 'guardian'
        ? 'http://localhost:5175'
        : 'http://localhost:5173';

    useEffect(() => {
        // Reset state on mount
        setCurrentSystem(systemId);

        // --- Camera Hand-off Logic ---
        const handleCameraHandover = async () => {
            if (systemId === 'visualky') {
                // Tell Guardian AI to release the camera so Visualky can use it in browser
                try {
                    await fetch('http://localhost:5001/api/camera/stop', { method: 'POST' });
                    console.log('🛡️ Guardian camera released for 👁️ Visualky');
                } catch (e) {
                    console.warn('Failed to stop Guardian camera:', e);
                }
            } else if (systemId === 'guardian') {
                // Ensure Guardian AI re-acquires the camera
                try {
                    await fetch('http://localhost:5001/api/camera/start', { method: 'POST' });
                    console.log('🛡️ Guardian camera re-acquired');
                } catch (e) {
                    console.warn('Failed to start Guardian camera:', e);
                }
            }
        };

        handleCameraHandover();

        // Simulate initial loading or wait for iframe load event
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, [systemId, setCurrentSystem]);

    const handleBack = () => {
        setTransitioning(true);
        setTimeout(() => {
            navigate('/');
            setCurrentSystem('landing');
            setTransitioning(false);
        }, 500);
    };

    return (
        <div className="system-container" style={{ width: '100%', height: '100vh', background: '#000' }}>
            {/* Back Button */}
            <button
                className="back-button"
                onClick={handleBack}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 1000,
                    padding: '10px 20px',
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    WebkitBackdropFilter: 'blur(10px)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = system.color}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            >
                <span>←</span> BACK TO CORE
            </button>

            {/* Loading Indicator */}
            {loading && (
                <div className="loading-container">
                    <div className="loading-spinner" style={{ borderTopColor: system.color }}></div>
                    <div className="loading-text">Initializing {system.name}...</div>
                </div>
            )}

            {/* System Iframe */}
            <iframe
                src={baseUrl}
                className="system-iframe"
                title={system.name}
                allow="camera; microphone; geolocation; accelerometer; gyroscope"
                onLoad={() => setLoading(false)}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    opacity: loading ? 0 : 1,
                    transition: 'opacity 0.5s ease',
                }}
            />
        </div>
    );
};
