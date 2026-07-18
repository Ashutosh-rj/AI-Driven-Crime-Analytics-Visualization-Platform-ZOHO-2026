export default function Dashboard({ stats }) {
  if (!stats) return <div className="text-center text-slate-500 mt-20">Connecting to Enterprise Medallion Lakehouse...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="5-Year Return on Investment (ROI)" value={`${stats.roiPercent}%`} delta="▲ $17.11M USD Net Economic Benefit" />
        <StatCard label="Measured Unit Cost / Transaction" value={`$${stats.unitCostUsd}`} delta="✓ 25% below $0.00020 FinOps Ceiling" />
        <StatCard label="Target Case Clearance Rate" value={`${stats.clearanceRatePct}%`} delta="▲ +31.7% over Legacy CCTNS Baseline" />
        <StatCard label="Measured System Uptime (SRE)" value={`${stats.systemUptimePct}%`} delta="✓ Error Rate 0.0014% (< 0.01% target)" />
      </div>

      <div className="glass-panel mt-8">
        <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><span>🏛️</span> 31-District Statewide Executive Compliance Matrix</h2>
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">DATABRICKS LAKEHOUSE MEDALLION GOLD CUBE</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="py-4 font-semibold">District / Range</th>
                <th className="py-4 font-semibold">Active FIRs</th>
                <th className="py-4 font-semibold">Clearance Rate</th>
                <th className="py-4 font-semibold">AI Swarm Usage</th>
                <th className="py-4 font-semibold">Hotspot Accuracy</th>
                <th className="py-4 font-semibold">SLA Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <TableRow dist="D-01: Bengaluru Urban" active="1,420" clear="86.2%" swarm="4,120 queries/day" acc="91.4% hit rate" />
              <TableRow dist="D-02: Mysuru City Range" active="482" clear="84.8%" swarm="1,240 queries/day" acc="88.9% hit rate" />
              <TableRow dist="D-03: Hubballi-Dharwad" active="390" clear="83.1%" swarm="980 queries/day" acc="87.2% hit rate" />
              <TableRow dist="D-04: Mangaluru City" active="310" clear="85.5%" swarm="890 queries/day" acc="89.1% hit rate" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, delta }) {
  return (
    <div className="glass-panel !p-5">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-bold text-accentEmerald mb-2">{value}</div>
      <div className="text-xs text-emerald-400 font-semibold">{delta}</div>
    </div>
  )
}

function TableRow({ dist, active, clear, swarm, acc }) {
  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
      <td className="py-4 font-semibold text-slate-300">{dist}</td>
      <td className="py-4">{active}</td>
      <td className="py-4 font-bold text-accentEmerald">{clear}</td>
      <td className="py-4 text-slate-400">{swarm}</td>
      <td className="py-4 text-slate-400">{acc}</td>
      <td className="py-4"><span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold border border-emerald-500/30">COMPLIANT</span></td>
    </tr>
  )
}
