import { useState } from 'react'

export default function AgentSwarm({ rbacRole }) {
  const [prompt, setPrompt] = useState('Find repeat house break-in offenders in Bengaluru South sharing Adv. R. Sharma with Syndicate #04 in the last 6 months.')
  const [trace, setTrace] = useState([])
  const [status, setStatus] = useState('IDLE')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleExecute = async () => {
    setIsProcessing(true)
    setStatus('SWARM REASONING IN PROGRESS...')
    setTrace([])
    
    try {
      const resp = await fetch('http://localhost:8000/api/v2/swarm/query', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'KSP-DATATHON-2026'
        },
        body: JSON.stringify({ prompt, rbacRole: 'Chief_Intel_Officer' })
      })
      
      if (resp.ok) {
        const responseJson = await resp.json()
        const data = responseJson.data // Unpack the StandardResponse wrapper
        
        let stepDelay = 200
        data.reasoningTrace.forEach((step, idx) => {
          setTimeout(() => {
            const time = new Date().toTimeString().split(' ')[0]
            const tag = step.agent.includes('SQL') ? 'tag-sql' : step.agent.includes('Graph') || step.agent.includes('Louvain') ? 'tag-graph' : step.agent.includes('Verify') ? 'tag-verify' : 'tag-agent'
            
            setTrace(prev => [...prev, { time, tag, msg: `[${step.agent.toUpperCase()}] ${step.action}` }])
            
            if (idx === data.reasoningTrace.length - 1) {
              setStatus(`SWARM EXECUTION DONE (${data.groundingScore} CONFIDENCE)`)
              setIsProcessing(false)
            }
          }, stepDelay)
          stepDelay += 600
        })
      }
    } catch (err) {
      console.error(err)
      // Fallback
      setTimeout(() => {
        setStatus("SWARM EXECUTION DONE (CLIENT SIMULATION)")
        setIsProcessing(false)
      }, 2000)
    }
  }

  return (
    <div className="glass-panel animate-fade-in group max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">15-Agent Swarm Intelligence</h2>
          <p className="text-sm text-text-muted mt-1">Multi-model RAG orchestrating PostGIS + Neo4j</p>
        </div>
        <span className={status.includes('DONE') ? "inline-flex items-center gap-1.5 bg-accent-emerald/10 text-accent-emerald px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider border border-accent-emerald/20 uppercase" : status.includes('PROGRESS') ? "inline-flex items-center gap-1.5 bg-accent-amber/10 text-accent-amber px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider border border-accent-amber/20 uppercase animate-pulse" : "inline-flex items-center gap-1.5 bg-accent-slate/10 text-accent-slate px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider border border-accent-slate/20 uppercase"}>
          {status.includes('PROGRESS') && <span className="w-1.5 h-1.5 rounded-full bg-accent-amber"></span>}
          {status.includes('DONE') && <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald"></span>}
          {status}
        </span>
      </div>
      
      <div className="mb-6 space-y-2">
        <label className="block text-[13px] font-semibold text-text-secondary">Natural Language Query <span className="font-mono text-[10px] text-text-muted ml-1">(Investigating Officer Input)</span></label>
        <textarea 
          className="glass-input h-28 resize-none focus:shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
      </div>
      
      <button 
        onClick={handleExecute} 
        disabled={isProcessing}
        className={`btn-primary mb-8 max-w-sm ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Orchestrating Agents...
          </span>
        ) : (
          "🚀 Trigger 15-Agent Swarm Reasoning"
        )}
      </button>

      <div className="terminal h-[360px] custom-scrollbar">
        <div className="absolute top-0 right-0 p-3 flex gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
          <div className="w-2.5 h-2.5 rounded-full bg-border-strong cursor-pointer hover:bg-text-primary"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-border-strong cursor-pointer hover:bg-text-primary"></div>
        </div>
        <div className="text-gray-500 mb-4 pb-2 border-b border-white/5 uppercase tracking-widest text-[10px]">LangGraph Orchestrator Execution Log</div>
        {trace.map((l, i) => (
          <div key={i} className="mb-2 hover:bg-white/5 p-1 -mx-1 rounded transition-colors duration-200">
            <span className="terminal-time opacity-70">[{l.time}]</span>
            <span className={`${l.tag} ml-1`}>{l.msg}</span>
          </div>
        ))}
        {trace.length === 0 && !isProcessing && (
          <div className="flex flex-col items-center justify-center h-full text-text-muted/50 space-y-3">
            <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            <span className="text-sm tracking-widest uppercase">Awaiting Query...</span>
          </div>
        )}
      </div>
    </div>
  )
}
