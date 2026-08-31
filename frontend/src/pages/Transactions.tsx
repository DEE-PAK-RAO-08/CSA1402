import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "@/services/api"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Transaction } from "@/types"
import { ArrowRight, ArrowDown, ArrowUp, RefreshCw, CheckCircle2, XCircle, Activity, Search } from "lucide-react"

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const data = await api.getTransactions()
      setTransactions(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const filtered = transactions.filter(
    (t) =>
      t.item_code.toLowerCase().includes(search.toLowerCase()) ||
      t.transaction_type.toLowerCase().includes(search.toLowerCase()) ||
      t.username.toLowerCase().includes(search.toLowerCase())
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ADD": return <ArrowDown className="h-4 w-4 text-emerald-400" />
      case "REMOVE": return <ArrowUp className="h-4 w-4 text-rose-400" />
      case "TRANSFER": return <ArrowRight className="h-4 w-4 text-blue-400" />
      default: return <RefreshCw className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
              <Activity className="h-6 w-6" />
            </div>
            Immutable Transaction Ledger
          </h2>
          <p className="text-muted-foreground mt-1">Audit log of committed stock movements, transfers, additions, and removals.</p>
        </div>

        <Button onClick={loadTransactions} disabled={loading} className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Ledger
        </Button>
      </div>

      <Card className="glass-card border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by SKU, transaction type, user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950/50 border-slate-800 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Total Ledger Rows: <strong className="text-foreground">{transactions.length}</strong>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900/60">
              <TableRow className="border-slate-800">
                <TableHead className="w-24">TXN ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item Code</TableHead>
                <TableHead>Movement Route</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Loading transaction ledger...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No transaction entries found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((txn) => (
                  <TableRow key={txn.id} className="border-slate-800/60 hover:bg-emerald-500/5 transition-colors">
                    <TableCell className="font-mono text-xs text-slate-400 font-semibold">TXN-{txn.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-mono text-xs font-bold">
                        {getTypeIcon(txn.transaction_type)}
                        <span>{txn.transaction_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm font-bold text-emerald-300">{txn.item_code}</div>
                    </TableCell>
                    <TableCell>
                      {txn.transaction_type === "TRANSFER" ? (
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Badge variant="outline" className="border-slate-700 bg-slate-900">{txn.source_warehouse_code}</Badge>
                          <ArrowRight className="h-3 w-3 text-emerald-400 shrink-0" />
                          <Badge variant="outline" className="border-slate-700 bg-slate-900">{txn.destination_warehouse_code}</Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-slate-700 bg-slate-900 font-mono text-xs">
                          {txn.destination_warehouse_code || txn.source_warehouse_code}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-foreground">
                      {txn.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">{txn.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {txn.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {txn.created_at ? new Date(txn.created_at).toLocaleString() : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
