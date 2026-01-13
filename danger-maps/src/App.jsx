import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { AlertTriangle, Shield, MapPin, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const SAFETY_ZONES = [
  { id: 1, lat: 40.7128, lng: -74.0060, radius: 500 }, // City Hall
  { id: 2, lat: 40.7580, lng: -73.9855, radius: 800 }, // Times Square
];

function App() {
  const [incidents, setIncidents] = useState([]);
  const [activeIncident, setActiveIncident] = useState(null);

  useEffect(() => {
    // Initial Load
    const initialData = Array.from({ length: 5 }).map(() => generateIncident());
    setIncidents(initialData);

    // Live Feed
    const interval = setInterval(() => {
      const newIncident = generateIncident();
      setIncidents(prev => [newIncident, ...prev].slice(0, 50));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const generateIncident = () => {
    // Generate random point near NYC
    const baseLat = 40.7128;
    const baseLng = -74.0060;
    const lat = baseLat + (Math.random() - 0.5) * 0.1;
    const lng = baseLng + (Math.random() - 0.5) * 0.1;

    const types = ['Theft', 'Assault', 'Vandalism', 'Public Disturbance', 'Suspicious Activity'];
    const priorities = ['high', 'medium', 'low', 'medium', 'low'];
    const idx = Math.floor(Math.random() * types.length);

    return {
      id: Date.now() + Math.random(),
      type: types[idx],
      priority: priorities[idx],
      lat,
      lng,
      time: new Date().toLocaleTimeString()
    };
  };

  const getMarkerColor = (priority) => {
    if (priority === 'high') return '#ff0000';
    if (priority === 'medium') return '#ff8800';
    return '#00ff00';
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand">
          <h1>DANGER MAPS</h1>
        </div>
        <div style={{ color: '#ff4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          <AlertTriangle size={20} /> THREAT LEVEL: ELEVATED
        </div>
      </header>

      <div className="map-wrapper">
        <MapContainer center={[40.7128, -74.0060]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Safety Zones (Green Circles) */}
          {SAFETY_ZONES.map(zone => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{ color: '#00ff88', fillColor: '#00ff88', fillOpacity: 0.1 }}
            />
          ))}

          {/* Incident Markers */}
          {incidents.map(inc => (
            <Circle
              key={inc.id}
              center={[inc.lat, inc.lng]}
              radius={inc.priority === 'high' ? 200 : 100}
              pathOptions={{
                color: getMarkerColor(inc.priority),
                fillColor: getMarkerColor(inc.priority),
                fillOpacity: 0.5,
                stroke: false
              }}
              eventHandlers={{
                click: () => setActiveIncident(inc)
              }}
            >
              <Popup>
                <strong>{inc.type}</strong><br />
                Priority: {inc.priority.toUpperCase()}<br />
                Time: {inc.time}
              </Popup>
            </Circle>
          ))}
        </MapContainer>

        <div className="overlay-panel">
          <div className="panel-header">
            <span>Recent Reports</span>
            <Search size={16} />
          </div>
          <div className="incident-list">
            {incidents.slice(0, 10).map(inc => (
              <div key={inc.id} className={`incident-card ${inc.priority}`} onClick={() => setActiveIncident(inc)}>
                <div className="incident-title">
                  {inc.type}
                  <AlertTriangle size={14} color={getMarkerColor(inc.priority)} />
                </div>
                <div className="incident-time">{inc.time} • near [Lat: {inc.lat.toFixed(3)}]</div>
              </div>
            ))}
          </div>
        </div>

        <div className="legend">
          <div className="legend-item"><div style={{ width: 10, height: 10, background: '#ff0000', borderRadius: '50%' }}></div> High Priority</div>
          <div className="legend-item"><div style={{ width: 10, height: 10, background: '#ff8800', borderRadius: '50%' }}></div> Medium Priority</div>
          <div className="legend-item"><div style={{ width: 10, height: 10, background: '#00ff00', borderRadius: '50%' }}></div> Low Priority</div>
          <div className="legend-item"><div style={{ width: 10, height: 10, border: '1px solid #00ff88', borderRadius: '50%' }}></div> Safe Zone</div>
        </div>
      </div>
    </div>
  );
}

export default App;
