import { Scene } from '../components/Scene';
import { useAppStore } from '../store/appStore';
import { VoiceCommand } from '../components/VoiceCommand';

export const Landing = () => {
    const { isTransitioning } = useAppStore();

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden', background: '#00050a' }}>

            {/* Cinematic 3D Environment */}
            <div className="canvas-container">
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
                        OMNISENTINEL
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ height: '1px', width: '40px', background: 'var(--color-core)' }} />
                        <span style={{
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4em',
                            color: 'var(--color-core)',
                            fontWeight: 300
                        }}>
                            Created by Team Outliers
                        </span>
                    </div>
                </header>

                {/* Content: The Judge Talking Point */}
                <div className="talking-point">
                    <p style={{
                        fontSize: '1.2rem',
                        color: 'rgba(255,255,255,0.7)',
                        lineHeight: '1.6',
                        maxWidth: '500px',
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        “OmniSentinel is the peak of visual intelligence.
                        A neural environment crafted by Team Outliers where safety meets cinematic motion.”
                    </p>
                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', pointerEvents: 'auto' }}>
                        <button
                            onClick={() => window.location.href = '/guardian'}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                padding: '10px 24px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                letterSpacing: '0.1em',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-guardian)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                        >
                            INITIATE GUARDIAN
                        </button>
                        <button
                            onClick={() => window.location.href = '/visualky'}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                padding: '10px 24px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                letterSpacing: '0.1em',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-visualky)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                        >
                            INITIATE VISUALKY
                        </button>
                    </div>
                </div>

                {/* Footer: Tech Status & Voice */}
                <footer style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
                            LATENCY: 12MS // UPTIME: 99.9%
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
                @keyframes fadeInUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
