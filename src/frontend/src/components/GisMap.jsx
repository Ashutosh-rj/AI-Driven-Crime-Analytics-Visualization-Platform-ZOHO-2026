import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const stationIcon = new L.DivIcon({
  className: 'bg-transparent',
  html: `<div style="background:var(--color-accent-emerald, #10B981); width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px var(--color-accent-emerald, #10B981);"></div>`,
  iconSize: [14, 14]
})

export default function GisMap({ liveEvents = [] }) {
  const [hotspots, setHotspots] = useState([])
  const [hotspotStatus, setHotspotStatus] = useState('loading') // 'loading' | 'ok' | 'offline'

  useEffect(() => {
    fetch('http://localhost:8000/api/v2/gis/hotspots')
      .then(res => res.json())
      .then(responseJson => {
        setHotspots(responseJson.data?.features || [])
        setHotspotStatus('ok')
      })
      .catch(err => {
        console.error(err)
        setHotspotStatus('offline')
      })
  }, [])

  const eventIcon = new L.DivIcon({
    className: 'bg-transparent',
    html: `<div style="background:var(--color-accent-amber, #F59E0B); width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 15px var(--color-accent-amber, #F59E0B); animation: pulse 1.5s infinite;"></div>`,
    iconSize: [16, 16]
  })

  return (
    <div className="glass-panel p-1 animate-fade-in flex flex-col h-[700px]">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold text-text-primary tracking-tight">Command GIS & Spatiotemporal Heatmap</h2>
          <p className="text-sm text-text-muted mt-1">DBSCAN Spatial Clustering · PostGIS Hotspot Buffers · Real-Time Kafka Events</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-accent-blue/10 text-accent-blue px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider border border-accent-blue/20 uppercase">
          DBSCAN Spatial Clustering
        </span>
      </div>
      
      <div className="flex-1 w-full rounded-b-2xl overflow-hidden border-t border-border-subtle relative z-0">
        <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Police Stations */}
          <Marker position={[12.9250, 77.5840]} icon={stationIcon}>
            <Popup><b>Bengaluru South - Jayanagar PS</b><br/>Active FIRs: 18</Popup>
          </Marker>
          <Marker position={[12.9716, 77.6100]} icon={stationIcon}>
            <Popup><b>Bengaluru Central - Ashok Nagar PS</b><br/>Active FIRs: 22</Popup>
          </Marker>
          
          {/* Hotspots */}
          {hotspots.map((spot, idx) => {
            const color = spot.type === 'Hotspot' ? '#991B1B' : spot.type === 'SyndicateCluster' ? '#F59E0B' : '#10B981'
            return (
              <Circle 
                key={idx} 
                center={spot.coords} 
                pathOptions={{ color, fillColor: color, fillOpacity: 0.35 }} 
                radius={spot.radiusMeters}
              >
                <Popup>
                  <b>{spot.name}</b><br/>
                  {spot.type === 'Hotspot' && `Risk: ${spot.riskPct}% | ${spot.targetCrime}`}
                  {spot.type === 'SyndicateCluster' && `Modularity: ${spot.modularity} | Nodes: ${spot.activeNodes}`}
                  {spot.type === 'PatrolSector' && `Response Opt: ${spot.responseOptPct}%`}
                </Popup>
              </Circle>
            )
          })}
          
          {/* Live Events Stream */}
          {liveEvents.map((evt, idx) => (
             evt.lat && evt.lng && (
              <Marker key={`evt-${idx}`} position={[evt.lat, evt.lng]} icon={eventIcon}>
                <Popup><b>Live Event: {evt.event_type}</b><br/>Case: {evt.case_no}</Popup>
              </Marker>
             )
          ))}
        </MapContainer>
        {/* Offline overlay — shown only when backend is unreachable */}
        {hotspotStatus === 'offline' && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="bg-surface border border-border-subtle rounded-2xl px-8 py-6 text-center shadow-xl max-w-xs">
              <div className="text-3xl mb-3">🗺️</div>
              <h3 className="font-bold text-text-primary mb-1">Backend Offline</h3>
              <p className="text-sm text-text-secondary">Map tiles are live. Start the backend to load crime hotspot data.</p>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>
    </div>
  )
}
