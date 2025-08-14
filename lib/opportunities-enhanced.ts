import { getSupabaseClient } from "@/lib/supabase-client"
import type { OpportunityView } from "./opportunities-db"

// 增强的机会搜索和筛选功能
export interface SearchFilters {
  keyword?: string
  location?: string
  industry?: string
  company?: string
  salaryMin?: string
  salaryMax?: string
  priority?: number
  tags?: string[]
  limit?: number
  offset?: number
}

export interface SearchResult {
  opportunities: OpportunityView[]
  total: number
  hasMore: boolean
}

export async function searchOpportunitiesAdvanced(filters: SearchFilters): Promise<SearchResult> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  let query = supabase.from("opportunities_view").select("*", { count: "exact" })

  // 关键词搜索（公司名或职位名）
  if (filters.keyword) {
    query = query.or(`company.ilike.%${filters.keyword}%,title.ilike.%${filters.keyword}%`)
  }

  // 地区筛选
  if (filters.location) {
    query = query.ilike("city", `%${filters.location}%`)
  }

  // 公司筛选
  if (filters.company) {
    query = query.ilike("company", `%${filters.company}%`)
  }

  // 优先级筛选
  if (filters.priority !== undefined) {
    query = query.gte("priority", filters.priority)
  }

  // 排序
  query = query.order("priority", { ascending: false }).order("posted_date", { ascending: false })

  // 分页
  const limit = filters.limit || 20
  const offset = filters.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    opportunities: (data || []) as OpportunityView[],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  }
}

// 获取热门公司
export async function getPopularCompanies(limit = 10) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase.from("popular_companies").select("*").limit(limit)

  if (error) throw error
  return data || []
}

// 获取热门地区
export async function getPopularLocations(limit = 10) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase.from("popular_locations").select("*").limit(limit)

  if (error) throw error
  return data || []
}

// 获取行业分布
export async function getIndustryDistribution() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase.from("industry_distribution").select("*")

  if (error) throw error
  return data || []
}

// 获取机会统计
export async function getOpportunityStatistics() {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase.from("opportunities_stats").select("*").single()

  if (error) throw error
  return data
}

// 根据用户简历推荐机会
export async function getRecommendedOpportunities(resumeText: string, limit = 10): Promise<OpportunityView[]> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  // 简单的关键词匹配推荐算法
  const keywords = extractKeywords(resumeText)

  if (keywords.length === 0) {
    // 如果没有关键词，返回高优先级的机会
    const { data, error } = await supabase.from("opportunities_view").select("*").gte("priority", 7).limit(limit)

    if (error) throw error
    return (data || []) as OpportunityView[]
  }

  // 基于关键词搜索
  const keywordQuery = keywords.map((k) => `title.ilike.%${k}%`).join(",")
  const { data, error } = await supabase
    .from("opportunities_view")
    .select("*")
    .or(keywordQuery)
    .order("priority", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []) as OpportunityView[]
}

// 从简历中提取关键词
function extractKeywords(resumeText: string): string[] {
  const techKeywords = [
    "Java",
    "Python",
    "JavaScript",
    "React",
    "Vue",
    "Angular",
    "Node.js",
    "Spring",
    "Django",
    "Flask",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "Git",
    "Linux",
    "算法",
    "数据结构",
    "机器学习",
    "深度学习",
    "人工智能",
    "大数据",
    "云计算",
    "微服务",
    "前端",
    "后端",
    "全栈",
    "移动开发",
    "Android",
    "iOS",
    "Flutter",
    "产品经理",
    "UI设计",
    "UX设计",
    "数据分析",
    "运营",
    "市场营销",
  ]

  const found = techKeywords.filter((keyword) => resumeText.toLowerCase().includes(keyword.toLowerCase()))

  return found.slice(0, 5) // 最多返回5个关键词
}
