import React from 'react';

const PredictionTimeline = ({ prediction }) => {
    if (!prediction) return null;

    const { probability, riskLevel, timeToFall, factors } = prediction;

    const getRiskColor = () => {
        switch (riskLevel) {
            case 'safe':
                return '#44FF88';
            case 'warning':
                return '#FFAA00';
            case 'alert':
                return '#FF6600';
            case 'critical':
                return '#FF4444';
            default:
                return '#44FF88';
        }
    };

    const getRiskLabel = () => {
        switch (riskLevel) {
            case 'safe':
                return 'STABLE';
            case 'warning':
                return 'CAUTION';
            case 'alert':
                return 'WARNING';
            case 'critical':
                return 'CRITICAL';
            default:
                return 'STABLE';
        }
    };

    return (
        <div className="glass-panel p-6 rounded-xl border border-white/5">
            <h3 className="text-base font-bold text-slate-400 uppercase tracking-widest mb-4">
                Fall Prediction
            </h3>

            {/* Risk Level Indicator */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div
                        className="text-3xl font-display font-bold"
                        style={{ color: getRiskColor() }}
                    >
                        {getRiskLabel()}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                        {probability.toFixed(1)}% fall probability
                    </div>
                </div>

                {/* Countdown Timer */}
                {riskLevel !== 'safe' && (
                    <div className="text-right">
                        <div className="text-4xl font-mono font-bold" style={{ color: getRiskColor() }}>
                            {timeToFall}s
                        </div>
                        <div className="text-xs text-slate-500 uppercase">
                            Predicted Time
                        </div>
                    </div>
                )}
            </div>

            {/* Probability Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>0%</span>
                    <span>100%</span>
                </div>
                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{
                            width: `${probability}%`,
                            background: `linear-gradient(90deg, ${getRiskColor()}80, ${getRiskColor()})`,
                            boxShadow: `0 0 20px ${getRiskColor()}60`,
                        }}
                    />
                    {/* Threshold markers */}
                    <div className="absolute top-0 left-[40%] w-0.5 h-full bg-white/20" />
                    <div className="absolute top-0 left-[60%] w-0.5 h-full bg-white/30" />
                    <div className="absolute top-0 left-[80%] w-0.5 h-full bg-white/40" />
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                    <span>Safe</span>
                    <span>Warning</span>
                    <span>Alert</span>
                    <span>Critical</span>
                </div>
            </div>

            {/* Risk Factors */}
            {factors.length > 0 && (
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">
                        Risk Factors Detected:
                    </div>
                    <div className="space-y-1">
                        {factors.map((factor, index) => (
                            <div
                                key={index}
                                className="text-sm flex items-center gap-2 text-slate-300"
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: getRiskColor() }}
                                />
                                {factor}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pulsing animation for critical state */}
            {riskLevel === 'critical' && (
                <style>{`
          @keyframes pulse-critical {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .glass-panel {
            animation: pulse-critical 1s ease-in-out infinite;
          }
        `}</style>
            )}
        </div>
    );
};

export default PredictionTimeline;
