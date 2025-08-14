import { getSupabaseClient } from "@/lib/supabase-client"

export interface OpportunityDB {
  id: string
  company_name: string
  job_title: string
  location?: string
  salary_range?: string
  job_type?: string
  experience_required?: string
  education_required?: string
  job_description?: string
  company_size?: string
  industry?: string
  benefits?: string
  contact_email?: string
  contact_person?: string
  application_deadline?: string
  posted_date: string
  status: "active" | "inactive" | "expired"
  tags: string[]
  reason?: string
  priority: number
  source: string
  created_at: string
  updated_at: string
}

export interface OpportunityView {
  id: string
  company: string
  title: string
  city?: string
  salary_range?: string
  tags: string[]
  reason?: string
  priority: number
  status: string
  posted_date: string
  created_at: string
}

export async function fetchOpportunities(limit = 20): Promise<OpportunityView[]> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase.from("opportunities_view").select("*").limit(limit)

  if (error) throw error
  return (data || []) as OpportunityView[]
}

export async function fetchOpportunityById(id: string): Promise<OpportunityDB | null> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase.from("opportunities").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") return null // Not found
    throw error
  }
  return data as OpportunityDB
}

export async function searchOpportunities(params: {
  keyword?: string
  location?: string
  industry?: string
  salaryMin?: number
  salaryMax?: number
  limit?: number
}): Promise<OpportunityView[]> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  let query = supabase.from("opportunities_view").select("*")

  if (params.keyword) {
    query = query.or(`company.ilike.%${params.keyword}%,title.ilike.%${params.keyword}%`)
  }

  if (params.location) {
    query = query.ilike("city", `%${params.location}%`)
  }

  if (params.limit) {
    query = query.limit(params.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as OpportunityView[]
}

export async function createOpportunity(opportunity: Partial<OpportunityDB>): Promise<OpportunityDB> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase.from("opportunities").insert(opportunity).select("*").single()

  if (error) throw error
  return data as OpportunityDB
}

export async function updateOpportunity(id: string, updates: Partial<OpportunityDB>): Promise<OpportunityDB> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase.from("opportunities").update(updates).eq("id", id).select("*").single()

  if (error) throw error
  return data as OpportunityDB
}

export async function deleteOpportunity(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { error } = await supabase.from("opportunities").delete().eq("id", id)

  if (error) throw error
}

export async function getOpportunityStats() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase.from("opportunities_stats").select("*").single()

  if (error) throw error
  return data
}

// 本地存储降级方案
const LS_OPPORTUNITIES_KEY = "opportunities-cache"

export function getLocalOpportunities(): OpportunityView[] {
  try {
    const raw = localStorage.getItem(LS_OPPORTUNITIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setLocalOpportunities(opportunities: OpportunityView[]) {
  try {
    localStorage.setItem(LS_OPPORTUNITIES_KEY, JSON.stringify(opportunities))
  } catch (error) {
    console.warn("无法保存机会数据到本地存储:", error)
  }
}
