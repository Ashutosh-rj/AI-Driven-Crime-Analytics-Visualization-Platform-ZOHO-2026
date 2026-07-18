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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, rbacRole })
      })
      
      if (resp.ok) {
        const data = await resp.json()
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
    <div className="glass-panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">15-Agent Swarm Intelligence</h2>
        <span className={status.includes('DONE') ? "bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold" : status.includes('PROGRESS') ? "bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse" : "bg-slate-500/20 text-slate-400 px-3 py-1 rounded-full text-xs font-bold"}>
          {status}
        </span>
      </div>
      
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-400 mb-1">Natural Language Query (Investigating Officer Input)</label>
        <textarea 
          className="glass-input h-24 resize-none" 
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
      </div>
      
      <button 
        onClick={handleExecute} 
        disabled={isProcessing}
        className={`btn-primary mb-6 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        🚀 Trigger 15-Agent Swarm Reasoning
      </button>

      <div className="terminal h-80">
        {trace.map((l, i) => (
          <div key={i} className="mb-1">
            <span className="terminal-time">[{l.time}]</span>
            <span className={l.tag}>{l.msg}</span>
          </div>
        ))}
        {trace.length === 0 && !isProcessing && <div className="text-slate-500 italic">Awaiting Swarm activation...</div>}
      </div>
    </div>
  )
}
