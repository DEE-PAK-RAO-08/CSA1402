import { useState, useEffect } from "react"
import { api } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, PieChart, Activity, AlertTriangle, ShieldCheck, Warehouse as WarehouseIcon, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RePie, Pie } from "recharts"

export default function Reports() {
  const [summary, setSummary] = useState<any>(null)
  const [dailyData, setDailyData] = useState<any[]>([])
  const [errorReport, setErrorReport] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [sum, daily, errors] = await Promise.all([
        api.getSummary(),
        api.getDailyReport(),
        api.getErrorReport()
      ])
      setSummary(sum)
      setDailyData(daily || [])
      setErrorReport(errors || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30">
              <BarChart3 className="h-6 w-6" />
            </div>
            Analytics & Operations Reports
          </h2>
          <p className="text-muted-foreground mt-1">Deep analytics on compiler pipeline performance, error diagnostics, and warehouse stock throughput.</p>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={loadData} variant="outline" className="border-slate-700 hover:bg-slate-800 gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={() => alert("Downloading PDF summary report...")} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 gap-2 shadow-lg shadow-purple-500/20">
            <Download className="h-4 w-4" /> Export Report (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card hover:-translate-y-1 transition-transform duration-200 border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Pipeline Runs</CardTitle>
            <Activity className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-400">{summary?.total_commands ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Full lexical & semantic passes</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:-translate-y-1 transition-transform duration-200 border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Successful Executions</CardTitle>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-400">{summary?.successful_commands ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Committed transactions</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:-translate-y-1 transition-transform duration-200 border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Compiler Errors</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-400">{summary?.failed_commands ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Caught by validation stages</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:-translate-y-1 transition-transform duration-200 border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Active Warehouses</CardTitle>
            <WarehouseIcon className="h-5 w-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-400">{summary?.total_warehouses ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Connected logistics nodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" /> Daily Execution Velocity
            </CardTitle>
            <CardDescription>Volume of command submissions grouped by date.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '8px' }} />
                <Bar dataKey="successful" fill="#3B82F6" name="Successful" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="#EF4444" name="Failed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-400" /> Error Stage Breakdown
            </CardTitle>
            <CardDescription>Distribution of errors across compiler stages.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie
                  data={errorReport.length ? errorReport : [
                    { stage: 'LEXICAL', count: summary?.lexical_errors || 1 },
                    { stage: 'SYNTAX', count: summary?.syntax_errors || 1 },
                    { stage: 'SEMANTIC', count: summary?.semantic_errors || 2 },
                    { stage: 'EXECUTION', count: summary?.execution_failures || 0 }
                  ]}
                  dataKey="count"
                  nameKey="stage"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {COLORS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '8px' }} />
              </RePie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
