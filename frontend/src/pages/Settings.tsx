import { useState, useEffect } from "react"
import { api } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { Settings as SettingsIcon, Users, Cpu, Shield, Check, RefreshCw, Lock, Unlock, Ban } from "lucide-react"

export default function Settings() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [strictSemantics, setStrictSemantics] = useState(true)
  const [autoRollback, setAutoRollback] = useState(true)
  const [saved, setSaved] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleToggleStatus = async (targetUser: any) => {
    if (targetUser.username === currentUser?.username) {
      alert("Security Constraint: You cannot restrict your own admin account.")
      return
    }
    const newStatus = targetUser.is_active === 1 ? 0 : 1
    setTogglingId(targetUser.id)
    try {
      await api.updateUser(targetUser.id, { is_active: newStatus })
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, is_active: newStatus } : u))
    } catch (err: any) {
      alert(err.message || "Failed to update user access status")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-500 text-white shadow-lg">
              <SettingsIcon className="h-6 w-6" />
            </div>
            System & Engine Configuration
          </h2>
          <p className="text-muted-foreground mt-1">Configure WICL compiler execution flags, security rules, and user role access levels.</p>
        </div>

        <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 gap-2 shadow-lg shadow-blue-500/20">
          {saved ? <Check className="h-4 w-4 text-emerald-400" /> : null}
          {saved ? "Settings Saved!" : "Save Engine Config"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compiler Flags */}
        <Card className="glass-card border-slate-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-400" /> Compiler Runtime Parameters
            </CardTitle>
            <CardDescription>Customize pipeline validation strictness.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <label className="text-sm font-semibold block text-foreground">Strict Semantic Rule Engine</label>
                <span className="text-xs text-muted-foreground">Enforce all 10 real-world inventory constraints</span>
              </div>
              <input
                type="checkbox"
                checked={strictSemantics}
                onChange={(e) => setStrictSemantics(e.target.checked)}
                className="h-5 w-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <label className="text-sm font-semibold block text-foreground">Automatic Transaction Rollback</label>
                <span className="text-xs text-muted-foreground">Rollback DB changes on any stage failure</span>
              </div>
              <input
                type="checkbox"
                checked={autoRollback}
                onChange={(e) => setAutoRollback(e.target.checked)}
                className="h-5 w-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
              <span className="font-bold block flex items-center gap-1">
                <Shield className="h-4 w-4 text-blue-400" /> Security Note:
              </span>
              Viewer role accounts are restricted to dry-run analysis and cannot commit database transactions.
            </div>
          </CardContent>
        </Card>

        {/* User Management Table */}
        <Card className="glass-card border-slate-800 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" /> Platform Accounts & Roles
              </CardTitle>
              <CardDescription>Authorized users registered in the system authentication directory.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={loadUsers} className="border-slate-800 gap-1.5 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-900/60">
                <TableRow className="border-slate-800">
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Admin Access Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Loading user accounts...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isActive = u.is_active === 1
                    const isSelf = u.username === currentUser?.username
                    return (
                      <TableRow key={u.id} className="border-slate-800/60 hover:bg-slate-900/30 transition-colors">
                        <TableCell className="font-semibold text-white flex items-center gap-2">
                          {u.username}
                          {isSelf && (
                            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 font-mono">
                              (YOU)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              u.role === "admin" ? "border-purple-500/40 text-purple-300 bg-purple-500/10 font-bold" :
                              u.role === "operator" ? "border-blue-500/40 text-blue-300 bg-blue-500/10 font-bold" :
                              "border-slate-700 text-slate-400 font-bold"
                            }
                          >
                            {u.role.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {u.warehouse_code || "ALL WAREHOUSES"}
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                              RESTRICTED
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isSelf ? (
                            <span className="text-xs text-slate-500 font-mono italic">Primary Admin</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={togglingId === u.id}
                              onClick={() => handleToggleStatus(u)}
                              className={
                                isActive
                                  ? "border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs h-8 gap-1.5"
                                  : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 text-xs h-8 gap-1.5"
                              }
                            >
                              {togglingId === u.id ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              ) : isActive ? (
                                <>
                                  <Ban className="h-3.5 w-3.5" /> Block / Restrict
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-3.5 w-3.5" /> Restore Access
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
