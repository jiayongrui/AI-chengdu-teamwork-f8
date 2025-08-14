import { getSupabaseClient } from "./supabase-client"
import type { OpportunityEnhanced, OpportunityFilters, OpportunityStatistics } from "@/types/opportunity-enhanced"

// 本地缓存数据（作为降级方案）
const LOCAL_OPPORTUNITIES: OpportunityEnhanced[] = [
  {
    id: "1",
    company_name: "字节跳动",
    job_title: "前端开发工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "应届生",
    tags: ["React", "TypeScript", "前端"],
    reason: "字节跳动技术氛围浓厚，适合技术成长",
    contact_email: "hr@bytedance.com",
    contact_person: "张经理",
    company_logo: "/bytedance-logo.png",
    priority: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: "2",
    company_name: "小红书",
    job_title: "产品经理",
    location: "上海",
    funding_stage: "D轮及以后",
    job_level: "应届生",
    tags: ["产品设计", "用户研究", "社交"],
    reason: "小红书正在快速发展，产品创新机会多",
    contact_email: "pm@xiaohongshu.com",
    contact_person: "李总监",
    company_logo: "/xiaohongshu-logo.png",
    priority: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: "3",
    company_name: "理想汽车",
    job_title: "软件工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "应届生",
    tags: ["C++", "嵌入式", "汽车"],
    reason: "新能源汽车行业前景广阔，技术挑战大",
    contact_email: "tech@lixiang.com",
    contact_person: "王工程师",
    company_logo: "/lixiang-auto-logo.png",
    priority: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: "4",
    company_name: "蔚来汽车",
    job_title: "AI算法工程师",
    location: "上海",
    funding_stage: "已上市",
    job_level: "应届生",
    tags: ["Python", "机器学习", "自动驾驶"],
    reason: "蔚来在自动驾驶领域投入巨大，AI团队在扩张",
    contact_email: "ai@nio.com",
    contact_person: "陈博士",
    company_logo: "/nio-logo.png",
    priority: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: "5",
    company_name: "快手",
    job_title: "后端开发工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "应届生",
    tags: ["Java", "分布式", "大数据"],
    reason: "快手技术栈完善，有大规模系统实践机会",
    contact_email: "backend@kuaishou.com",
    contact_person: "刘架构师",
    company_logo: "/kuaishou-logo.png",
    priority: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: "6",
    company_name: "美团",
    job_title: "数据分析师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "应届生",
    tags: ["SQL", "Python", "数据可视化"],
    reason: "美团业务数据丰富，数据分析应用场景多样",
    contact_email: "data@meituan.com",
    contact_person: "赵分析师",
    company_logo: "/meituan-logo.png",
    priority: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
]

export async function fetchEnhancedOpportunities(limit = 6): Promise<OpportunityEnhanced[]> {
  try {
    console.log("Fetching enhanced opportunities from database...")
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("opportunities_enhanced_view")
      .select("*")
      .limit(limit)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      throw error
    }

    console.log(`Fetched ${data?.length || 0} opportunities from database`)
    return data || []
  } catch (error) {
    console.warn("Failed to fetch from database, using local cache:", error)
    return LOCAL_OPPORTUNITIES.slice(0, limit)
  }
}

export async function searchEnhancedOpportunities(filters: OpportunityFilters): Promise<OpportunityEnhanced[]> {
  try {
    console.log("Searching opportunities with filters:", filters)
    const supabase = getSupabaseClient()

    let query = supabase.from("opportunities_enhanced_view").select("*")

    // 关键词搜索
    if (filters.keyword) {
      query = query.or(`company_name.ilike.%${filters.keyword}%,job_title.ilike.%${filters.keyword}%`)
    }

    // 地点筛选
    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`)
    }

    // 融资阶段筛选
    if (filters.fundingStage) {
      query = query.eq("funding_stage", filters.fundingStage)
    }

    // 职位级别筛选
    if (filters.jobLevel) {
      query = query.ilike("job_level", `%${filters.jobLevel}%`)
    }

    // 优先级筛选
    if (filters.priority) {
      const priorityNum = Number.parseInt(filters.priority)
      if (priorityNum >= 8) {
        query = query.gte("priority", 8)
      } else if (priorityNum >= 6) {
        query = query.gte("priority", 6).lt("priority", 8)
      } else if (priorityNum >= 4) {
        query = query.gte("priority", 4).lt("priority", 6)
      } else {
        query = query.lt("priority", 4)
      }
    }

    const { data, error } = await query
      .limit(filters.limit || 6)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Search error:", error)
      throw error
    }

    console.log(`Found ${data?.length || 0} opportunities matching filters`)
    return data || []
  } catch (error) {
    console.warn("Search failed, using local filtering:", error)

    // 本地筛选降级
    let filtered = LOCAL_OPPORTUNITIES

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      filtered = filtered.filter(
        (opp) => opp.company_name.toLowerCase().includes(keyword) || opp.job_title.toLowerCase().includes(keyword),
      )
    }

    if (filters.location) {
      filtered = filtered.filter((opp) => opp.location?.toLowerCase().includes(filters.location!.toLowerCase()))
    }

    if (filters.fundingStage) {
      filtered = filtered.filter((opp) => opp.funding_stage === filters.fundingStage)
    }

    if (filters.jobLevel) {
      filtered = filtered.filter((opp) => opp.job_level?.includes(filters.jobLevel!))
    }

    if (filters.priority) {
      const priorityNum = Number.parseInt(filters.priority)
      if (priorityNum >= 8) {
        filtered = filtered.filter((opp) => opp.priority >= 8)
      } else if (priorityNum >= 6) {
        filtered = filtered.filter((opp) => opp.priority >= 6 && opp.priority < 8)
      } else if (priorityNum >= 4) {
        filtered = filtered.filter((opp) => opp.priority >= 4 && opp.priority < 6)
      } else {
        filtered = filtered.filter((opp) => opp.priority < 4)
      }
    }

    return filtered.slice(0, filters.limit || 6)
  }
}

export async function getOpportunityStatistics(): Promise<OpportunityStatistics> {
  try {
    console.log("Fetching opportunity statistics...")
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.rpc("get_opportunity_statistics")

    if (error) {
      console.error("Statistics error:", error)
      throw error
    }

    console.log("Statistics fetched:", data)
    return (
      data || {
        total_opportunities: 0,
        active_opportunities: 0,
        high_priority_opportunities: 0,
        expiring_soon: 0,
        unique_companies: 0,
      }
    )
  } catch (error) {
    console.warn("Failed to fetch statistics, using local data:", error)

    // 本地统计降级
    const active = LOCAL_OPPORTUNITIES.filter((opp) => opp.is_active)
    const highPriority = active.filter((opp) => opp.priority >= 8)
    const expiringSoon = active.filter((opp) => {
      if (!opp.expires_at) return false
      const expiryDate = new Date(opp.expires_at)
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      return expiryDate <= weekFromNow
    })
    const uniqueCompanies = new Set(active.map((opp) => opp.company_name))

    return {
      total_opportunities: LOCAL_OPPORTUNITIES.length,
      active_opportunities: active.length,
      high_priority_opportunities: highPriority.length,
      expiring_soon: expiringSoon.length,
      unique_companies: uniqueCompanies.size,
    }
  }
}

export function getLocalEnhancedOpportunities(): OpportunityEnhanced[] {
  return LOCAL_OPPORTUNITIES
}
