import { Scene } from '../components/Scene';
import { useAppStore } from '../store/appStore';
import { VoiceCommand } from '../components/VoiceCommand';

export const Landing = () => {
    const { isTransitioning, activeAppUrl } = useAppStore(); // activeAppUrl kept for header styling logic if needed, or remove if header doesn't use it.
    // The previous code used activeAppUrl logic for header color.
    // I should check if I broke the header color logic.
    // Let's keep activeAppUrl but remove setActiveAppUrl.

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden', background: '#00050a' }}>

            {/* Cinematic 3D Environment */}
            <div className="canvas-container" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <Scene />
            </div>

            {/* Designer UI Overlay */}
            <div className="ui-overlay" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '4rem',
                zIndex: 10
            }}>
                {/* Header: Minimal & Futuristic */}
                <header style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    animation: 'fadeInDown 1.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <h1 style={{
                        fontSize: '4.5rem',
                        fontWeight: 900,
                        margin: 0,
                        letterSpacing: '-0.04em',
                        fontFamily: 'Inter, sans-serif',
                        textTransform: 'uppercase',
                        color: '#fff',
                        textShadow: '0 0 30px rgba(0,255,255,0.4)'
                    }}>
                        ORION NEXUS
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: activeAppUrl ? 0 : 1, transition: 'opacity 0.5s' }}>
                        <div style={{ height: '1px', width: '40px', background: 'var(--color-core)' }} />
                        <span style={{
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4em',
                            color: 'var(--color-core)',
                            fontWeight: 300
                        }}>
                            ORION NEXUS PLATFORM
                        </span>
                    </div>
                </header>

                {/* Footer */}
                <footer style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    opacity: activeAppUrl ? 0 : 1, // Hide when app open
                    transition: 'opacity 0.5s'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                            LATENCY: 12MS // SYSTEMS: 10/10 ACTIVE
                        </div>
                        <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                            Neural Modules Synchronized
                        </div>
                    </div>
                    <VoiceCommand />
                </footer>
            </div>

            {/* Cinematic Fade Transition */}
            <div
                className={`fade-overlay ${isTransitioning ? 'active' : ''}`}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: '#000',
                    opacity: isTransitioning ? 1 : 0,
                    transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: 'none',
                    zIndex: 100
                }}
            />

            {/* CSS ANIMATIONS */}
            <style>{`
                @keyframes fadeInDown {
                    from { transform: translateY(-30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes zoomIn {
                    from { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
                    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
