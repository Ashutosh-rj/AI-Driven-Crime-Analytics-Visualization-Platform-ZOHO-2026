import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { 
  Shield, Activity, Lock, Database, Layers, 
  Map as MapIcon, Cpu, Zap, Globe, Server, 
  ChevronRight, Play, Sun, Moon, CheckCircle2,
  Workflow, Network, LineChart
} from 'lucide-react'

// Reusable Components
const SectionHeading = ({ title, subtitle }) => (
  <div className="max-w-3xl mx-auto text-center mb-16 px-4">
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-text-primary"
    >
      {title}
    </motion.h2>
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ delay: 0.1 }}
        className="text-[17px] md:text-[19px] text-text-secondary leading-relaxed"
      >
        {subtitle}
      </motion.p>
    )}
  </div>
)

const BentoCard = ({ title, description, icon: Icon, children, className = "", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay, duration: 0.5 }}
    className={`bg-surface/40 backdrop-blur-md border border-border-subtle rounded-3xl overflow-hidden hover:border-border-strong transition-all duration-300 group ${className}`}
  >
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-surface border border-border-subtle group-hover:border-accent-emerald/30 group-hover:bg-accent-emerald/5 transition-colors">
          <Icon className="w-6 h-6 text-accent-emerald" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      </div>
      <p className="text-text-secondary leading-relaxed mb-8 flex-1">{description}</p>
      {children}
    </div>
  </motion.div>
)

export default function LandingPage({ onLaunch, isDark, toggleTheme }) {
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.1], [0, 50])

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-accent-emerald/30 font-sans overflow-x-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent-emerald/5 blur-[120px] rounded-full mix-blend-screen opacity-50"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-blue-500/5 blur-[120px] rounded-full mix-blend-screen opacity-50"></div>
      </div>

      {/* Sticky Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border-subtle">
        <div className="container mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent-emerald to-emerald-700 shadow-lg shadow-accent-emerald/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-[18px] font-bold tracking-tight">KSP AI Platform</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-text-secondary">
            <a href="#architecture" className="hover:text-text-primary transition-colors">Architecture</a>
            <a href="#capabilities" className="hover:text-text-primary transition-colors">Capabilities</a>
            <a href="#security" className="hover:text-text-primary transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={onLaunch}
              className="px-5 py-2.5 rounded-xl bg-text-primary text-background text-[14px] font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm"
            >
              Access Platform <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-[72px]">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 overflow-hidden">
          <motion.div 
            style={{ opacity: heroOpacity, y: heroY }}
            className="w-full max-w-5xl mx-auto text-center"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border-subtle mb-8 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-emerald"></span>
              </span>
              <span className="text-[13px] font-medium text-text-secondary">v2.0 Enterprise Release</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-text-primary leading-[1.05] mb-8"
            >
              Enterprise Intelligence.<br className="hidden md:block"/> Real-Time Action.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-2xl text-text-secondary max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              The world's most advanced spatial reasoning and multi-agent AI engine for law enforcement. Built on PostGIS, Neo4j, and Redpanda.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button 
                onClick={onLaunch}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-text-primary text-background text-[16px] font-semibold hover:shadow-xl hover:shadow-text-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Launch Live Demo <Play size={18} fill="currentColor" />
              </button>
              <a 
                href="#architecture"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-surface border border-border-subtle text-text-primary text-[16px] font-medium hover:border-border-strong transition-all flex items-center justify-center"
              >
                Explore Architecture
              </a>
            </motion.div>
          </motion.div>
          
          {/* Abstract Dashboard Preview Glow */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-full max-w-6xl mx-auto mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
            <div className="relative rounded-t-[2.5rem] border-t border-l border-r border-border-subtle bg-surface/50 backdrop-blur-xl h-[400px] overflow-hidden shadow-2xl flex p-8">
              {/* Fake UI elements to simulate dashboard */}
              <div className="w-64 border-r border-border-subtle pr-6 hidden md:block">
                <div className="h-8 w-32 bg-surface rounded-lg mb-8"></div>
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-6 w-full bg-surface rounded-md"></div>)}
                </div>
              </div>
              <div className="flex-1 md:pl-8">
                <div className="flex gap-4 mb-8">
                  {[1,2,3].map(i => <div key={i} className="h-24 flex-1 bg-surface rounded-2xl border border-border-subtle"></div>)}
                </div>
                <div className="h-[200px] w-full bg-surface rounded-2xl border border-border-subtle overflow-hidden relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[1px] bg-accent-emerald/50"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-[80%] bg-accent-emerald/50"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Enterprise Trust */}
        <section className="py-24 border-y border-border-subtle bg-surface/20">
          <div className="container mx-auto px-6">
            <p className="text-center text-[15px] font-medium text-text-muted tracking-widest uppercase mb-12">
              Powering Next-Generation Law Enforcement
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { label: 'Uptime SLA', value: '99.99%', icon: Activity },
                { label: 'Active Districts', value: '31', icon: MapIcon },
                { label: 'Daily Events', value: '1.2M+', icon: Zap },
                { label: 'Agent Clusters', value: '15', icon: Network }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center text-center">
                  <div className="text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary font-medium">
                    <stat.icon size={16} /> {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities Bento Grid */}
        <section id="capabilities" className="py-32 container mx-auto px-6">
          <SectionHeading 
            title="Unprecedented Capabilities" 
            subtitle="A unified platform that fuses spatial mapping, graph syndicates, and swarm intelligence."
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Large Feature 1 */}
            <BentoCard 
              title="PostGIS Spatial Indexing" 
              description="Real-time geospatial intelligence. Process millions of coordinates with sub-millisecond latency for instant hotspot buffer visualization."
              icon={Globe}
              className="md:col-span-2"
              delay={0}
            >
              <div className="mt-8 h-48 rounded-xl bg-surface border border-border-subtle overflow-hidden relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-emerald via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 h-1/2 bg-gradient-to-t from-background to-transparent z-10"></div>
                {/* Simulated map grid */}
                <div className="w-full h-full border-[0.5px] border-border-strong/10" style={{ backgroundImage: 'linear-gradient(var(--color-border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-subtle) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              </div>
            </BentoCard>

            {/* Feature 2 */}
            <BentoCard 
              title="Multi-Agent Swarm" 
              description="15 specialized LLM agents working synchronously to dissect cases."
              icon={Cpu}
              delay={0.1}
            >
              <div className="mt-8 flex flex-col gap-3">
                {['Analysis Node', 'Intelligence Node', 'Synthesis Node'].map((node, i) => (
                  <div key={i} className="px-4 py-3 rounded-lg bg-surface border border-border-subtle flex items-center justify-between">
                    <span className="text-[13px] font-medium">{node}</span>
                    <span className="flex h-2 w-2 rounded-full bg-accent-emerald"></span>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Feature 3 */}
            <BentoCard 
              title="Neo4j Graph Syndicates" 
              description="Instantly uncover hidden relationships between suspects, cases, and locations using deep graph traversals."
              icon={Network}
              delay={0.2}
            >
              <div className="mt-8 flex-1 flex items-center justify-center opacity-50">
                <Network className="w-32 h-32 text-text-muted" strokeWidth={1} />
              </div>
            </BentoCard>

            {/* Large Feature 4 */}
            <BentoCard 
              title="Redpanda Event Streaming" 
              description="Apache Kafka compatible event streaming processing over 100,000 events per second. True real-time operational dashboarding."
              icon={Zap}
              className="md:col-span-2"
              delay={0.3}
            >
              <div className="mt-8 h-48 rounded-xl bg-surface border border-border-subtle p-6 flex flex-col justify-end">
                <div className="flex items-end gap-2 h-full opacity-60">
                  {[40, 70, 45, 90, 65, 85, 100, 50, 75, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-accent-emerald/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
              </div>
            </BentoCard>
          </div>
        </section>

        {/* AI Workflow Visualization */}
        <section className="py-32 bg-surface/20 border-y border-border-subtle overflow-hidden">
          <div className="container mx-auto px-6">
            <SectionHeading 
              title="Continuous Intelligence Pipeline" 
              subtitle="How raw data transforms into actionable executive decisions in milliseconds."
            />
            
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-border-subtle -translate-y-1/2 z-0"></div>
              
              {[
                { title: 'Data Ingestion', desc: 'IoT, FIRs, Feeds', icon: Database },
                { title: 'AI Processing', desc: 'LangGraph Swarm', icon: Cpu },
                { title: 'Decision Engine', desc: 'Rules & RBAC', icon: Workflow },
                { title: 'Executive BI', desc: 'Real-Time Insights', icon: LineChart }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative z-10 flex flex-col items-center text-center group bg-background/50 p-6 rounded-3xl w-full md:w-56 border border-border-subtle backdrop-blur-sm"
                >
                  <div className="w-16 h-16 rounded-2xl bg-surface border border-border-strong flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:border-accent-emerald">
                    <step.icon className="w-8 h-8 text-text-primary" />
                  </div>
                  <h4 className="text-[17px] font-semibold mb-2">{step.title}</h4>
                  <p className="text-[14px] text-text-secondary">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security & Architecture */}
        <section id="security" className="py-32 container mx-auto px-6">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
              >
                Government Grade Security.
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-text-secondary mb-10 leading-relaxed"
              >
                Built for mission-critical operations. Every endpoint is secured with stateless JWT tokens, granular Role-Based Access Control (RBAC), and comprehensive audit trails.
              </motion.p>
              
              <div className="space-y-6">
                {[
                  { title: 'End-to-End Encryption', desc: 'AES-256 encryption at rest and TLS 1.3 in transit.' },
                  { title: 'Identity & Access Management', desc: 'Integrated with Keycloak for enterprise SSO.' },
                  { title: 'Immutable Audit Logs', desc: 'Every query and action is permanently recorded.' }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    className="flex gap-4"
                  >
                    <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-accent-emerald" /></div>
                    <div>
                      <h5 className="font-semibold text-[16px]">{item.title}</h5>
                      <p className="text-[14px] text-text-secondary mt-1">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-8 rounded-3xl bg-surface border border-border-subtle col-span-2 shadow-sm">
                  <Server className="w-8 h-8 mb-4 text-text-muted" />
                  <h3 className="text-xl font-semibold mb-2">FastAPI Core</h3>
                  <p className="text-text-secondary text-sm">High-performance async Python backend processing 50k+ req/sec.</p>
                </div>
                <div className="p-8 rounded-3xl bg-surface border border-border-subtle shadow-sm">
                  <Database className="w-8 h-8 mb-4 text-text-muted" />
                  <h3 className="text-xl font-semibold mb-2">PostgreSQL</h3>
                  <p className="text-text-secondary text-sm">PostGIS enabled for spatial queries.</p>
                </div>
                <div className="p-8 rounded-3xl bg-surface border border-border-subtle shadow-sm">
                  <Network className="w-8 h-8 mb-4 text-text-muted" />
                  <h3 className="text-xl font-semibold mb-2">Neo4j</h3>
                  <p className="text-text-secondary text-sm">Graph traversal for syndicate discovery.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-accent-charcoal dark:bg-accent-emerald/5 z-0"></div>
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white dark:text-text-primary mb-6">
              Ready for production.
            </h2>
            <p className="text-lg md:text-xl text-white/70 dark:text-text-secondary max-w-2xl mx-auto mb-12">
              Experience the future of law enforcement intelligence today.
            </p>
            <button 
              onClick={onLaunch}
              className="px-10 py-5 rounded-2xl bg-white text-black dark:bg-text-primary dark:text-background text-[18px] font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
            >
              Access the Dashboard
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-background py-12 relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-text-primary font-bold">
            <Shield className="w-5 h-5" /> KSP AI
          </div>
          <div className="text-[13px] text-text-muted">
            &copy; 2026 KSP Intelligence Architecture. All rights reserved.
          </div>
          <div className="flex gap-6 text-[13px] font-medium text-text-secondary">
            <a href="#" className="hover:text-text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-text-primary transition-colors">Security</a>
            <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
