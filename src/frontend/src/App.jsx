import { useState, useEffect } from 'react'
import { Shield, Map as MapIcon, Users, FileText, Activity } from 'lucide-react'
import StationUI from './components/StationUI'
import AgentSwarm from './components/AgentSwarm'
import GisMap from './components/GisMap'
import Dashboard from './components/Dashboard'

function App() {
  const [activeTab, setActiveTab] = useState('station')
  const [rbacRole, setRbacRole] = useState('P09')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    // Fetch stats from FastAPI backend
    fetch('http://localhost:8000/api/v2/stats')
      .then(res => res.json())
      .then(data => setStats(data.metrics))
      .catch(err => console.error("Backend not running or CORS issue:", err))
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-darkBg text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0B0E14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-accentCyan" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">KSP AI <span className="text-slate-500 font-normal text-sm">| Enterprise Intelligence OS (NCIOS v2.5)</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
            <div className="w-3 h-3 rounded-full bg-accentEmerald shadow-[0_0_12px_#10B981] animate-pulse"></div>
            <select 
              className="bg-transparent border-none text-sm font-semibold text-slate-300 focus:ring-0 cursor-pointer"
              value={rbacRole}
              onChange={(e) => setRbacRole(e.target.value)}
            >
              <option value="P09">DGP Karnataka (ROOT TIER 0)</option>
              <option value="P03">District SP (TIER 2)</option>
              <option value="P02">SHO Inspector (TIER 3)</option>
              <option value="P01">Beat Constable (TIER 4)</option>
            </select>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="container mx-auto px-6 flex gap-8">
          <TabButton active={activeTab === 'station'} onClick={() => setActiveTab('station')} icon={<FileText size={18}/>} label="SHO Station UI" />
          <TabButton active={activeTab === 'swarm'} onClick={() => setActiveTab('swarm')} icon={<Activity size={18}/>} label="15-Agent Swarm" />
          <TabButton active={activeTab === 'gis'} onClick={() => setActiveTab('gis')} icon={<MapIcon size={18}/>} label="Command GIS" />
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Users size={18}/>} label="Executive BI" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto p-6">
        {activeTab === 'station' && <StationUI rbacRole={rbacRole} />}
        {activeTab === 'swarm' && <AgentSwarm rbacRole={rbacRole} />}
        {activeTab === 'gis' && <GisMap />}
        {activeTab === 'dashboard' && <Dashboard stats={stats} />}
      </main>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`pb-4 flex items-center gap-2 font-semibold transition-all border-b-2 ${
        active ? 'border-accentCyan text-accentCyan' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
      }`}
    >
      {icon} {label}
    </button>
  )
}

export default App
