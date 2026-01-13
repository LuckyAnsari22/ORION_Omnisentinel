import { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';
import { Shield, Server, Activity, Users, Globe } from 'lucide-react';
import { scaleLinear } from 'd3-scale';
import './App.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function App() {
  const [nodes, setNodes] = useState([]);
  const [learningProgress, setLearningProgress] = useState(0);
  const [threatsBlocked, setThreatsBlocked] = useState(0);
  const [activeRegion, setActiveRegion] = useState("Global Monitoring");
  const [logs, setLogs] = useState([]);

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      // Add a random node occasionally
      if (Math.random() > 0.3) {
        const newNode = {
          id: Date.now(),
          coordinates: [
            (Math.random() * 360) - 180, // Long
            (Math.random() * 160) - 80   // Lat
          ],
          type: Math.random() > 0.9 ? 'threat' : 'node',
          value: Math.floor(Math.random() * 100)
        };

        setNodes(prev => [...prev.slice(-100), newNode]); // Keep last 100

        if (newNode.type === 'threat') {
          setThreatsBlocked(prev => prev + 1);
          addLog(`⚠️ Threat neutralized at [${newNode.coordinates[0].toFixed(1)}, ${newNode.coordinates[1].toFixed(1)}]`);
        } else {
          addLog(`⚡ New node joined swarm: ID-${newNode.id.toString().substring(8)}`);
        }

        setLearningProgress(prev => Math.min(prev + 0.5, 100));
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const threatScale = scaleLinear()
    .domain([0, 100])
    .range([5, 20]);

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <h1>SWARM INTELLIGENCE</h1>
          <div className="subtitle">FEDERATED THREAT LEARNING SYSTEM</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#ffcc00' }}>
          <Globe size={20} /> GLOBAL GRID ONLINE
        </div>
      </header>

      <main className="dashboard">
        <aside className="sidebar">
          <div className="metric-box">
            <div className="metric-label"><Server size={14} style={{ marginRight: '5px' }} /> Active Nodes</div>
            <div className="metric-value">{1420 + nodes.length}</div>
          </div>

          <div className="metric-box">
            <div className="metric-label"><Shield size={14} style={{ marginRight: '5px' }} /> Threats Blocked</div>
            <div className="metric-value">{8500 + threatsBlocked}</div>
          </div>

          <div className="metric-box">
            <div className="metric-label"><Activity size={14} style={{ marginRight: '5px' }} /> Neural Aggregation</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${learningProgress}%` }}></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', marginTop: '4px', color: '#ffcc00' }}>
              v4.2 Model: {Math.round(learningProgress)}%
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#ffcc00', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>LIVE FEED</h3>
            <div className="feed-list">
              {logs.map((log, i) => (
                <div key={i} className="feed-item" style={{ color: log.includes('⚠️') ? '#ff4444' : '#fff' }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="map-container">
          <ComposableMap projection="geoMercator" projectionConfig={{ scale: 140 }}>
            <ZoomableGroup zoom={1}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#1a1a1a"
                      stroke="#333"
                      strokeWidth={0.5}
                      style={{
                        default: { fill: "#1a1a1a", outline: "none" },
                        hover: { fill: "#2a2a2a", outline: "none" },
                        pressed: { fill: "#111", outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Render Lines to Center (Simulating Federation) */}
              {nodes.map(node => (
                <Marker key={node.id} coordinates={node.coordinates}>
                  <circle
                    r={node.type === 'threat' ? 8 : 2}
                    fill={node.type === 'threat' ? "rgba(255, 50, 50, 0.8)" : "#ffcc00"}
                    stroke="#fff"
                    strokeWidth={0.5}
                  />
                  {node.type === 'threat' && (
                    <circle r={12} fill="none" stroke="red" strokeWidth={1} style={{ opacity: 0.5 }}>
                      <animate attributeName="r" from="8" to="20" dur="1s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="1s" repeatCount="indefinite" />
                    </circle>
                  )}
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>

          <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', color: '#555', fontSize: '0.8rem' }}>
            <Users size={14} style={{ verticalAlign: '-2px' }} /> 24.5k peers contributing
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
