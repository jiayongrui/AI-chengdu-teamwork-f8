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
  {
    id: "7",
    company_name: "腾讯",
    job_title: "游戏开发工程师",
    location: "深圳",
    funding_stage: "已上市",
    job_level: "应届生",
    tags: ["Unity", "C#", "游戏开发"],
    reason: "腾讯游戏业务全球领先，技术实力雄厚",
    contact_email: "game@tencent.com",
    contact_person: "周制作人",
    company_logo: "/placeholder-logo.png",
    priority: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: "8",
    company_name: "阿里巴巴",
    job_title: "云计算工程师",
    location: "杭州",
    funding_stage: "已上市",
    job_level: "应届生",
    tags: ["云计算", "Docker", "Kubernetes"],
    reason: "阿里云是国内云计算领导者，技术前沿",
    contact_email: "cloud@alibaba.com",
    contact_person: "李架构师",
    company_logo: "/placeholder-logo.png",
    priority: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: "9",
    company_name: "百度",
    job_title: "自然语言处理工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "应届生",
    tags: ["NLP", "深度学习", "Python"],
    reason: "百度在AI领域投入巨大，NLP技术国内领先",
    contact_email: "ai@baidu.com",
    contact_person: "张研究员",
    company_logo: "/placeholder-logo.png",
    priority: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: "10",
    company_name: "滴滴出行",
    job_title: "移动端开发工程师",
    location: "北京",
    funding_stage: "D轮及以后",
    job_level: "应届生",
    tags: ["iOS", "Android", "移动开发"],
    reason: "滴滴用户量巨大，移动端技术挑战丰富",
    contact_email: "mobile@didi.com",
    contact_person: "王技术总监",
    company_logo: "/placeholder-logo.png",
    priority: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: "11",
    company_name: "京东",
    job_title: "供应链优化工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "应届生",
    tags: ["算法优化", "供应链", "数据分析"],
    reason: "京东物流体系完善，供应链优化技术先进",
    contact_email: "supply@jd.com",
    contact_person: "陈物流专家",
    company_logo: "/placeholder-logo.png",
    priority: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 19 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: "12",
    company_name: "网易",
    job_title: "音视频开发工程师",
    location: "杭州",
    funding_stage: "已上市",
    job_level: "应届生",
    tags: ["音视频", "WebRTC", "流媒体"],
    reason: "网易在音视频技术方面有深厚积累",
    contact_email: "media@netease.com",
    contact_person: "李音视频专家",
    company_logo: "/placeholder-logo.png",
    priority: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
]

// 转换函数：将数据库记录转换为 OpportunityEnhanced 格式
function transformToEnhanced(dbRecord: any): OpportunityEnhanced {
  return {
    id: dbRecord.id,
    company_name: dbRecord.company_name,
    job_title: dbRecord.job_title,
    location: dbRecord.location,
    funding_stage: dbRecord.funding_stage || "未知",
    job_level: dbRecord.job_level || "应届生",
    tags: dbRecord.tags || [],
    reason: dbRecord.reason,
    contact_email: dbRecord.contact_email,
    contact_person: dbRecord.contact_person,
    company_logo: dbRecord.company_logo || "/placeholder-logo.png",
    priority: dbRecord.priority || 5,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
    expires_at: dbRecord.expires_at,
    is_active: dbRecord.status === "active",
  }
}

// 随机获取本地机会数据
function getRandomLocalOpportunities(limit: number): OpportunityEnhanced[] {
  if (LOCAL_OPPORTUNITIES.length <= limit) {
    return LOCAL_OPPORTUNITIES
  }

  // 随机打乱数组并返回指定数量
  const shuffled = [...LOCAL_OPPORTUNITIES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, limit)
}

export async function fetchEnhancedOpportunities(limit = 6): Promise<OpportunityEnhanced[]> {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.warn("Supabase 未配置，使用本地机会数据")
      return getRandomLocalOpportunities(limit)
    }

    // 首先获取总数，然后随机选择
    const { count } = await supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    if (!count || count === 0) {
      console.warn("No data in database, using local cache")
      return getRandomLocalOpportunities(limit)
    }

    // 随机选择起始位置
    const maxOffset = Math.max(0, count - limit)
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1))

    console.log(`随机选择数据：总数 ${count}，偏移量 ${randomOffset}，限制 ${limit}`)

    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("status", "active")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .range(randomOffset, randomOffset + limit - 1)

    if (error) {
      console.error("Database error:", error)
      throw error
    }

    // 如果随机选择的数据不足，补充更多数据
    if (!data || data.length < limit) {
      console.log("随机数据不足，补充更多数据")
      const { data: additionalData } = await supabase
        .from("opportunities")
        .select("*")
        .eq("status", "active")
        .order("priority", { ascending: false })
        .limit(limit)

      const finalData = data || []
      if (additionalData) {
        // 合并数据并去重
        const existingIds = new Set(finalData.map((item) => item.id))
        const uniqueAdditional = additionalData.filter((item) => !existingIds.has(item.id))
        finalData.push(...uniqueAdditional)
      }

      return finalData.slice(0, limit).map(transformToEnhanced)
    }

    return data.map(transformToEnhanced)
  } catch (error) {
    console.warn("Failed to fetch from database, using local cache:", error)
    return getRandomLocalOpportunities(limit)
  }
}

export async function searchEnhancedOpportunities(filters: OpportunityFilters): Promise<OpportunityEnhanced[]> {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.warn("Supabase 未配置，使用本地筛选")
      return performLocalFiltering(filters, true) // 传入 true 表示随机选择
    }

    let query = supabase.from("opportunities").select("*").eq("status", "active")

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
      const priorityNum =
        typeof filters.priority === "string" ? Number.parseInt(filters.priority) : Number(filters.priority)
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

    // 首先获取符合条件的总数
    const { count } = await query.select("*", { count: "exact", head: true })

    if (!count || count === 0) {
      console.warn("No matching data in database, using local filtering")
      return performLocalFiltering(filters, true)
    }

    const limit = filters.limit || 6

    console.log(`筛选搜索：符合条件的总数 ${count}，需要 ${limit} 条`)

    // 如果结果数量少于或等于限制数量，直接返回所有结果
    if (count <= limit) {
      const { data, error } = await query
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Search error:", error)
        throw error
      }

      return data ? data.map(transformToEnhanced) : []
    }

    // 随机选择起始位置
    const maxOffset = Math.max(0, count - limit)
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1))

    console.log(`随机筛选：偏移量 ${randomOffset}`)

    const { data, error } = await query
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .range(randomOffset, randomOffset + limit - 1)

    if (error) {
      console.error("Search error:", error)
      throw error
    }

    return data ? data.map(transformToEnhanced) : []
  } catch (error) {
    console.warn("Search failed, using local filtering:", error)
    return performLocalFiltering(filters, true)
  }
}

// 本地筛选逻辑
function performLocalFiltering(filters: OpportunityFilters, randomize = false): OpportunityEnhanced[] {
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
    const priorityNum =
      typeof filters.priority === "string" ? Number.parseInt(filters.priority) : Number(filters.priority)
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

  const limit = filters.limit || 6

  console.log(`本地筛选：筛选后 ${filtered.length} 条，需要 ${limit} 条，随机选择：${randomize}`)

  // 如果需要随机选择
  if (randomize && filtered.length > limit) {
    // 随机打乱数组
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, limit)
  }

  return filtered.slice(0, limit)
}

export async function getOpportunityStatistics(): Promise<OpportunityStatistics> {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.warn("Supabase 未配置，使用本地统计数据")
      return getLocalStatistics()
    }

    // 尝试使用存储过程，如果不存在则手动计算
    try {
      const { data, error } = await supabase.rpc("get_opportunity_statistics")

      if (error) {
        throw error
      }

      return data || getLocalStatistics()
    } catch (rpcError) {
      console.warn("RPC function not available, calculating manually:", rpcError)

      // 手动计算统计数据
      const { data: opportunities, error } = await supabase.from("opportunities").select("*")

      if (error) {
        throw error
      }

      if (!opportunities || opportunities.length === 0) {
        return getLocalStatistics()
      }

      const active = opportunities.filter((opp) => opp.status === "active")
      const highPriority = active.filter((opp) => opp.priority >= 8)
      const expiringSoon = active.filter((opp) => {
        if (!opp.application_deadline) return false
        const deadline = new Date(opp.application_deadline)
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        return deadline <= weekFromNow
      })
      const uniqueCompanies = new Set(active.map((opp) => opp.company_name))

      return {
        total_opportunities: opportunities.length,
        active_opportunities: active.length,
        high_priority_opportunities: highPriority.length,
        expiring_soon: expiringSoon.length,
        unique_companies: uniqueCompanies.size,
      }
    }
  } catch (error) {
    console.warn("Failed to fetch statistics, using local data:", error)
    return getLocalStatistics()
  }
}

// 本地统计数据
function getLocalStatistics(): OpportunityStatistics {
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

export function getLocalEnhancedOpportunities(): OpportunityEnhanced[] {
  return LOCAL_OPPORTUNITIES
}
