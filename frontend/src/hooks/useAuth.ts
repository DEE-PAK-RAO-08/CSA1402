import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { User } from "@/types"
import { api } from "@/services/api"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setLoading(false)
        if (location.pathname !== "/login" && location.pathname !== "/register") {
          navigate("/login")
        }
        return
      }

      try {
        const userData = await api.me()
        setUser(userData)
        if (location.pathname === "/login" || location.pathname === "/register") {
          navigate("/")
        }
      } catch (err) {
        console.error("Auth init error:", err)
        localStorage.removeItem("token")
        setUser(null)
        navigate("/login")
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [navigate, location.pathname])

  const login = async (credentials: any) => {
    try {
      const data = await api.login(credentials)
      localStorage.setItem("token", data.access_token)
      setUser(data.user)
      navigate("/")
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const storeToken = (token: string, userData: any) => {
    localStorage.setItem("token", token)
    setUser(userData)
    navigate("/")
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    navigate("/login")
  }

  return { user, loading, login, logout, storeToken, isAuthenticated: !!user }
}
