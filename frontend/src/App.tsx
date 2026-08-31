import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import Layout from "@/components/layout/Layout"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import Dashboard from "@/pages/Dashboard"
import CommandProcessor from "@/pages/CommandProcessor"
import Inventory from "@/pages/Inventory"
import Transactions from "@/pages/Transactions"
import History from "@/pages/History"
import Reports from "@/pages/Reports"
import Warehouses from "@/pages/Warehouses"
import Settings from "@/pages/Settings"

import CompilerStats from "@/pages/CompilerStats"


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <span className="text-sm font-medium tracking-wide">Initializing WICL Platform...</span>
        </div>
      </div>
    )
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="commands" element={<CommandProcessor />} />

          <Route path="compiler-stats" element={<CompilerStats />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="history" element={<History />} />
          <Route path="reports" element={<Reports />} />
          <Route path="warehouses" element={<Warehouses />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
