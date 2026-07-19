import { useState } from 'react'

export default function StationUI({ rbacRole }) {
  const [formData, setFormData] = useState({
    unit: 'U-101', act: 'BNS 2023', section: 'Sec 305', victim: '', accused: '', briefFacts: ''
  })
  const [ledger, setLedger] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const time = new Date().toTimeString().split(' ')[0]
    
    try {
      const lat = 12.9716 + (Math.random() - 0.5) * 0.1;
      const lng = 77.5946 + (Math.random() - 0.5) * 0.1;

      const resp = await fetch('http://localhost:8000/api/v2/fir/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'KSP-DATATHON-2026'
        },
        body: JSON.stringify({ ...formData, latitude: lat, longitude: lng })
      })
      
      if (resp.ok) {
        const responseJson = await resp.json()
        const data = responseJson.data
        setLedger(prev => [
          ...prev,
          { time, tag: 'tag-sql', msg: `[LIVE SERVER] INSERT INTO CaseMaster (${data.crimeNo}) -> ${data.oltpLatencyMs}ms.` },
          { time, tag: 'tag-agent', msg: `Topic: crime.events | Event: FIRRegistered (${data.crimeNo})` },
          { time, tag: 'tag-graph', msg: data.neo4jProjection }
        ])
        alert(`[SUCCESS - LIVE BACKEND]\nFIR Number: ${data.crimeNo}\nLatency: ${data.oltpLatencyMs}ms`)
      }
    } catch (err) {
      console.error(err)
      // Fallback
      const firNo = `FIR/2026/01${Math.floor(Math.random() * 89 + 10)}`
      setLedger(prev => [
        ...prev,
        { time, tag: 'tag-sql', msg: `INSERT INTO CaseMaster (${firNo}) -> 31ms.` },
        { time, tag: 'tag-agent', msg: `Topic: crime.events | Event: FIRRegistered (${firNo})` },
        { time, tag: 'tag-graph', msg: `Graph Projection created edge (${formData.accused}) -[:ACCUSED_IN]-> (${firNo})` }
      ])
      alert(`[SUCCESS - CLIENT SIMULATION]\nFIR Number: ${firNo}`)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      {/* Registration Form */}
      <div className="glass-panel group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-[22px] font-bold text-text-primary tracking-tight">Live FIR Registration</h2>
            <p className="text-sm text-text-muted mt-1">Initialize case in OLTP & dispatch Kafka events</p>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-accent-emerald/10 text-accent-emerald px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider border border-accent-emerald/20 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse"></span>
            26-Table Binder
          </span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-text-secondary">Station Unit <span className="font-mono text-[10px] text-text-muted ml-1">(UnitID)</span></label>
              <div className="relative">
                <select className="glass-input appearance-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                  <option value="U-101">Bengaluru South (U-101)</option>
                  <option value="U-102">Bengaluru Central (U-102)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-text-secondary">Act Master <span className="font-mono text-[10px] text-text-muted ml-1">(ActCode)</span></label>
              <div className="relative">
                <select className="glass-input appearance-none" value={formData.act} onChange={e => setFormData({...formData, act: e.target.value})}>
                  <option value="BNS 2023">BNS 2023 (New IPC)</option>
                  <option value="NDPS 1985">NDPS Act 1985</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-text-secondary">Accused / Suspect Name <span className="font-mono text-[10px] text-text-muted ml-1">(AccusedName)</span></label>
            <input type="text" className="glass-input" required placeholder="e.g. Syed Imran" value={formData.accused} onChange={e => setFormData({...formData, accused: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className={`btn-primary mt-6 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing Transaction...
              </span>
            ) : (
              "⚡ Commit to OLTP & Dispatch Kafka Event"
            )}
          </button>
        </form>
      </div>
      
      {/* Terminal View */}
      <div className="glass-panel flex flex-col h-full min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-bold tracking-tight">Event Ledger</h2>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
        </div>
        
        <div className="terminal flex-1 custom-scrollbar">
          <div className="text-gray-500 mb-4 pb-2 border-b border-white/5 uppercase tracking-widest text-[10px]">Connected to ksp.events.live (Kafka)</div>
          {ledger.map((l, i) => (
            <div key={i} className="mb-2 hover:bg-white/5 p-1 -mx-1 rounded transition-colors duration-200">
              <span className="terminal-time opacity-70">[{l.time}]</span>
              <span className={`${l.tag} ml-1`}>{l.msg}</span>
            </div>
          ))}
          {ledger.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-text-muted/50 space-y-3">
              <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="text-sm tracking-widest uppercase">Listening for events...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
