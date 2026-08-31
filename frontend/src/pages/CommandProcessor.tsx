import { useState } from "react"
import { api } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, Check, X, Terminal, Cpu, Database, RefreshCw, 
  Code2, Sparkles, Layers, ShieldCheck, Zap, GitFork, 
  Activity, Clock, AlertTriangle, FileText, CheckCircle2, AlertCircle
} from "lucide-react"

export default function CommandProcessor() {
  const { user } = useAuth()
  const [command, setCommand] = useState("TRANSFER 20 MOUSE001 FROM WH01 TO WH02;")
  const [result, setResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState("ir")
  const [selectedBatchIdx, setSelectedBatchIdx] = useState(0)

  // Resolve active result object (single command or selected item in batch)
  const activeRes = result?.is_batch 
    ? (result.results?.[selectedBatchIdx] || result.results?.[0] || {})
    : result

  const samplePresets = [
    { label: "TRANSFER Stock", cmd: "TRANSFER 20 MOUSE001 FROM WH01 TO WH02;" },
    { label: "ADD Stock", cmd: "ADD 50 LAPTOP001 TO WH01;" },
    { label: "CHECK Stock", cmd: "CHECK MONITOR001 IN WH03;" },
    { label: "REMOVE Stock", cmd: "REMOVE 5 KEYBOARD001 FROM WH04;" },
    { label: "BATCH Sequence", cmd: "BEGIN BATCH\nADD 50 LAPTOP001 TO WH01;\nTRANSFER 20 LAPTOP001 FROM WH01 TO WH02;\nCHECK LAPTOP001 IN WH02;\nEND BATCH" },
    { label: "Trigger Error", cmd: "REMOVE 999999 LAPTOP001 FROM WH01;" },
  ]

  const handleAnalyze = async (execute: boolean) => {
    if (!command.trim()) return
    
    setIsAnalyzing(true)
    setResult(null)
    
    try {
      let data
      if (command.trim().startsWith("BEGIN BATCH")) {
        const res = await fetch("http://localhost:8000/api/commands/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {})
          },
          body: JSON.stringify({ command, execute })
        })
        data = await res.json()
      } else {
        data = await api.analyzeCommand(command, execute)
      }
      setResult(data)
    } catch (err: any) {
      setResult({
        error: true,
        message: err.message || "Failed to communicate with compiler engine"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "success" || status === "completed" || status === "ready") 
      return <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"><Check className="h-3.5 w-3.5" /></div>
    if (status === "skipped" || status === "pending") 
      return <div className="p-1 rounded-full bg-slate-800 text-slate-500 border border-slate-700"><div className="h-3.5 w-3.5 rounded-full border-2 border-slate-600" /></div>
    return <div className="p-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40"><X className="h-3.5 w-3.5" /></div>
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
              <Terminal className="h-6 w-6" />
            </div>
            WICL Compiler Playground
          </h2>
          <p className="text-muted-foreground mt-1">
            Domain-Specific Compiler Pipeline for Warehouse Operations (Lexer → Parser → AST → Semantic → IR → Optimizer → DAG → Execution).
          </p>
        </div>

        {/* Presets Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Quick Samples:
          </span>
          {samplePresets.map((p) => (
            <button
              key={p.label}
              onClick={() => setCommand(p.cmd)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 transition-all font-mono"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-14rem)] min-h-[550px]">
        {/* Editor Panel */}
        <Card className="glass-card border-slate-800 flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b border-slate-800 bg-slate-950/40 pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-cyan-400" />
                <CardTitle className="text-base font-bold">WICL Code Buffer</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAnalyze(false)}
                  disabled={isAnalyzing}
                  className="border-slate-700 hover:bg-slate-800 text-xs gap-1.5"
                >
                  <Cpu className="h-3.5 w-3.5 text-cyan-400" /> Dry Run (Analyze)
                </Button>

                {user?.role !== "viewer" && (
                  <Button 
                    size="sm"
                    onClick={() => handleAnalyze(true)}
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs gap-1.5 shadow-md shadow-cyan-500/20"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current" />
                    )}
                    Execute Command
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 relative flex flex-col bg-[#0d1117]">
            <div className="flex-1 flex overflow-hidden">
              <div className="w-10 bg-[#161b22] border-r border-[#30363d] p-3 text-right text-xs font-mono text-slate-600 select-none space-y-1">
                {command.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter WICL command... (e.g. TRANSFER 20 MOUSE001 FROM WH01 TO WH02;)"
                className="flex-1 bg-transparent p-3 font-mono text-sm text-cyan-300 focus:outline-none resize-none leading-relaxed overflow-y-auto"
                spellCheck={false}
              />
            </div>
            
            <div className="p-3 bg-[#161b22] border-t border-[#30363d] flex justify-between items-center text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px]">8-Stage Compiler Ready</span>
              </div>
              <div className="font-mono text-[11px] text-slate-500">
                Shift + Enter for multi-line batch
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspection & Results Panel */}
        <Card className="glass-card border-slate-800 flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b border-slate-800 bg-slate-950/40 p-0">
            {/* Compiler Stage Pipeline Indicators */}
            <div className="p-3 border-b border-[#21262d] bg-[#161b22] overflow-x-auto">
              <div className="flex items-center justify-between text-[11px] font-mono min-w-[500px]">
                {[
                  { name: "Lexer", key: "lexer" },
                  { name: "Parser", key: "parser" },
                  { name: "Semantic", key: "semantic" },
                  { name: "IR Gen", key: "ir" },
                  { name: "Optimizer", key: "optimizer" },
                  { name: "DAG", key: "dag" },
                  { name: "Execution", key: "execution" },
                ].map((st, idx) => {
                  const status = result?.pipeline_status?.[st.key] || result?.results?.[0]?.pipeline_status?.[st.key] || "pending"
                  return (
                    <div key={st.key} className="flex items-center gap-1.5">
                      {idx > 0 && <span className="text-[#30363d] mr-1">→</span>}
                      <StatusIcon status={status} />
                      <span className={status === "success" || status === "completed" || status === "ready" ? "text-emerald-400 font-bold" : status === "error" ? "text-rose-400 font-bold" : "text-[#8b949e]"}>
                        {st.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto bg-[#0d1117] p-1 gap-1 border-b border-[#21262d]">
              {[
                { id: "ir", label: "IR", icon: Zap },
                { id: "opt_ir", label: "Optimized IR", icon: Layers },
                { id: "dag", label: "DAG", icon: GitFork },
                { id: "trace", label: "Trace", icon: Activity },
                { id: "tokens", label: "Tokens", icon: Code2 },
                { id: "ast", label: "AST", icon: Layers },
                { id: "semantic", label: "Semantic", icon: ShieldCheck },
                { id: "errors", label: "Errors", icon: AlertTriangle },
                { id: "perf", label: "Performance", icon: Clock },
                { id: "json", label: "Raw JSON", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                        : "text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Batch Command Selector Bar (if batch executed) */}
            {result?.is_batch && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-b border-[#21262d] overflow-x-auto text-xs">
                <span className="text-[#8b949e] font-bold shrink-0">Batch Command ({result.batch_count}):</span>
                {result.results?.map((resItem: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedBatchIdx(idx)}
                    className={`px-2.5 py-1 rounded-md font-mono text-[11px] shrink-0 transition-colors ${
                      selectedBatchIdx === idx
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold"
                        : "bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]"
                    }`}
                  >
                    #{idx + 1} {resItem.raw_command?.substring(0, 18)}...
                  </button>
                ))}
              </div>
            )}
          </CardHeader>

          {/* Tab Content Display */}
          <CardContent className="p-4 flex-1 overflow-y-auto bg-[#0d1117] font-mono text-xs">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#484f58] p-6 space-y-3">
                <Cpu className="h-10 w-10 text-[#30363d]" />
                <div>
                  <div className="text-sm font-semibold text-[#8b949e]">Compiler Ready</div>
                  <p className="text-xs text-[#484f58] max-w-xs mt-1">
                    Enter a command and click <strong>Dry Run</strong> or <strong>Execute</strong> to inspect token streams, AST, IR, DAG, and execution trace.
                  </p>
                </div>
              </div>
            ) : result.error ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertCircle className="h-4 w-4" /> Error Processing Command
                </div>
                <div>{result.message}</div>
              </div>
            ) : (
              <>
                {/* ── TAB: IR ─────────────────────────────────────────── */}
                {activeTab === "ir" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[#8b949e] pb-2 border-b border-[#21262d]">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Zap className="h-4 w-4 text-cyan-400" />
                        Stage 5: Intermediate Representation (IR)
                      </span>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                        {activeRes?.ir?.instruction_count || 0} Opcodes Generated
                      </span>
                    </div>

                    {activeRes?.ir?.text ? (
                      <pre className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] text-cyan-300 overflow-x-auto leading-relaxed text-xs">
                        {activeRes.ir.text}
                      </pre>
                    ) : (
                      <div className="text-[#8b949e]">No IR generated (requires successful semantic validation).</div>
                    )}
                  </div>
                )}

                {/* ── TAB: OPTIMIZED IR ───────────────────────────────── */}
                {activeTab === "opt_ir" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[#8b949e] pb-2 border-b border-[#21262d]">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Layers className="h-4 w-4 text-purple-400" />
                        Stage 6: IR Optimizer
                      </span>
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                        {activeRes?.optimized_ir?.reduction_count || 0} Opcodes Reduced
                      </span>
                    </div>

                    {activeRes?.optimized_ir?.optimizations?.length > 0 && (
                      <div className="bg-[#161b22] border border-purple-500/30 p-3 rounded-xl space-y-1">
                        <div className="text-xs font-bold text-purple-400">Optimizations Applied:</div>
                        {activeRes.optimized_ir.optimizations.map((opt: any, i: number) => (
                          <div key={i} className="text-[#c9d1d9] text-[11px] flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            <strong>{opt.pass_name}:</strong> {opt.description} ({opt.lines_saved} saved)
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] text-[#8b949e] font-bold mb-1">Original IR</div>
                        <pre className="bg-[#161b22] p-3 rounded-xl border border-[#21262d] text-slate-400 overflow-x-auto text-[11px] leading-relaxed h-64">
                          {activeRes?.optimized_ir?.original_text || activeRes?.ir?.text || "—"}
                        </pre>
                      </div>
                      <div>
                        <div className="text-[11px] text-emerald-400 font-bold mb-1">Optimized IR</div>
                        <pre className="bg-[#161b22] p-3 rounded-xl border border-emerald-500/30 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed h-64">
                          {activeRes?.optimized_ir?.optimized_text || activeRes?.ir?.text || "—"}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB: DAG ────────────────────────────────────────── */}
                {activeTab === "dag" && (
                  <div className="space-y-4">
                    {(() => {
                      const dagObj = result?.batch_dag || activeRes?.dag || result?.dag || {}
                      return (
                        <>
                          <div className="flex items-center justify-between text-[#8b949e] pb-2 border-b border-[#21262d]">
                            <span className="font-bold text-white flex items-center gap-2">
                              <GitFork className="h-4 w-4 text-blue-400" />
                              Stage 7: Dependency Analysis & DAG {result?.is_batch ? "(Full Batch)" : ""}
                            </span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                              {dagObj.total_nodes || 1} Nodes · {dagObj.total_edges || 0} Dependency Edges
                            </span>
                          </div>

                          {dagObj.ascii_graph && (
                            <pre className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] text-blue-300 overflow-x-auto text-xs leading-relaxed">
                              {dagObj.ascii_graph}
                            </pre>
                          )}

                          {dagObj.edges?.length > 0 && (
                            <div className="bg-[#161b22] p-3 rounded-xl border border-[#21262d] space-y-2">
                              <div className="font-bold text-white text-xs">Dependency Hazards Detected:</div>
                              {dagObj.edges.map((edge: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-[11px] text-[#c9d1d9]">
                                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px]">
                                    {edge.dependency_type}
                                  </Badge>
                                  <span>Command #{edge.from_id} → Command #{edge.to_id}: {edge.reason}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}

                {/* ── TAB: TRACE ──────────────────────────────────────── */}
                {activeTab === "trace" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[#8b949e] pb-2 border-b border-[#21262d]">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-400" />
                        Stage 8: Execution Trace {result?.is_batch ? `(Command #${selectedBatchIdx + 1})` : ""}
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                        {activeRes?.execution_trace?.length || 0} Steps Logged
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeRes?.execution_trace?.map((step: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 bg-[#161b22] p-3 rounded-xl border border-[#21262d]">
                          <div className="h-5 w-5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {step.step_number}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 font-mono">
                                {step.stage}
                              </span>
                              <span className="text-xs text-[#c9d1d9] font-medium">{step.description}</span>
                            </div>
                            {step.detail && (
                              <div className="text-[11px] text-[#8b949e] mt-1 font-mono">{step.detail}</div>
                            )}
                          </div>
                          <StatusIcon status={step.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB: TOKENS ─────────────────────────────────────── */}
                {activeTab === "tokens" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[#8b949e] pb-2 border-b border-[#21262d]">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-cyan-400" /> Stage 2: Token Stream {result?.is_batch ? `(Command #${selectedBatchIdx + 1})` : ""}
                      </span>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                        {activeRes?.lexical_analysis?.tokens?.length || 0} Tokens
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activeRes?.lexical_analysis?.tokens?.map((tok: any, idx: number) => (
                        <div key={idx} className="bg-[#161b22] border border-[#21262d] p-2.5 rounded-lg">
                          <div className="text-[10px] text-cyan-400 font-bold uppercase">{tok.token_type}</div>
                          <div className="text-xs text-white font-bold truncate mt-0.5">"{tok.lexeme}"</div>
                          <div className="text-[10px] text-[#484f58] mt-0.5">Pos: {tok.position}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB: AST ────────────────────────────────────────── */}
                {activeTab === "ast" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[#8b949e] pb-2 border-b border-[#21262d]">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Layers className="h-4 w-4 text-emerald-400" /> Stage 3: Abstract Syntax Tree {result?.is_batch ? `(Command #${selectedBatchIdx + 1})` : ""}
                      </span>
                    </div>

                    {activeRes?.ast?.tree ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] p-3 rounded-xl text-blue-400 font-bold text-sm">
                          <Code2 className="h-4 w-4 text-emerald-400" />
                          <span>Root Node: {typeof activeRes.ast.tree === "object" ? activeRes.ast.tree.name : String(activeRes.ast.tree)}</span>
                        </div>
                        <div className="bg-[#161b22] p-4 rounded-xl border border-[#21262d] text-emerald-400 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(activeRes.ast.tree, null, 2)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#8b949e] p-4 text-center">No AST available for selected command.</div>
                    )}
                  </div>
                )}

                {/* ── TAB: SEMANTIC ───────────────────────────────────── */}
                {activeTab === "semantic" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[#8b949e] pb-2 border-b border-[#21262d]">
                      <span className="font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" /> Stage 4: Semantic Checks {result?.is_batch ? `(Command #${selectedBatchIdx + 1})` : ""}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeRes?.semantic_analysis?.checks?.map((check: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-[#161b22] border border-[#21262d] p-3 rounded-xl">
                          <div>
                            <div className="font-bold text-xs text-white flex items-center gap-2">
                              <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                                {check.rule}
                              </span>
                              {check.description}
                            </div>
                            {check.detail && <div className="text-[11px] text-[#8b949e] mt-1">{check.detail}</div>}
                          </div>
                          <Badge variant="outline" className={check.passed ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-rose-400 border-rose-500/30 bg-rose-500/10"}>
                            {check.passed ? "PASSED" : "FAILED"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB: ERRORS ─────────────────────────────────────── */}
                {activeTab === "errors" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[#8b949e] pb-2 border-b border-[#21262d]">
                      <span className="font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-400" /> Compiler Errors {result?.is_batch ? `(Command #${selectedBatchIdx + 1})` : ""}
                      </span>
                    </div>

                    {activeRes?.syntax_analysis?.errors?.length > 0 || activeRes?.semantic_analysis?.errors?.length > 0 ? (
                      <div className="space-y-3">
                        {[...(activeRes.syntax_analysis?.errors || []), ...(activeRes.semantic_analysis?.errors || [])].map((err: any, idx: number) => (
                          <div key={idx} className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-rose-300 space-y-2">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-xs uppercase bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
                                {err.error_code} · Stage: {err.stage}
                              </span>
                              {err.position && <span>Pos: {err.position}</span>}
                            </div>
                            <div className="text-sm font-semibold">{err.message || err.description}</div>
                            {err.suggestion && (
                              <div className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                                💡 <strong>Suggestion:</strong> {err.suggestion}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-emerald-400 p-4 text-center bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        ✓ Zero compiler errors detected. All stages passed cleanly.
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB: PERFORMANCE ────────────────────────────────── */}
                {activeTab === "perf" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[#8b949e] pb-2 border-b border-[#21262d]">
                      <span className="font-bold text-white flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-400" /> Compiler Pipeline Timing {result?.is_batch ? `(Command #${selectedBatchIdx + 1})` : ""}
                      </span>
                    </div>

                    {(activeRes?.performance || result?.performance) ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {(() => {
                            const pData = activeRes?.performance || result?.performance || {}
                            return [
                              { label: "Lexer", val: pData.lexer_ms },
                              { label: "Parser", val: pData.parser_ms },
                              { label: "Semantic", val: pData.semantic_ms },
                              { label: "IR Gen", val: pData.ir_ms },
                              { label: "Optimizer", val: pData.opt_ms },
                              { label: "DAG", val: pData.dag_ms },
                              { label: "Execution", val: pData.execution_ms },
                              { label: "TOTAL", val: pData.total_ms, highlight: true },
                            ].map((p: any) => (
                              <div key={p.label} className={`p-3 rounded-xl border ${p.highlight ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300" : "bg-[#161b22] border-[#21262d] text-[#c9d1d9]"}`}>
                                <div className="text-[10px] text-[#8b949e] uppercase font-bold">{p.label}</div>
                                <div className="text-lg font-bold font-mono mt-0.5">{p.val ?? 0} <span className="text-xs font-normal text-[#8b949e]">ms</span></div>
                              </div>
                            ))
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#8b949e]">No timing data available.</div>
                    )}
                  </div>
                )}

                {/* ── TAB: RAW JSON ────────────────────────────────────── */}
                {activeTab === "json" && (
                  <pre className="bg-[#161b22] p-4 rounded-xl border border-[#21262d] text-cyan-300 overflow-x-auto text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          VISUAL EXECUTION SECTION — driven entirely by real backend data
          ═══════════════════════════════════════════════════════════════════ */}
      {result && !result.error && (
        <div className="space-y-6 mt-6">
          {/* Section Header */}
          <div className="flex items-center gap-3 border-b border-[#21262d] pb-4">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Visual Execution & Transformation</h3>
              <p className="text-xs text-[#8b949e]">Parse tree, execution pipeline flow, and state transformation — all generated from the command above.</p>
            </div>
          </div>

          {/* ── DIAGRAM 1: PARSE TREE (from real AST data) ────────────── */}
          {activeRes?.ast?.tree && (
            <Card className="border-[#30363d] bg-[#161b22]">
              <CardHeader className="py-3 border-b border-[#21262d]">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" /> Diagram 1 — Interactive Parse Tree
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-[#0d1117] overflow-x-auto">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono mb-5 border-b border-[#21262d] pb-3">
                  <span className="text-slate-400 font-bold">Node Key:</span>
                  <span className="px-2 py-0.5 rounded border border-purple-500/50 bg-purple-950/80 text-purple-300">Root</span>
                  <span className="px-2 py-0.5 rounded border border-cyan-500/50 bg-cyan-950/80 text-cyan-300">Non-Terminal</span>
                  <span className="px-2 py-0.5 rounded border border-emerald-500/50 bg-emerald-950/80 text-emerald-300">Terminal Value</span>
                </div>

                {/* Recursive tree render from real AST */}
                <div className="flex justify-center min-h-[200px]">
                  {renderASTNode(activeRes.ast.tree)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── DIAGRAM 2: EXECUTION PIPELINE FLOW ────────────────────── */}
          <Card className="border-[#30363d] bg-[#161b22]">
            <CardHeader className="py-3 border-b border-[#21262d]">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" /> Diagram 2 — Execution Pipeline Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-[#0d1117]">
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 font-mono text-xs">
                {(() => {
                  const ps = activeRes?.pipeline_status || result?.pipeline_status || {}
                  const stages = [
                    { label: "LEXER", status: ps.lexer, icon: Code2, color: "border-cyan-500 text-cyan-300" },
                    { label: "PARSER", status: ps.parser, icon: Layers, color: "border-amber-500 text-amber-300" },
                    { label: "SEMANTIC", status: ps.semantic, icon: ShieldCheck, color: "border-purple-500 text-purple-300" },
                    { label: "IR GEN", status: ps.ir, icon: Zap, color: "border-blue-500 text-blue-300" },
                    { label: "OPTIMIZER", status: ps.optimizer, icon: GitFork, color: "border-teal-500 text-teal-300" },
                    { label: "DAG", status: ps.dag, icon: GitFork, color: "border-indigo-500 text-indigo-300" },
                    { label: "EXECUTE", status: ps.execution, icon: CheckCircle2, color: "border-emerald-500 text-emerald-300" },
                  ]
                    return stages.map((s, idx) => {
                      const Icon = s.icon
                      const passed = s.status === "success" || s.status === "completed" || s.status === "skipped" || s.status === "ready"
                      const failed = s.status === "error" || s.status === "failed"
                      const isReadyOnly = s.status === "ready"

                      return (
                        <div key={idx} className="flex flex-col md:flex-row items-center gap-3">
                          <div className={`p-3 rounded-2xl border-2 bg-[#161b22] flex items-center gap-2 font-bold transition-all ${
                            passed
                              ? isReadyOnly
                                ? "border-blue-400 text-blue-300 shadow-lg scale-105"
                                : `${s.color} shadow-lg scale-105`
                              : failed
                              ? "border-rose-500 text-rose-400"
                              : "border-slate-800 text-slate-600"
                          }`}>
                            <Icon className="h-4 w-4" />
                            <span>{s.label}</span>
                            {passed && !isReadyOnly && <Check className="h-3 w-3 text-emerald-400" />}
                            {isReadyOnly && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 rounded border border-blue-500/30">READY</span>}
                            {failed && <X className="h-3 w-3 text-rose-400" />}
                          </div>
                          {idx < stages.length - 1 && (
                            <>
                              <span className="text-slate-600 hidden md:block">→</span>
                              <span className="text-slate-600 md:hidden">↓</span>
                            </>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* ── DIAGRAM 3: STATE TRANSFORMATION (from real execution / dry-run) ── */}
            {(activeRes?.execution?.status === "completed" || activeRes?.execution?.status === "ready" || activeRes?.execution?.status === "success") && (
              <Card className="border-[#30363d] bg-[#161b22]">
              <CardHeader className="py-3 border-b border-[#21262d]">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="h-4 w-4 text-teal-400" /> Diagram 3 — State Transformation (Before → After)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-[#0d1117]">
                {(() => {
                  const exec = activeRes.execution
                  const astNode = activeRes.ast?.tree
                  const cmdType = astNode?.name || "COMMAND"
                  // Extract details from AST node
                  const item = astNode?.children?.find((c: any) => c.name === "ITEM")?.children?.[0]?.name || "—"
                  const qty = astNode?.children?.find((c: any) => c.name === "QUANTITY")?.children?.[0]?.name || "—"
                  const loc = astNode?.children?.find((c: any) => c.name === "LOCATION")?.children?.[0]?.name
                  const srcLoc = astNode?.children?.find((c: any) => c.name === "SOURCE")?.children?.[0]?.name
                  const dstLoc = astNode?.children?.find((c: any) => c.name === "DESTINATION")?.children?.[0]?.name

                  const isTransfer = cmdType === "TRANSFER"
                  const isAdd = cmdType === "ADD"
                  const isRemove = cmdType === "REMOVE"
                  const isCheck = cmdType === "CHECK"

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      {/* BEFORE STATE */}
                      <div className="bg-[#161b22] border-2 border-cyan-500/50 rounded-2xl p-5 space-y-2">
                        <div className="flex justify-between items-center border-b border-[#21262d] pb-2">
                          <span className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                            <Database className="h-4 w-4" /> {isTransfer ? (srcLoc || "SOURCE") : (loc || "WAREHOUSE")}
                          </span>
                          <Badge variant="outline" className="text-xs border-cyan-500/40 text-cyan-300">BEFORE</Badge>
                        </div>
                        <div className="space-y-1 font-mono text-xs text-slate-300">
                          <div>Item: <strong className="text-white">{item}</strong></div>
                          {!isCheck && <div>Quantity: <strong className="text-cyan-400">{qty} units</strong></div>}
                          <div>Operation: <strong className="text-amber-400">{cmdType}</strong></div>
                        </div>
                      </div>

                      {/* EXECUTION ENGINE */}
                      <div className="flex flex-col items-center justify-center p-4 bg-[#161b22] border border-[#30363d] rounded-2xl space-y-2">
                        <div className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                          <Zap className="h-4 w-4" /> EXECUTION ENGINE
                        </div>
                        <div className="w-full h-3 bg-[#0d1117] rounded-full overflow-hidden border border-[#30363d]">
                          <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 rounded-full w-full animate-pulse" />
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 text-center">
                          {exec.message || `${cmdType} operation committed`}
                        </div>
                      </div>

                      {/* AFTER STATE */}
                      <div className="bg-[#161b22] border-2 border-emerald-500/50 rounded-2xl p-5 space-y-2">
                        <div className="flex justify-between items-center border-b border-[#21262d] pb-2">
                          <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                            <Database className="h-4 w-4" /> {isTransfer ? (dstLoc || "DEST") : (loc || "WAREHOUSE")}
                          </span>
                          <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-300">AFTER</Badge>
                        </div>
                        <div className="space-y-1 font-mono text-xs text-slate-300">
                          <div>Item: <strong className="text-white">{item}</strong></div>
                          {!isCheck && <div>Quantity: <strong className="text-emerald-400">{qty} units {isAdd ? "added" : isRemove ? "removed" : "transferred"}</strong></div>}
                          <div>Status: <span className="text-emerald-400 font-bold">✓ {exec.status?.toUpperCase()}</span></div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* ── STEP-BY-STEP EXECUTION LOG (from real trace) ───────────── */}
          {activeRes?.execution_trace?.length > 0 && (
            <Card className="border-[#30363d] bg-[#161b22]">
              <CardHeader className="py-3 border-b border-[#21262d]">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" /> Step-by-Step Execution Log ({activeRes.execution_trace.length} steps)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-[#0d1117]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {activeRes.execution_trace.map((step: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-xl border font-mono transition-all ${
                      step.status === "success" || step.status === "completed"
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                        : step.status === "skipped" || step.status === "ready"
                        ? "bg-blue-950/40 border-blue-500/40 text-blue-300"
                        : step.status === "error"
                        ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                        : "bg-[#161b22] border-[#21262d] text-slate-400"
                    }`}>
                      <div className="text-[10px] font-bold uppercase opacity-75">Step {step.step_number}</div>
                      <div className="text-xs font-bold truncate mt-0.5">{step.stage}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{step.description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── SEMANTIC VALIDATION CHECKLIST ──────────────────────────── */}
          {activeRes?.semantic_analysis?.checks?.length > 0 && (
            <Card className="border-[#30363d] bg-[#161b22]">
              <CardHeader className="py-3 border-b border-[#21262d]">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Semantic Validation Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-[#0d1117] space-y-2 font-mono text-xs">
                {activeRes.semantic_analysis.checks.map((chk: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        {chk.rule}
                      </span>
                      <span className="text-slate-200">{chk.description}</span>
                    </div>
                    <Badge variant="outline" className={chk.passed
                      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 font-bold text-[10px]"
                      : "text-rose-400 border-rose-500/40 bg-rose-500/10 font-bold text-[10px]"
                    }>
                      {chk.passed ? "✓ PASSED" : "✗ FAILED"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )

  // ── Recursive AST tree renderer (uses REAL backend ast.tree data) ────────
  function renderASTNode(node: any): JSX.Element | null {
    if (!node) return null
    const isRoot = node.name === activeRes?.ast?.tree?.name
    const isTerminal = !node.children || node.children.length === 0
    const nodeStyle = isRoot
      ? "bg-purple-950/80 border-purple-500/60 text-purple-300 shadow-purple-500/20"
      : isTerminal
      ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-emerald-500/20"
      : "bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-cyan-500/20"

    return (
      <div className="flex flex-col items-center">
        <div className={`px-3 py-2 rounded-xl border-2 font-mono text-xs font-bold shadow-lg ${nodeStyle}`}>
          <span>{node.name}</span>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center mt-1">
            <div className="w-0.5 h-3 bg-slate-700" />
            <div className="flex gap-4 items-start border-t-2 border-slate-700 pt-2">
              {node.children.map((child: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-slate-700" />
                  {renderASTNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
}

