export interface User {
  id: number
  username: string
  role: "admin" | "operator" | "viewer"
  warehouse_id: number | null
}

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
}

export interface InventoryItem {
  id: number
  item_id: number
  item_code: string
  item_name: string
  warehouse_id: number
  warehouse_code: string
  warehouse_name: string
  quantity: number
  warehouse_capacity: number
  stock_status: string
  updated_at: string
}

export interface Transaction {
  id: number
  command_id: number | null
  user_id: number
  username: string
  item_code: string
  item_name: string
  source_warehouse_code: string | null
  destination_warehouse_code: string | null
  quantity: number
  transaction_type: string
  status: string
  created_at: string
}

export interface CommandHistory {
  id: number
  user_id: number
  username: string
  raw_command: string
  command_type: string | null
  lexical_status: string
  syntax_status: string
  ast_status: string
  semantic_status: string
  execution_status: string
  overall_status: string
  created_at: string
  completed_at: string
}

export interface CompilerResult {
  command_id: number
  raw_command: string
  lexical_analysis: {
    status: string
    tokens: any[]
    errors?: any[]
  }
  syntax_analysis: {
    status: string
    grammar_rule: string
    errors?: any[]
  }
  ast: {
    status: string
    tree: any
    json: any
  }
  semantic_analysis: {
    status: string
    checks: any[]
    errors?: any[]
    context?: any
  }
  execution: {
    status: string
    operation?: string
    transaction_id?: number
    message?: string
    inventory_changes?: any
    error?: any
  }
}
