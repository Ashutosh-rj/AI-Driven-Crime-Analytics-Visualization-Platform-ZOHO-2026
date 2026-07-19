import { useState, useEffect } from 'react'
import { Shield, Map as MapIcon, Users, FileText, Activity, Sun, Moon } from 'lucide-react'
import LandingPage from './components/LandingPage'
import StationUI from './components/StationUI'
import AgentSwarm from './components/AgentSwarm'
import GisMap from './components/GisMap'
import Dashboard from './components/Dashboard'

function App() {
  const [viewMode, setViewMode] = useState('landing') // 'landing' or 'app'
  const [activeTab, setActiveTab] = useState('station')
  const [rbacRole, setRbacRole] = useState('P09')
  const [stats, setStats] = useState(null)
  const [liveEvents, setLiveEvents] = useState([])
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return true
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.theme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.theme = 'light'
    }
  }, [isDark])

  useEffect(() => {
    // Fetch initial stats from FastAPI backend
    fetch('http://localhost:8000/api/v2/stats')
      .then(res => res.json())
      .then(json => setStats(json.data.metrics))
      .catch(err => console.error("Backend not running or CORS issue:", err))
      
    let ws = null;
    let reconnectTimeout = null;
    let backoff = 1000;

    const connectWS = () => {
      // Connect to live WebSocket for Kafka events with token
      ws = new WebSocket('ws://localhost:8000/api/v2/ws/events?token=dummy_token_dev_fallback')
      
      ws.onopen = () => {
        console.log("WebSocket connected.");
        backoff = 1000; // Reset backoff on successful connection
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log("Live Event Received:", data)
        setLiveEvents(prev => [data, ...prev].slice(0, 10)) // Keep last 10
        // Also trigger a stats refresh
        fetch('http://localhost:8000/api/v2/stats')
          .then(res => res.json())
          .then(json => setStats(json.data.metrics))
          .catch(err => console.error(err))
      }
      
      ws.onclose = () => {
        console.log(`WebSocket closed. Reconnecting in ${backoff}ms...`);
        reconnectTimeout = setTimeout(connectWS, backoff);
        backoff = Math.min(backoff * 2, 30000); // Exponential backoff up to 30s
      }
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      }
    };
    
    connectWS();
    
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    }
  }, [])

  const toggleTheme = () => setIsDark(!isDark)

  if (viewMode === 'landing') {
    return <LandingPage onLaunch={() => setViewMode('app')} isDark={isDark} toggleTheme={toggleTheme} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary transition-colors duration-300 ease-in-out font-sans">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent-emerald/10 blur-[120px] rounded-full mix-blend-screen opacity-50 dark:opacity-20 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent-blue/10 blur-[100px] rounded-full mix-blend-screen opacity-50 dark:opacity-20 animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 transition-colors duration-300 ease-in-out bg-card/60 backdrop-blur-2xl border-b border-border-subtle shadow-sm">
        <div className="container mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent-emerald to-emerald-600 shadow-md transform group-hover:scale-105 transition-transform duration-300">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold tracking-tight text-text-primary">KSP AI <span className="text-text-muted font-normal text-[14px] ml-1">Enterprise Intelligence</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 bg-surface/50 p-1.5 pl-3 rounded-xl border border-border-subtle transition-colors duration-200 hover:border-border-strong">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-emerald shadow-[0_0_8px_var(--color-accent-emerald)]"></span>
              </div>
              <select 
                className="bg-transparent border-none text-[13px] font-semibold text-text-primary focus:ring-0 cursor-pointer pr-3 outline-none appearance-none"
                value={rbacRole}
                onChange={(e) => setRbacRole(e.target.value)}
              >
                <option value="P09">DGP Karnataka (ROOT TIER 0)</option>
                <option value="P03">District SP (TIER 2)</option>
                <option value="P02">SHO Inspector (TIER 3)</option>
                <option value="P01">Beat Constable (TIER 4)</option>
              </select>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-surface/50 hover:bg-surface text-text-secondary hover:text-text-primary transition-all duration-200 border border-border-subtle hover:border-border-strong hover:shadow-sm"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="container mx-auto px-6 flex gap-2 overflow-x-auto hide-scrollbar pt-2">
          <TabButton active={activeTab === 'station'} onClick={() => setActiveTab('station')} icon={<FileText size={16}/>} label="SHO Station" />
          <TabButton active={activeTab === 'swarm'} onClick={() => setActiveTab('swarm')} icon={<Activity size={16}/>} label="Agent Swarm" />
          <TabButton active={activeTab === 'gis'} onClick={() => setActiveTab('gis')} icon={<MapIcon size={16}/>} label="Command GIS" />
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Users size={16}/>} label="Executive BI" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto p-6 md:p-8 lg:p-10 z-10 animate-fade-in relative">
        {activeTab === 'station' && <StationUI rbacRole={rbacRole} liveEvents={liveEvents} />}
        {activeTab === 'swarm' && <AgentSwarm rbacRole={rbacRole} />}
        {activeTab === 'gis' && <GisMap liveEvents={liveEvents} />}
        {activeTab === 'dashboard' && <Dashboard stats={stats} liveEvents={liveEvents} />}
      </main>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-3 flex items-center gap-2 text-[14px] font-semibold transition-all duration-300 rounded-t-xl relative overflow-hidden group ${
        active 
          ? 'text-accent-charcoal dark:text-accent-emerald' 
          : 'text-text-muted hover:text-text-primary hover:bg-surface/30'
      }`}
    >
      <span className="relative z-10 flex items-center gap-2">{icon} {label}</span>
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent-charcoal dark:bg-accent-emerald rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.3)] animate-slide-up"></div>
      )}
    </button>
  )
}

export default App
