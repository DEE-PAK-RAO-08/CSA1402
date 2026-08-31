import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "@/services/api"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InventoryItem } from "@/types"
import { Package, MapPin, Database, RefreshCw, Search, Layers } from "lucide-react"

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const loadInventory = async () => {
    setLoading(true)
    try {
      const data = await api.getInventory()
      setItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const filteredItems = items.filter(
    (i) =>
      i.item_code.toLowerCase().includes(search.toLowerCase()) ||
      i.item_name.toLowerCase().includes(search.toLowerCase()) ||
      i.warehouse_code.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock": return <Badge variant="success">In Stock</Badge>
      case "low_stock": return <Badge variant="warning">Low Stock</Badge>
      case "out_of_stock": return <Badge variant="destructive">Out of Stock</Badge>
      case "over_capacity": return <Badge variant="destructive">Over Capacity</Badge>
      default: return <Badge variant="outline">{status}</Badge>
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
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30">
              <Package className="h-6 w-6" />
            </div>
            Global Inventory Ledger
          </h2>
          <p className="text-muted-foreground mt-1">Real-time inventory levels, warehouse assignments, and stock status indicators.</p>
        </div>

        <Button onClick={loadInventory} disabled={loading} className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Inventory
        </Button>
      </div>

      <Card className="glass-card border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by SKU item code, name, warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950/50 border-slate-800 focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Total Inventory Records: <strong className="text-foreground">{items.length}</strong>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900/60">
              <TableRow className="border-slate-800">
                <TableHead>SKU / Item Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Warehouse Location</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Node Capacity</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-400" />
                    Loading inventory records...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No inventory records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-slate-800/60 hover:bg-purple-500/5 transition-colors">
                    <TableCell className="font-mono text-sm text-purple-300 font-bold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-400" />
                      {item.item_code}
                    </TableCell>
                    <TableCell className="font-medium text-slate-200">{item.item_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="font-mono text-xs font-bold text-cyan-300">{item.warehouse_code}</span>
                        <span className="text-xs text-muted-foreground">({item.warehouse_name})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground text-sm">
                      {item.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {item.warehouse_capacity?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{getStatusBadge(item.stock_status)}</TableCell>
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
