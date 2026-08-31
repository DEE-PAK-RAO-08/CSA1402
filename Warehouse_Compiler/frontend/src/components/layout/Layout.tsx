import { Outlet, Link, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { 
  Terminal, LayoutDashboard, Package, 
  Warehouse, History, Activity, 
  LogOut, Settings, BarChart3, Cpu, Code2,
  Layers, ShieldCheck, Zap, GitFork
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Command Processor", path: "/commands", icon: Terminal },
    { name: "Compiler Stats", path: "/compiler-stats", icon: Activity },
    { name: "Inventory", path: "/inventory", icon: Package },
    { name: "Transactions", path: "/transactions", icon: Activity },
    { name: "History", path: "/history", icon: History },
    { name: "Reports", path: "/reports", icon: BarChart3 },
    { name: "Warehouses", path: "/warehouses", icon: Warehouse },
    { name: "Settings", path: "/settings", icon: Settings },
  ]

  const initials = user?.username?.substring(0, 2).toUpperCase() || "WH"

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d1117] text-[#e6edf3]">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-[#21262d] bg-[#161b22] z-20">
        {/* Brand */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[#21262d]">
          {/* Custom WICL SVG Logo */}
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-[#0d1117] to-[#161b22] border border-cyan-500/30 shadow-lg shadow-cyan-500/10 shrink-0">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4 L5.5 16 L11 8 L16.5 16 L20 4" stroke="url(#wicl-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="2" cy="4" r="1.5" fill="#22d3ee"/>
              <circle cx="20" cy="4" r="1.5" fill="#3b82f6"/>
              <circle cx="11" cy="8" r="1.5" fill="#22d3ee" opacity="0.8"/>
              <circle cx="5.5" cy="16" r="1.5" fill="#3b82f6" opacity="0.7"/>
              <circle cx="16.5" cy="16" r="1.5" fill="#3b82f6" opacity="0.7"/>
              <defs>
                <linearGradient id="wicl-grad" x1="2" y1="4" x2="20" y2="16" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22d3ee"/>
                  <stop offset="100%" stopColor="#3b82f6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">WICL</span>
            <div className="text-[10px] text-[#484f58] font-mono tracking-widest uppercase mt-0.5">v1.0 · Compiler</div>
          </div>
        </div>

        {/* Standard Clean Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-[#484f58] mb-1">Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link key={item.name} to={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group",
                    isActive
                      ? "bg-[#388bfd1a] text-blue-400 border border-[#388bfd30]"
                      : "text-[#8b949e] hover:bg-[#ffffff08] hover:text-[#e6edf3]"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-blue-400" : "text-[#484f58] group-hover:text-[#8b949e]")} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Engine Pipeline Status */}
        <div className="mx-3 mb-3 p-3 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#484f58]">Engine Status</div>
          <div className="space-y-1.5">
            {["Lexer", "Parser", "Semantic", "Executor"].map((stage) => (
              <div key={stage} className="flex items-center justify-between text-[10px]">
                <span className="text-[#484f58] font-mono">{stage}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-[#21262d]">
          <div className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-[#ffffff08] transition-colors group">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {initials}
              </div>
              <div className="truncate">
                <div className="text-sm font-semibold text-[#e6edf3] truncate">{user?.username}</div>
                <div className="text-[10px] text-[#484f58] font-mono capitalize">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 text-[#484f58] hover:text-red-400 transition-colors rounded-md hover:bg-red-500/10 shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header strip */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-[#21262d] bg-[#161b22]/60 backdrop-blur shrink-0">
          <div className="text-sm text-[#8b949e] font-mono">
            {navItems.find(n => n.path === location.pathname)?.name || "Dashboard"}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              API Connected · localhost:8000
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0d1117]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

