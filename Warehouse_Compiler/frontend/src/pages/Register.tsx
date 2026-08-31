import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "@/services/api"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight, Eye, EyeOff, CheckCircle2, Info } from "lucide-react"

export default function Register() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { storeToken } = useAuth()

  const passwordStrength = (): { label: string; color: string; width: string } => {
    const len = password.length
    if (len === 0) return { label: "", color: "bg-[#21262d]", width: "0%" }
    if (len < 6) return { label: "Too short", color: "bg-red-500", width: "25%" }
    if (len < 8) return { label: "Weak", color: "bg-amber-500", width: "45%" }
    if (len < 12) return { label: "Fair", color: "bg-yellow-400", width: "65%" }
    return { label: "Strong", color: "bg-emerald-500", width: "100%" }
  }

  const strength = passwordStrength()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      setError("Username must be 3–32 characters: letters, numbers, or underscores only.")
      return
    }

    setIsLoading(true)
    try {
      const data = await api.register({ username, password })
      localStorage.setItem("token", data.access_token)
      storeToken(data.access_token, data.user)
      navigate("/")
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0d1117] overflow-hidden p-4">
      {/* Ambient blobs */}
      <div className="bg-blob-1 top-0 left-0" />
      <div className="bg-blob-2 bottom-0 right-0" />
      {/* Grid overlay */}
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="text-sm text-[#8b949e] mt-1">Join the WICL Warehouse Platform</p>
          </div>
        </div>

        {/* Register Box */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 flex items-start gap-2">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#e6edf3]">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                placeholder="e.g. john_doe"
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] h-11 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 placeholder:text-[#484f58] font-mono text-sm transition-all"
              />
              <p className="text-[11px] text-[#484f58] flex items-center gap-1 ml-0.5">
                <Info className="h-3 w-3" /> 3–32 characters. Letters, numbers, underscores only.
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#e6edf3]">Password</label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] h-11 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 pr-10 placeholder:text-[#484f58] font-mono text-sm transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[#8b949e] transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength Meter */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1 w-full rounded-full bg-[#21262d] overflow-hidden">
                    <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
                  </div>
                  <span className={`text-[11px] font-medium ${strength.color.replace("bg-", "text-")}`}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#e6edf3]">Confirm password</label>
              <div className="relative">
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] h-11 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 pr-10 placeholder:text-[#484f58] font-mono text-sm transition-all"
                />
                {confirmPassword.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {password === confirmPassword
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      : <span className="h-4 w-4 text-red-400 font-bold text-xs flex items-center">✕</span>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Account notice */}
            <div className="bg-[#0d1117] border border-[#21262d] rounded-lg px-3.5 py-3 text-xs text-[#8b949e] flex items-start gap-2">
              <Info className="h-3.5 w-3.5 mt-0.5 text-blue-400 shrink-0" />
              <span>New accounts are granted <strong className="text-[#e6edf3]">Viewer</strong> access. Contact an administrator to request operator or admin privileges.</span>
            </div>

            <Button
              className="w-full h-11 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-semibold text-sm text-white shadow-lg shadow-emerald-500/20 shiny-button transition-all duration-300 mt-1"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create account <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Link to Login */}
          <div className="px-6 py-4 bg-[#0d1117] border-t border-[#21262d] text-center">
            <p className="text-sm text-[#8b949e]">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#30363d]">
          © 2026 WICL Engine — Compiler-Based Warehouse Management System
        </p>
      </div>
    </div>
  )
}
