import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight, Eye, EyeOff } from "lucide-react"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const result = await login({ username, password })
    if (!result.success) {
      setError(result.error || "Incorrect username or password.")
    }
    setIsLoading(false)
  }

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0d1117] overflow-hidden p-4">
      {/* Subtle ambient glows */}
      <div className="pointer-events-none absolute top-[-150px] left-[-100px] w-[520px] h-[520px] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-150px] right-[-80px] w-[460px] h-[460px] rounded-full bg-indigo-600/10 blur-[100px]" />

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-6 animate-slide-up">
        {/* Logo & Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-sm opacity-60" />
              <div className="relative bg-[#161b22] border border-[#30363d] rounded-xl p-3.5">
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to WICL</h1>
            <p className="text-sm text-[#8b949e] mt-1">Warehouse Inventory Command Language Platform</p>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#e6edf3]">Username</label>
              <Input
                type="text"
                placeholder=""
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] h-11 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 placeholder:text-[#484f58] transition-all duration-200 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#e6edf3]">Password</label>
                <button
                  type="button"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  onClick={() => {}}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] h-11 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 pr-10 transition-all duration-200 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#8b949e] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-sm text-white shadow-lg shadow-blue-500/20 shiny-button transition-all duration-300 mt-1"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Sign up link box */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl px-6 py-4 text-center">
          <p className="text-sm text-[#8b949e]">
            New to WICL?{" "}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-[#484f58] font-mono">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Compiler Engine Active
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            4-Stage Pipeline
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Semantic Analysis
          </span>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#30363d]">
          © 2026 WICL Engine — Compiler-Based Warehouse Management System
        </p>
      </div>
    </div>
  )
}
