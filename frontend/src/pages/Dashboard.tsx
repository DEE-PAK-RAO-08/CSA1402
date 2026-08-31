import { useEffect, useState } from "react"
import { api } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { Package, Activity, Terminal, AlertTriangle, RefreshCw, Cpu, CheckCircle2, TrendingUp, Code2, Layers, ShieldCheck, Zap, ArrowRight, ChevronRight } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null)
  const [dailyData, setDailyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sum, daily] = await Promise.all([
        api.getSummary().catch(() => null),
        api.getDailyReport().catch(() => [])
      ])
      setSummary(sum || { total_commands: 0, successful_commands: 0, failed_commands: 0, lexical_errors: 0, syntax_errors: 0, semantic_errors: 0, execution_failures: 0, total_inventory_items: 0, total_warehouses: 0, total_transactions: 0 })
      setDailyData(daily || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // ── 4 Core Modules Definition ──────────────────────────────────────────
  const coreModules = [
    {
      num: 1,
      name: "Command Input & Lexical Analysis",
      description: "Accepts warehouse commands and identifies tokens such as product ID, quantity, and warehouse ID.",
      icon: Terminal,
      color: "from-cyan-600 to-cyan-500",
      borderColor: "border-cyan-500/40",
      bgColor: "bg-cyan-500/5",
      textColor: "text-cyan-400",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      link: "/commands",
      stats: `${summary?.total_commands ?? 0} commands processed`,
    },
    {
      num: 2,
      name: "Syntax Analysis",
      description: "Checks whether the inventory command follows the defined command structure and grammar.",
      icon: Code2,
      color: "from-amber-600 to-amber-500",
      borderColor: "border-amber-500/40",
      bgColor: "bg-amber-500/5",
      textColor: "text-amber-400",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      link: "/compiler-stats",
      stats: `${summary?.syntax_errors ?? 0} syntax errors caught`,
    },
    {
      num: 3,
      name: "Semantic Analysis",
      description: "Verifies product existence, stock availability, warehouse validity, and logical correctness.",
      icon: ShieldCheck,
      color: "from-purple-600 to-purple-500",
      borderColor: "border-purple-500/40",
      bgColor: "bg-purple-500/5",
      textColor: "text-purple-400",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      link: "/warehouses",
      stats: `${summary?.semantic_errors ?? 0} semantic violations`,
    },
    {
      num: 4,
      name: "Inventory Processing & Validation",
      description: "Executes valid commands and updates inventory records while rejecting invalid operations.",
      icon: Zap,
      color: "from-emerald-600 to-emerald-500",
      borderColor: "border-emerald-500/40",
      bgColor: "bg-emerald-500/5",
      textColor: "text-emerald-400",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      link: "/inventory",
      stats: `${summary?.successful_commands ?? 0} successfully executed`,
    },
  ]

  const kpis = [
    { title: "Total Commands", value: summary?.total_commands ?? 0, delta: "All compiler runs", icon: Terminal, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { title: "Successful", value: summary?.successful_commands ?? 0, delta: "Committed to DB", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { title: "Errors Caught", value: summary?.failed_commands ?? 0, delta: "By pipeline", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { title: "Stock Records", value: summary?.total_inventory_items ?? 0, delta: "Inventory rows", icon: Package, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  ]

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3]">Dashboard</h1>
          <p className="text-sm text-[#8b949e] mt-1">WICL Compiler — 4 Module Architecture Overview & Pipeline Performance Metrics.</p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] gap-2 transition-all"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} /> Refresh
        </Button>
      </div>

      {/* ── 4 Module Architecture Section ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">WICL Compiler — 4 Core Modules</h2>
            <p className="text-xs text-[#8b949e]">The compiler pipeline processes every warehouse command through these 4 sequential modules.</p>
          </div>
        </div>

        {/* Module Cards Row with Flow Arrows */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {coreModules.map((mod, idx) => {
            const Icon = mod.icon
            return (
              <div key={mod.num} className="relative flex items-stretch">
                <Link to={mod.link} className="flex-1">
                  <div className={`h-full rounded-2xl border-2 ${mod.borderColor} ${mod.bgColor} p-5 space-y-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[${mod.textColor.replace('text-', '')}]/10 group cursor-pointer`}>
                    {/* Module Number Badge & Icon */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br ${mod.color} text-white text-sm font-black shadow-lg`}>
                          {mod.num}
                        </span>
                        <div className={`p-1.5 rounded-lg bg-[#0d1117]/50 ${mod.textColor}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 ${mod.textColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>

                    {/* Module Name */}
                    <div>
                      <h3 className={`text-sm font-bold ${mod.textColor} leading-tight`}>
                        Module {mod.num}
                      </h3>
                      <p className="text-xs text-white font-semibold mt-0.5 leading-snug">{mod.name}</p>
                    </div>

                    {/* Module Description */}
                    <p className="text-[11px] text-[#8b949e] leading-relaxed">
                      {mod.description}
                    </p>

                    {/* Stats Badge */}
                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border ${mod.badgeColor}`}>
                      <CheckCircle2 className="h-3 w-3" />
                      {mod.stats}
                    </div>
                  </div>
                </Link>

                {/* Flow Arrow between modules */}
                {idx < 3 && (
                  <div className="hidden md:flex items-center justify-center absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                    <div className="h-5 w-5 rounded-full bg-[#161b22] border-2 border-[#30363d] flex items-center justify-center">
                      <ArrowRight className="h-3 w-3 text-[#484f58]" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Module Pipeline Flow Bar */}
        <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-3">
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono overflow-x-auto">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold whitespace-nowrap">M1: Lexer</span>
            <ArrowRight className="h-3 w-3 text-[#484f58] shrink-0" />
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold whitespace-nowrap">M2: Parser</span>
            <ArrowRight className="h-3 w-3 text-[#484f58] shrink-0" />
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold whitespace-nowrap">M3: Semantic</span>
            <ArrowRight className="h-3 w-3 text-[#484f58] shrink-0" />
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold whitespace-nowrap">M4: Executor</span>
            <ArrowRight className="h-3 w-3 text-[#484f58] shrink-0" />
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold whitespace-nowrap">✓ Result</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.title}
              className={`rounded-xl border p-5 ${kpi.bg} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">{kpi.title}</span>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className={`text-3xl font-black ${kpi.color}`}>
                {loading ? "—" : kpi.value.toLocaleString()}
              </div>
              <p className="text-xs text-[#484f58] mt-1.5 font-mono">{kpi.delta}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-4 bg-[#161b22] border border-[#21262d] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" /> Command Throughput
              </h3>
              <p className="text-xs text-[#484f58] mt-0.5">Daily execution volumes</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-blue-400"><span className="h-2 w-2 rounded-sm bg-blue-500" />Successful</span>
              <span className="flex items-center gap-1.5 text-red-400"><span className="h-2 w-2 rounded-sm bg-red-500" />Failed</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barSize={12} barGap={2}>
                <XAxis dataKey="date" stroke="#484f58" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#484f58" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#e6edf3', borderRadius: '10px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="successful" fill="#388bfd" radius={[4, 4, 0, 0]} name="Successful" />
                <Bar dataKey="failed" fill="#f85149" radius={[4, 4, 0, 0]} name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compiler Pipeline Stage Error Breakdown — mapped to 4 modules */}
        <div className="lg:col-span-3 bg-[#161b22] border border-[#21262d] rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[#e6edf3] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-400" /> Module-Level Diagnostics
            </h3>
            <p className="text-xs text-[#484f58] mt-0.5">Error distribution by module</p>
          </div>

          {[
            { label: "M1 · Lexical Analysis", val: summary?.lexical_errors ?? 0, max: Math.max(summary?.failed_commands || 1, 1), color: "bg-cyan-500" },
            { label: "M2 · Syntax (Parser)", val: summary?.syntax_errors ?? 0, max: Math.max(summary?.failed_commands || 1, 1), color: "bg-amber-500" },
            { label: "M3 · Semantic Rules", val: summary?.semantic_errors ?? 0, max: Math.max(summary?.failed_commands || 1, 1), color: "bg-purple-500" },
            { label: "M4 · Execution Engine", val: summary?.execution_failures ?? 0, max: Math.max(summary?.failed_commands || 1, 1), color: "bg-emerald-500" },
          ].map((stage) => (
            <div key={stage.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8b949e] font-medium">{stage.label}</span>
                <span className="font-mono text-[#e6edf3]">{stage.val}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#21262d] overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all duration-700`}
                  style={{ width: `${Math.min((stage.val / stage.max) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}

          {/* Success Rate */}
          <div className="pt-4 mt-4 border-t border-[#21262d]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#8b949e] font-medium">Overall Pipeline Success Rate</span>
              <span className="text-sm font-bold text-emerald-400">
                {summary?.total_commands ? Math.round((summary.successful_commands / summary.total_commands) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#21262d] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                style={{
                  width: `${summary?.total_commands ? Math.round((summary.successful_commands / summary.total_commands) * 100) : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

