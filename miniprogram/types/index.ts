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

export interface FilterOptions {
  type?: string
  search?: string
  mileageMin?: number
  mileageMax?: number
  dateStart?: number
  dateEnd?: number
}

export interface InsuranceData {
  insurance_company: string
  compulsory_insurance: string
  commercial_insurance: string
}

export interface CompositionItem {
  name: string
  value: number
  percentage: number
}

export interface StatsResponse {
  total_cost: number
  total_mileage: number
  driven_mileage: number
  cost_per_km: number
  fuel_cost_per_km: number
  composition: CompositionItem[]
}

export interface MonthData {
  month: string
  cost: number
  mileage: number
  fuel_cost?: number
}

export interface TrendsResponse {
  months: MonthData[]
  total_months: number
  maxCost?: number
  maxMileage?: number
  maxFuelCost?: number
}
