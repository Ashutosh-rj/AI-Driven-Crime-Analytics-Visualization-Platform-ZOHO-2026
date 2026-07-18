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
  html: `<div style="background:#3b82f6; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #3b82f6;"></div>`,
  iconSize: [14, 14]
})

export default function GisMap() {
  const [hotspots, setHotspots] = useState([])

  useEffect(() => {
    fetch('http://localhost:8000/api/v2/gis/hotspots')
      .then(res => res.json())
      .then(data => setHotspots(data.features))
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="glass-panel p-1">
      <div className="p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Command GIS & Spatiotemporal Heatmap</h2>
          <p className="text-sm text-slate-400 mt-1">Live ConvLSTM Hotspot Risk Buffers & OR-Tools Patrol Optimization</p>
        </div>
      </div>
      
      <div className="h-[600px] w-full rounded-b-xl overflow-hidden border-t border-slate-700">
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
            const color = spot.type === 'Hotspot' ? '#f43f5e' : spot.type === 'SyndicateCluster' ? '#8b5cf6' : '#06b6d4'
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
        </MapContainer>
      </div>
    </div>
  )
}
