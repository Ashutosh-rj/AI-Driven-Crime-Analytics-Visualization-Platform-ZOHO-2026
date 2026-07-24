import { useState, useEffect } from 'react'

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-[9999] bg-surface border border-accent-emerald/40 text-text-primary rounded-2xl shadow-2xl shadow-black/20 px-6 py-4 max-w-sm animate-slide-up">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-accent-emerald/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-accent-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </span>
        <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono">{message}</pre>
        <button onClick={onClose} className="ml-2 text-text-muted hover:text-text-primary transition-colors flex-shrink-0" aria-label="Dismiss">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}

export default function StationUI({ rbacRole }) {
  const [formData, setFormData] = useState({
    unit: 'U-101', act: 'BNS 2023', section: 'Sec 305', victim: '', accused: '', briefFacts: ''
  })
  const [ledger, setLedger] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const time = new Date().toTimeString().split(' ')[0]
    
    try {
      const lat = 12.9716 + (Math.random() - 0.5) * 0.1;
      const lng = 77.5946 + (Math.random() - 0.5) * 0.1;

      const payload = {
        unit: formData.unit,
        act: formData.act,
        section: formData.section,
        accused: formData.accused || 'Unknown Accused',
        latitude: lat,
        longitude: lng
      }
      
      if (formData.victim) payload.victim = formData.victim;
      if (formData.briefFacts) payload.briefFacts = formData.briefFacts;

      const resp = await fetch('http://localhost:8000/api/v2/fir/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy_token_dev_fallback'
        },
        body: JSON.stringify(payload)
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
        setToast(`✅ SUCCESS — LIVE BACKEND\nFIR Number: ${data.crimeNo}\nLatency: ${data.oltpLatencyMs}ms`)
      }
    } catch (err) {
      console.error(err)
      setLedger(prev => [
        ...prev,
        { time, tag: 'tag-sql', msg: `[ERROR] Failed to connect to OLTP backend.` }
      ])
      setToast(`❌ ERROR — Registration Failed\nCould not connect to backend.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
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
              <label htmlFor="stationUnit" className="block text-[13px] font-semibold text-text-secondary">Station Unit <span className="font-mono text-[10px] text-text-muted ml-1">(UnitID)</span></label>
              <div className="relative">
                <select id="stationUnit" className="glass-input appearance-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                  <option className="bg-surface text-text-primary" value="U-101">Bengaluru South (U-101)</option>
                  <option className="bg-surface text-text-primary" value="U-102">Bengaluru Central (U-102)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="actMaster" className="block text-[13px] font-semibold text-text-secondary">Act Master <span className="font-mono text-[10px] text-text-muted ml-1">(ActCode)</span></label>
              <div className="relative">
                <select id="actMaster" className="glass-input appearance-none" value={formData.act} onChange={e => setFormData({...formData, act: e.target.value})}>
                  <option className="bg-surface text-text-primary" value="BNS 2023">BNS 2023 (New IPC)</option>
                  <option className="bg-surface text-text-primary" value="NDPS 1985">NDPS Act 1985</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="victimName" className="block text-[13px] font-semibold text-text-secondary">Victim / Complainant Name <span className="font-mono text-[10px] text-text-muted ml-1">(VictimName)</span></label>
            <input id="victimName" type="text" className="glass-input" placeholder="e.g. Rajesh Kumar" value={formData.victim} onChange={e => setFormData({...formData, victim: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label htmlFor="accusedName" className="block text-[13px] font-semibold text-text-secondary">Accused / Suspect Name <span className="font-mono text-[10px] text-text-muted ml-1">(AccusedName)</span></label>
            <input id="accusedName" type="text" className="glass-input" required placeholder="e.g. Syed Imran" value={formData.accused} onChange={e => setFormData({...formData, accused: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label htmlFor="briefFacts" className="block text-[13px] font-semibold text-text-secondary">Brief Facts <span className="font-mono text-[10px] text-text-muted ml-1">(BriefFacts)</span></label>
            <textarea id="briefFacts" rows={3} className="glass-input resize-none" placeholder="Describe the incident in brief..." value={formData.briefFacts} onChange={e => setFormData({...formData, briefFacts: e.target.value})} />
          </div>
          <button type="submit" aria-busy={loading} disabled={loading} className={`btn-primary mt-6 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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
    </>
  )
}
