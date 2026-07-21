import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Database, Server, Network, Shield, 
  Cpu, Zap, LayoutDashboard, Search, Key, 
  Layers
} from 'lucide-react'

const ArchitectureNode = ({ icon: Icon, title, description, colorClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-surface/50 backdrop-blur-md border border-border-subtle hover:border-border-strong rounded-2xl p-5 flex flex-col items-center text-center group transition-all"
  >
    <div className={`p-3 rounded-xl mb-3 shadow-lg ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h4 className="text-[15px] font-bold text-text-primary mb-1">{title}</h4>
    <p className="text-[12px] text-text-secondary leading-relaxed">{description}</p>
  </motion.div>
)

const Connector = ({ direction = "vertical" }) => (
  <div className={`flex items-center justify-center ${direction === "vertical" ? "py-2" : "px-2"}`}>
    <div className={`${direction === "vertical" ? "w-[1px] h-8" : "h-[1px] w-8"} bg-border-strong relative`}>
      <motion.div
        animate={
          direction === "vertical" 
            ? { y: [0, 32], opacity: [0, 1, 0] }
            : { x: [0, 32], opacity: [0, 1, 0] }
        }
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className={`absolute ${direction === "vertical" ? "w-1 h-3 -left-[1.5px]" : "h-1 w-3 -top-[1.5px]"} bg-accent-emerald rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]`}
      />
    </div>
  </div>
)

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl bg-surface border border-border-subtle rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-border-subtle bg-surface/50 backdrop-blur-xl relative z-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-3">
                <Layers className="text-accent-emerald w-7 h-7" />
                Enterprise Architecture
              </h2>
              <p className="text-sm text-text-secondary mt-1">Real-time data flow from Edge to AI Swarm</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface border border-transparent hover:border-border-subtle transition-all"
            >
              <X className="w-6 h-6 text-text-muted hover:text-text-primary" />
            </button>
          </div>

          {/* Content - Scrollable Grid */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar relative">
            {/* Background glowing effects */}
            <div className="absolute top-[20%] left-[10%] w-[30%] h-[40%] bg-accent-emerald/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[30%] bg-surface-elevated blur-[100px] rounded-full pointer-events-none" />
            
            <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
              
              {/* Tier 1: Frontend & Identity */}
              <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
                <div className="flex-1 max-w-[280px]">
                  <ArchitectureNode 
                    icon={LayoutDashboard}
                    title="React Executive UI"
                    description="Real-time web client visualizing PostGIS hotspots and Swarm responses."
                    colorClass="bg-slate-700"
                    delay={0.1}
                  />
                </div>
                <div className="flex-1 max-w-[280px]">
                  <ArchitectureNode 
                    icon={Key}
                    title="Keycloak IAM"
                    description="Enterprise SSO & fine-grained RBAC protecting API endpoints."
                    colorClass="bg-slate-700"
                    delay={0.2}
                  />
                </div>
              </div>

              <Connector direction="vertical" />

              {/* Tier 2: API Gateway */}
              <div className="w-full max-w-[400px]">
                <ArchitectureNode 
                  icon={Server}
                  title="FastAPI Backbone"
                  description="High-performance async Python backend routing traffic at 50k+ req/sec."
                  colorClass="bg-emerald-600"
                  delay={0.3}
                />
              </div>

              <Connector direction="vertical" />

              {/* Tier 3: Event Streaming */}
              <div className="w-full max-w-[400px]">
                <ArchitectureNode 
                  icon={Zap}
                  title="Redpanda (Kafka)"
                  description="Sub-millisecond event streaming bus for FIRs and IoT ingests."
                  colorClass="bg-slate-700"
                  delay={0.4}
                />
              </div>

              <Connector direction="vertical" />

              {/* Tier 4: Data Layer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mb-6">
                <ArchitectureNode 
                  icon={Database}
                  title="PostgreSQL + PostGIS"
                  description="ACID compliance and spatial indexing for crime hotspots."
                  colorClass="bg-slate-700"
                  delay={0.5}
                />
                <ArchitectureNode 
                  icon={Network}
                  title="Neo4j Graph"
                  description="Discovers hidden syndicates through deep multi-hop graph traversal."
                  colorClass="bg-amber-600"
                  delay={0.6}
                />
                <ArchitectureNode 
                  icon={Search}
                  title="Qdrant Vector DB"
                  description="Semantic search and embedding storage for unstructured FIR text."
                  colorClass="bg-slate-700"
                  delay={0.7}
                />
              </div>

              {/* Tier 5: Swarm Intelligence */}
              <div className="w-full mt-4 p-6 rounded-2xl bg-gradient-to-r from-surface to-background border border-accent-emerald/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-accent-emerald/5 mix-blend-overlay"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                  <div className="p-4 bg-accent-emerald/20 border border-accent-emerald/40 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <Cpu className="w-10 h-10 text-accent-emerald" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-bold text-text-primary mb-2 flex items-center justify-center sm:justify-start gap-2">
                      LangGraph AI Swarm
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent-emerald text-background uppercase tracking-wider">Active</span>
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      A synchronized network of 15 specialized LLM agents (Analysis, Intel, Synthesis nodes) 
                      continuously reasoning over data retrieved from Neo4j, PostGIS, and Qdrant to generate 
                      actionable executive insights.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
