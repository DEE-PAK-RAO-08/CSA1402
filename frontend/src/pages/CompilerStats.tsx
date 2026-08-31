import { useState, useEffect } from "react"
import { api } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Cpu, Zap, Activity, RefreshCw, Layers, ShieldCheck, CheckCircle2, AlertTriangle, BarChart2 } from "lucide-react"

export default function CompilerStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await api.getCompilerStats()
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const stages = [
    { label: "Lexical Analysis (Lexer)", key: "avg_lex_ms", color: "from-cyan-500 to-blue-500", desc: "Tokenization & canonicalization" },
    { label: "Syntax Analysis (Parser)", key: "avg_parse_ms", color: "from-blue-500 to-indigo-500", desc: "Grammar & AST node construction" },
    { label: "Semantic Validation", key: "avg_semantic_ms", color: "from-emerald-500 to-teal-500", desc: "Database state & business rules" },
    { label: "IR Generation", key: "avg_ir_ms", color: "from-amber-500 to-yellow-500", desc: "Low-level opcode synthesis" },
    { label: "IR Optimization", key: "avg_opt_ms", color: "from-purple-500 to-pink-500", desc: "Pass deduplication & merging" },
    { label: "DAG Analysis", key: "avg_dag_ms", color: "from-indigo-500 to-purple-500", desc: "Dependency hazard resolution" },
    { label: "Transaction Execution", key: "avg_exec_ms", color: "from-rose-500 to-red-500", desc: "ACID database commit & audit" },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30">
              <Cpu className="h-6 w-6" />
            </div>
            Compiler Performance Analytics
          </h2>
          <p className="text-sm text-[#8b949e] mt-1">
            Real-time stage-by-stage latency metrics and pipeline throughput telemetry.
          </p>
        </div>

        <Button onClick={loadStats} variant="outline" className="border-[#30363d] hover:bg-[#21262d] text-white gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-400" : ""}`} /> Refresh Metrics
        </Button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-4 space-y-1">
          <div className="text-xs text-[#8b949e] font-semibold flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-cyan-400" /> Total Commands
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats?.total_commands || 0}</div>
        </div>

        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-4 space-y-1">
          <div className="text-xs text-[#8b949e] font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Success Rate
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{stats?.success_rate || 0}%</div>
        </div>

        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-4 space-y-1">
          <div className="text-xs text-[#8b949e] font-semibold flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Errors Caught
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{stats?.failed_commands || 0}</div>
        </div>

        <div className="bg-[#161b22] border border-[#21262d] rounded-2xl p-4 space-y-1">
          <div className="text-xs text-[#8b949e] font-semibold flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" /> Avg Total Latency
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">{stats?.avg_total_ms || 0} <span className="text-xs font-normal text-[#8b949e]">ms</span></div>
        </div>
      </div>

      {/* Stage-by-Stage Latency Breakdown */}
      <Card className="glass-card border-[#21262d] bg-[#161b22]">
        <CardHeader className="border-b border-[#21262d] pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-purple-400" />
            <div>
              <CardTitle className="text-lg font-bold text-white">Pipeline Stage Latency Profile</CardTitle>
              <CardDescription className="text-xs text-[#8b949e]">Average processing time per compiler stage across all commands</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {stages.map((st) => {
            const val = stats?.[st.key] || 0
            const maxVal = stats?.avg_total_ms || 10
            const pct = Math.min(Math.max((val / (maxVal || 1)) * 100, 4), 100)

            return (
              <div key={st.key} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white">{st.label}</span>
                    <span className="text-[#8b949e] ml-2 font-mono text-[11px]">— {st.desc}</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-300">{val} ms</span>
                </div>

                <div className="h-3 w-full bg-[#0d1117] rounded-full overflow-hidden border border-[#30363d]/50 p-0.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${st.color} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
