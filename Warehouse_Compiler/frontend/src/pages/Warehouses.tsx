import { useState, useEffect } from "react"
import { api } from "@/services/api"
import {
  Warehouse, MapPin, Database, Server, RefreshCw, Plus, ArrowUpRight,
  X, Package, ArrowRightLeft, Clock, AlertCircle, CheckCircle2, Loader2,
  BarChart3, Boxes, Activity
} from "lucide-react"

// ─── Provision Modal ──────────────────────────────────────────────────────────
function ProvisionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ warehouse_code: "", name: "", location: "", capacity: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.warehouse_code || !form.name || !form.location || !form.capacity) {
      setError("All fields are required.")
      return
    }
    if (isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) {
      setError("Capacity must be a positive number.")
      return
    }
    setSaving(true)
    try {
      await api.createWarehouse({
        warehouse_code: form.warehouse_code.toUpperCase(),
        name: form.name,
        location: form.location,
        capacity: Number(form.capacity),
      })
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create warehouse")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md mx-4 shadow-2xl shadow-cyan-500/10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#21262d]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Warehouse className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Provision Warehouse</h3>
              <p className="text-xs text-[#8b949e]">Register a new storage node to the network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[#8b949e] font-medium uppercase tracking-wider">
                Warehouse Code <span className="text-red-400">*</span>
              </label>
              <input
                name="warehouse_code"
                value={form.warehouse_code}
                onChange={handle}
                placeholder="e.g. WH05"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder-[#484f58] focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all uppercase"
                maxLength={10}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#8b949e] font-medium uppercase tracking-wider">
                Capacity (units) <span className="text-red-400">*</span>
              </label>
              <input
                name="capacity"
                value={form.capacity}
                onChange={handle}
                type="number"
                placeholder="e.g. 10000"
                min={1}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#484f58] focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8b949e] font-medium uppercase tracking-wider">
              Warehouse Name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handle}
              placeholder="e.g. Mumbai Central Warehouse"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#484f58] focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[#8b949e] font-medium uppercase tracking-wider">
              Location <span className="text-red-400">*</span>
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handle}
              placeholder="e.g. Mumbai, Maharashtra"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#484f58] focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#30363d] rounded-lg text-sm text-[#8b949e] hover:bg-[#21262d] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 rounded-lg text-sm text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Provisioning…" : "Provision Node"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Inspect Node Panel ───────────────────────────────────────────────────────
function InspectPanel({ wh, onClose }: { wh: any; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getWarehouse(wh.id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [wh.id])

  const util = wh.utilization_pct || 0
  const barColor =
    util > 90 ? "from-red-500 to-rose-600" :
    util > 75 ? "from-amber-500 to-orange-500" :
    "from-cyan-500 to-blue-500"

  const txnTypeColor: Record<string, string> = {
    ADD: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    REMOVE: "text-red-400 bg-red-500/10 border-red-500/20",
    TRANSFER: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    UPDATE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    CHECK: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[#0d1117] border-l border-[#21262d] h-full overflow-y-auto flex flex-col shadow-2xl shadow-black/50 animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-[#0d1117] border-b border-[#21262d]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/30">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {wh.warehouse_code}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                  Active Node
                </span>
              </div>
              <h3 className="font-bold text-white text-lg mt-0.5">{wh.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 space-y-5">
          {/* Location */}
          <div className="flex items-center gap-2 text-[#8b949e] text-sm">
            <MapPin className="h-4 w-4 text-cyan-400" />
            {wh.location}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Capacity", value: wh.capacity?.toLocaleString(), icon: <Database className="h-4 w-4" />, color: "text-blue-400" },
              { label: "Current Stock", value: wh.current_stock?.toLocaleString(), icon: <Boxes className="h-4 w-4" />, color: "text-cyan-400" },
              { label: "Utilization", value: `${util}%`, icon: <BarChart3 className="h-4 w-4" />, color: util > 75 ? "text-amber-400" : "text-emerald-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#161b22] border border-[#21262d] rounded-xl p-3 flex flex-col gap-1">
                <div className={`${s.color}`}>{s.icon}</div>
                <div className="text-white font-bold text-lg font-mono">{s.value}</div>
                <div className="text-[#8b949e] text-[11px]">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Capacity Bar */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs text-[#8b949e]">
              <span>Capacity Utilization</span>
              <span className="font-mono text-white">{util}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-[#0d1117] overflow-hidden border border-[#30363d]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                style={{ width: `${Math.min(util, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#484f58]">
              <span>0 units</span>
              <span>{wh.capacity?.toLocaleString()} units</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#8b949e] gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              Loading node data…
            </div>
          ) : detail ? (
            <>
              {/* Inventory Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Package className="h-4 w-4 text-emerald-400" />
                  Stored Items ({detail.item_count || 0})
                </div>
                {detail.inventory?.length > 0 ? (
                  <div className="bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#21262d] text-[#8b949e]">
                          <th className="text-left p-3 font-medium">Item Code</th>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-right p-3 font-medium">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.inventory.map((inv: any, i: number) => (
                          <tr key={i} className="border-b border-[#21262d]/50 hover:bg-[#0d1117] transition-colors">
                            <td className="p-3 font-mono text-cyan-400">{inv.item_code}</td>
                            <td className="p-3 text-[#c9d1d9]">{inv.item_name}</td>
                            <td className="p-3 text-right font-mono text-white">{inv.quantity?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 text-center text-[#484f58] text-sm">
                    No inventory stored in this warehouse.
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Activity className="h-4 w-4 text-blue-400" />
                  Recent Activity
                </div>
                {detail.recent_transactions?.length > 0 ? (
                  <div className="space-y-1.5">
                    {detail.recent_transactions.map((t: any) => (
                      <div key={t.id} className="flex items-center gap-3 bg-[#161b22] border border-[#21262d] rounded-lg p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${txnTypeColor[t.type] || "text-slate-400 bg-slate-500/10 border-slate-500/20"}`}>
                          {t.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-[#c9d1d9] truncate">
                            <span className="font-mono text-cyan-400">{t.item_code}</span>
                            {t.item_name && <span className="text-[#8b949e]"> · {t.item_name}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono text-white">{t.quantity?.toLocaleString()} units</div>
                          <div className="text-[10px] text-[#484f58]">
                            {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 text-center text-[#484f58] text-sm">
                    No recent transactions found.
                  </div>
                )}
              </div>

              {/* Node Meta */}
              <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Node Metadata</div>
                {[
                  { label: "Node ID", value: `#${detail.id}` },
                  { label: "Status", value: detail.status?.toUpperCase() || "ACTIVE" },
                  { label: "Registered", value: detail.created_at ? new Date(detail.created_at).toLocaleString() : "—" },
                ].map(m => (
                  <div key={m.label} className="flex justify-between text-xs">
                    <span className="text-[#8b949e]">{m.label}</span>
                    <span className="font-mono text-[#c9d1d9]">{m.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Failed to load node details. Check backend connectivity.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showProvision, setShowProvision] = useState(false)
  const [inspectWh, setInspectWh] = useState<any>(null)

  const loadWarehouses = async () => {
    setLoading(true)
    try {
      const data = await api.getWarehouses()
      setWarehouses(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadWarehouses() }, [])

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/30">
                <Warehouse className="h-6 w-6" />
              </div>
              Logistics Warehouses
            </h2>
            <p className="text-[#8b949e] mt-1 text-sm">
              Manage physical storage facilities, monitor live capacity, and track location nodes.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadWarehouses}
              className="flex items-center gap-2 px-4 py-2 bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] rounded-lg text-sm text-[#c9d1d9] transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
              Refresh Nodes
            </button>
            <button
              onClick={() => setShowProvision(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-sm text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              Provision Warehouse
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {warehouses.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Nodes",
                value: warehouses.length,
                icon: <Server className="h-4 w-4 text-cyan-400" />,
              },
              {
                label: "Active Nodes",
                value: warehouses.filter(w => w.status === "active").length,
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
              },
              {
                label: "Total Capacity",
                value: warehouses.reduce((s, w) => s + (w.capacity || 0), 0).toLocaleString(),
                icon: <Database className="h-4 w-4 text-blue-400" />,
              },
              {
                label: "Total Stock",
                value: warehouses.reduce((s, w) => s + (w.current_stock || 0), 0).toLocaleString(),
                icon: <Boxes className="h-4 w-4 text-purple-400" />,
              },
            ].map(stat => (
              <div key={stat.label} className="bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0d1117]">{stat.icon}</div>
                <div>
                  <div className="text-white font-bold text-xl font-mono">{stat.value}</div>
                  <div className="text-[#8b949e] text-xs">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Warehouse Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-full h-48 flex items-center justify-center text-[#8b949e] bg-[#161b22] border border-[#21262d] rounded-2xl gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
              Loading warehouse infrastructure nodes…
            </div>
          ) : warehouses.length === 0 ? (
            <div className="col-span-full h-48 flex flex-col items-center justify-center text-[#8b949e] bg-[#161b22] border border-[#30363d] border-dashed rounded-2xl gap-3">
              <Warehouse className="h-8 w-8 text-[#30363d]" />
              <div className="text-sm">No warehouses registered in the network.</div>
              <button
                onClick={() => setShowProvision(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs text-white font-semibold transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Provision First Node
              </button>
            </div>
          ) : (
            warehouses.map((wh) => {
              const util = wh.utilization_pct || 0
              const barColor =
                util > 90 ? "from-red-500 to-rose-600" :
                util > 75 ? "from-amber-500 to-orange-500" :
                "from-cyan-500 to-blue-500"

              return (
                <div
                  key={wh.id}
                  className="relative group bg-[#161b22] border border-[#21262d] hover:border-[#30363d] rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5"
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Server className="h-24 w-24 text-cyan-400" />
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Top row */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
                        {wh.warehouse_code}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                        Active Node
                      </span>
                    </div>

                    {/* Name & Location */}
                    <div>
                      <h3 className="text-lg font-bold text-white">{wh.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#8b949e] mt-1">
                        <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        {wh.location}
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8b949e]">Capacity Utilization ({util}%)</span>
                        <span className="font-mono text-cyan-300">
                          {wh.current_stock?.toLocaleString()} / {wh.capacity?.toLocaleString()} units
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#0d1117] overflow-hidden border border-[#30363d]/50">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                          style={{ width: `${Math.min(util, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#21262d] text-xs">
                      <div className="flex items-center gap-2 text-[#8b949e]">
                        <Database className="h-3.5 w-3.5 text-[#484f58]" />
                        Max: <strong className="text-[#c9d1d9] font-mono">{wh.capacity?.toLocaleString()}</strong>
                        {wh.item_count !== undefined && (
                          <span className="text-[#484f58]">· {wh.item_count} item types</span>
                        )}
                      </div>
                      <button
                        onClick={() => setInspectWh(wh)}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-2 py-1 rounded-lg transition-colors font-medium"
                      >
                        Inspect Node
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modals */}
      {showProvision && (
        <ProvisionModal
          onClose={() => setShowProvision(false)}
          onCreated={loadWarehouses}
        />
      )}
      {inspectWh && (
        <InspectPanel
          wh={inspectWh}
          onClose={() => setInspectWh(null)}
        />
      )}
    </>
  )
}
