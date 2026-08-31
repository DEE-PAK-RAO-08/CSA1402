const API_URL = "http://localhost:8000/api"

const getHeaders = () => {
  const token = localStorage.getItem("token")
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const api = {
  // Auth
  login: async (credentials: any) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "Login failed")
    }
    return res.json()
  },

  register: async (data: { username: string; password: string }) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "Registration failed")
    }
    return res.json()
  },
  
  me: async () => {
    const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() })
    if (!res.ok) throw new Error("Failed to fetch user")
    return res.json()
  },

  // Commands
  analyzeCommand: async (command: string, execute: boolean = false) => {
    const res = await fetch(`${API_URL}/commands/analyze`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ command, execute }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "Analysis failed")
    }
    return res.json()
  },

  getCommands: async (skip = 0, limit = 50) => {
    const res = await fetch(`${API_URL}/commands/?skip=${skip}&limit=${limit}`, { headers: getHeaders() })
    if (!res.ok) return []
    return res.json()
  },

  getCommand: async (id: number) => {
    const res = await fetch(`${API_URL}/commands/${id}`, { headers: getHeaders() })
    if (!res.ok) throw new Error("Command not found")
    return res.json()
  },

  // Inventory & Items
  getInventory: async () => {
    const res = await fetch(`${API_URL}/inventory/`, { headers: getHeaders() })
    if (!res.ok) return []
    return res.json()
  },

  getItems: async () => {
    const res = await fetch(`${API_URL}/items/`, { headers: getHeaders() })
    if (!res.ok) return []
    return res.json()
  },

  // Transactions
  getTransactions: async () => {
    const res = await fetch(`${API_URL}/transactions/`, { headers: getHeaders() })
    if (!res.ok) return []
    return res.json()
  },

  // Warehouses
  getWarehouses: async () => {
    const res = await fetch(`${API_URL}/warehouses/`, { headers: getHeaders() })
    if (!res.ok) return []
    return res.json()
  },

  getWarehouse: async (id: number) => {
    const res = await fetch(`${API_URL}/warehouses/${id}`, { headers: getHeaders() })
    if (!res.ok) throw new Error("Warehouse not found")
    return res.json()
  },

  createWarehouse: async (data: { warehouse_code: string; name: string; location: string; capacity: number }) => {
    const res = await fetch(`${API_URL}/warehouses/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "Failed to create warehouse")
    }
    return res.json()
  },

  getWarehouseInventory: async (warehouseId: number) => {
    const res = await fetch(`${API_URL}/inventory/?warehouse_id=${warehouseId}`, { headers: getHeaders() })
    if (!res.ok) return []
    return res.json()
  },

  // Reports & Stats
  getCompilerStats: async () => {
    const res = await fetch(`${API_URL}/commands/stats/performance`, { headers: getHeaders() })
    if (!res.ok) return null
    return res.json()
  },

  getSummary: async () => {
    const res = await fetch(`${API_URL}/reports/summary`, { headers: getHeaders() })
    if (!res.ok) return null
    return res.json()
  },
  
  getDailyReport: async () => {
    const res = await fetch(`${API_URL}/reports/daily`, { headers: getHeaders() })
    if (!res.ok) return []
    return res.json()
  },

  getErrorReport: async () => {
    const res = await fetch(`${API_URL}/reports/errors`, { headers: getHeaders() })
    if (!res.ok) return []
    return res.json()
  },

  getTransactionReport: async () => {
    const res = await fetch(`${API_URL}/reports/transactions`, { headers: getHeaders() })
    if (!res.ok) return []
    return res.json()
  },

  // Users
  getUsers: async () => {
    const res = await fetch(`${API_URL}/users/`, { headers: getHeaders() })
    if (!res.ok) return []
    return res.json()
  },

  updateUser: async (userId: number, data: { role?: string; is_active?: number; warehouse_id?: number }) => {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "Failed to update user")
    }
    return res.json()
  },
}
