import { useState, useEffect } from "react"
import { api } from "@/services/api"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { History as HistoryIcon, Search, RefreshCw, Terminal, CheckCircle2, Eye } from "lucide-react"

export default function History() {
  const [commands, setCommands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCommand, setSelectedCommand] = useState<any | null>(null)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await api.getCommands(0, 100)
      setCommands(data)
    } catch (err) {
      console.error("Failed to load history", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const filteredCommands = commands.filter((cmd) =>
    cmd.raw_command.toLowerCase().includes(search.toLowerCase()) ||
    cmd.username.toLowerCase().includes(search.toLowerCase()) ||
    (cmd.command_type && cmd.command_type.toLowerCase().includes(search.toLowerCase()))
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>
      case "lexical_error":
        return <Badge variant="destructive">Lexical Error</Badge>
      case "syntax_error":
        return <Badge variant="destructive">Syntax Error</Badge>
      case "semantic_error":
        return <Badge variant="warning">Semantic Error</Badge>
      case "execution_error":
        return <Badge variant="destructive">Execution Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
              <HistoryIcon className="h-6 w-6" />
            </div>
            Command Audit History
          </h2>
          <p className="text-muted-foreground mt-1">Complete immutable audit trail of all compiler commands submitted to the platform.</p>
        </div>
        <Button onClick={loadHistory} disabled={loading} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Audit Log
        </Button>
      </div>

      {/* Filter & Search */}
      <Card className="glass-card border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commands, users, or types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950/50 border-slate-800 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>Total Records: <strong className="text-foreground">{commands.length}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="glass-card border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900/60">
              <TableRow className="border-slate-800">
                <TableHead className="w-16">ID</TableHead>
                <TableHead>WICL Command</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Overall Pipeline Status</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading command audit trail...
                  </TableCell>
                </TableRow>
              ) : filteredCommands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No matching command history found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommands.map((cmd) => (
                  <TableRow key={cmd.id} className="border-slate-800/60 hover:bg-blue-500/5 transition-colors">
                    <TableCell className="font-mono text-xs text-slate-400">#{cmd.id}</TableCell>
                    <TableCell className="font-mono text-sm text-blue-300 max-w-md truncate">
                      {cmd.raw_command}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-700 font-mono text-xs">
                        {cmd.command_type || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{cmd.username}</TableCell>
                    <TableCell>{getStatusBadge(cmd.overall_status)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {cmd.created_at ? new Date(cmd.created_at).toLocaleString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const full = await api.getCommand(cmd.id)
                          setSelectedCommand(full)
                        }}
                        className="h-8 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <Eye className="h-4 w-4 mr-1" /> Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedCommand && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Terminal className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-lg">Command #{selectedCommand.id} Details</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedCommand(null)}>✕</Button>
            </div>

            <div className="space-y-4 font-mono text-sm">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-blue-300">
                {selectedCommand.raw_command}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-muted-foreground block">Lexical Stage</span>
                  <span className="font-bold text-emerald-400 uppercase">{selectedCommand.lexical_status}</span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-muted-foreground block">Syntax Stage</span>
                  <span className="font-bold text-emerald-400 uppercase">{selectedCommand.syntax_status}</span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-muted-foreground block">Semantic Stage</span>
                  <span className="font-bold text-emerald-400 uppercase">{selectedCommand.semantic_status}</span>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-muted-foreground block">Execution Stage</span>
                  <span className="font-bold text-emerald-400 uppercase">{selectedCommand.execution_status}</span>
                </div>
              </div>

              {selectedCommand.errors && selectedCommand.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-xs text-red-400 space-y-1">
                  <span className="font-bold block mb-1">Pipeline Errors Detected:</span>
                  {selectedCommand.errors.map((e: any, i: number) => (
                    <div key={i}>[{e.error_stage}] Code {e.error_code}: {e.message}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button onClick={() => setSelectedCommand(null)} className="bg-slate-800 hover:bg-slate-700">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
