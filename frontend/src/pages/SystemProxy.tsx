import { useEffect } from 'react';
import { SYSTEMS } from '../utils/constants';

interface SystemProxyProps {
    systemId: keyof typeof SYSTEMS;
}

export const SystemProxy = ({ systemId }: SystemProxyProps) => {
    const system = SYSTEMS[systemId];

    // Direct URLs for standalone deployments
    const targetUrl = systemId === 'guardian'
        ? 'https://frontend-chi-khaki-51.vercel.app' // Guardian frontend deployment
        : 'https://visualky.vercel.app'; // Visualky deployment

    useEffect(() => {
        // Redirect to the standalone deployment
        window.location.href = targetUrl;
    }, [targetUrl]);

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            color: '#fff',
            fontFamily: 'var(--font-primary)'
        }}>
            <div style={{ marginBottom: '20px', fontSize: '1.5rem' }}>
                Launching {system.name}...
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>
                Redirecting to {targetUrl}
            </div>
        </div>
    );
};
