export interface Cost {
  parts?: number
  labor?: number
}

export interface Repo {
  _id?: string
  name: string
  brand: string
  model: string
  color: string
  license_plate: string
  vin_code: string
  register_date: number
  initial_mileage: number
  current_mileage: number
  current_head?: string
  purchase_cost?: number
  insurance_company?: string
  inspection_expiry?: number
  compulsory_insurance_expiry?: number
  commercial_insurance_expiry?: number
  user_openid?: string
}

export interface Commit {
  _id?: string
  repo_id: string
  type: string
  title: string
  message?: string
  mileage?: number
  timestamp: number
  cost?: Cost
  closes_issues?: string[]
}

export interface Issue {
  _id?: string
  repo_id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'closed'
  due_mileage?: number
  due_date?: number
  labels?: string[]
  created_at: number
  closed_at?: number
  closed_by_commit_id?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}
