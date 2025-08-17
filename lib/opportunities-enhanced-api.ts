import { getSupabaseClient } from "@/lib/supabase-client"
import type { OpportunityEnhanced, OpportunityFilters, OpportunityStatistics } from "@/types/opportunity-enhanced"

// 扩展的本地缓存数据，用于演示和降级
const LOCAL_ENHANCED_OPPORTUNITIES: OpportunityEnhanced[] = [
  {
    id: "local-1",
    company_name: "字节跳动",
    job_title: "前端开发工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "初级",
    tags: ["React", "TypeScript", "前端"],
    reason: "技术驱动的内容平台，正在大力投入AI和创作者工具",
    contact_email: "hr@bytedance.com",
    contact_person: "张经理",
    company_logo: "/bytedance-logo.png",
    priority: 9,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    expires_at: "2024-02-15T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-2",
    company_name: "快手",
    job_title: "算法工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "中级",
    tags: ["机器学习", "推荐算法", "Python"],
    reason: "短视频领域的技术创新者，AI算法团队快速扩张",
    contact_email: "talent@kuaishou.com",
    contact_person: "李总监",
    company_logo: "/kuaishou-logo.png",
    priority: 8,
    created_at: "2024-01-14T09:30:00Z",
    updated_at: "2024-01-14T09:30:00Z",
    expires_at: "2024-02-14T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-3",
    company_name: "理想汽车",
    job_title: "软件开发工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "初级",
    tags: ["Java", "微服务", "汽车"],
    reason: "新能源汽车领军企业，软件定义汽车的先行者",
    contact_email: "hr@lixiang.com",
    contact_person: "王主管",
    company_logo: "/lixiang-auto-logo.png",
    priority: 7,
    created_at: "2024-01-13T14:20:00Z",
    updated_at: "2024-01-13T14:20:00Z",
    expires_at: "2024-02-13T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-4",
    company_name: "小红书",
    job_title: "产品经理",
    location: "上海",
    funding_stage: "D轮",
    job_level: "初级",
    tags: ["产品设计", "用户体验", "社交"],
    reason: "生活方式社区平台，用户增长迅速，产品创新活跃",
    contact_email: "pm@xiaohongshu.com",
    contact_person: "陈产品",
    company_logo: "/xiaohongshu-logo.png",
    priority: 8,
    created_at: "2024-01-12T11:15:00Z",
    updated_at: "2024-01-12T11:15:00Z",
    expires_at: "2024-02-12T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-5",
    company_name: "美团",
    job_title: "后端开发工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "中级",
    tags: ["Go", "分布式", "高并发"],
    reason: "本地生活服务领导者，技术架构持续演进升级",
    contact_email: "tech@meituan.com",
    contact_person: "刘架构师",
    company_logo: "/meituan-logo.png",
    priority: 7,
    created_at: "2024-01-11T16:45:00Z",
    updated_at: "2024-01-11T16:45:00Z",
    expires_at: "2024-02-11T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-6",
    company_name: "蔚来汽车",
    job_title: "移动端开发工程师",
    location: "上海",
    funding_stage: "已上市",
    job_level: "初级",
    tags: ["iOS", "Android", "汽车"],
    reason: "智能电动汽车先锋，移动端体验创新引领者",
    contact_email: "mobile@nio.com",
    contact_person: "赵技术",
    company_logo: "/nio-logo.png",
    priority: 6,
    created_at: "2024-01-10T13:30:00Z",
    updated_at: "2024-01-10T13:30:00Z",
    expires_at: "2024-02-10T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-7",
    company_name: "腾讯",
    job_title: "全栈开发工程师",
    location: "深圳",
    funding_stage: "已上市",
    job_level: "中级",
    tags: ["Vue", "Node.js", "云服务"],
    reason: "互联网巨头，云计算和企业服务快速发展",
    contact_email: "fullstack@tencent.com",
    contact_person: "周团队",
    company_logo: "/placeholder-logo.png",
    priority: 8,
    created_at: "2024-01-09T10:20:00Z",
    updated_at: "2024-01-09T10:20:00Z",
    expires_at: "2024-02-09T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-8",
    company_name: "阿里巴巴",
    job_title: "数据分析师",
    location: "杭州",
    funding_stage: "已上市",
    job_level: "初级",
    tags: ["SQL", "Python", "数据可视化"],
    reason: "电商和云计算领导者，数据驱动业务决策",
    contact_email: "data@alibaba.com",
    contact_person: "孙分析师",
    company_logo: "/placeholder-logo.png",
    priority: 7,
    created_at: "2024-01-08T15:10:00Z",
    updated_at: "2024-01-08T15:10:00Z",
    expires_at: "2024-02-08T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-9",
    company_name: "百度",
    job_title: "AI工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "中级",
    tags: ["深度学习", "NLP", "PyTorch"],
    reason: "AI技术领军企业，大模型和自动驾驶技术先进",
    contact_email: "ai@baidu.com",
    contact_person: "林研究员",
    company_logo: "/placeholder-logo.png",
    priority: 9,
    created_at: "2024-01-07T12:00:00Z",
    updated_at: "2024-01-07T12:00:00Z",
    expires_at: "2024-02-07T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-10",
    company_name: "网易",
    job_title: "游戏开发工程师",
    location: "广州",
    funding_stage: "已上市",
    job_level: "初级",
    tags: ["Unity", "C#", "游戏引擎"],
    reason: "游戏行业领导者，创新游戏产品持续推出",
    contact_email: "game@netease.com",
    contact_person: "游戏制作人",
    company_logo: "/placeholder-logo.png",
    priority: 6,
    created_at: "2024-01-06T09:45:00Z",
    updated_at: "2024-01-06T09:45:00Z",
    expires_at: "2024-02-06T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-11",
    company_name: "滴滴出行",
    job_title: "运维工程师",
    location: "北京",
    funding_stage: "F轮",
    job_level: "中级",
    tags: ["Kubernetes", "Docker", "监控"],
    reason: "出行服务平台，大规模分布式系统运维挑战",
    contact_email: "ops@didi.com",
    contact_person: "运维负责人",
    company_logo: "/placeholder-logo.png",
    priority: 5,
    created_at: "2024-01-05T14:30:00Z",
    updated_at: "2024-01-05T14:30:00Z",
    expires_at: "2024-02-05T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-12",
    company_name: "京东",
    job_title: "测试工程师",
    location: "北京",
    funding_stage: "已上市",
    job_level: "初级",
    tags: ["自动化测试", "性能测试", "质量保证"],
    reason: "电商和物流技术创新，测试体系完善",
    contact_email: "qa@jd.com",
    contact_person: "测试主管",
    company_logo: "/placeholder-logo.png",
    priority: 6,
    created_at: "2024-01-04T11:20:00Z",
    updated_at: "2024-01-04T11:20:00Z",
    expires_at: "2024-02-04T23:59:59Z",
    is_active: true,
  },
]

/**
 * 获取增强版机会列表（支持随机选择）
 */
export async function fetchEnhancedOpportunities(limit = 6): Promise<OpportunityEnhanced[]> {
  console.log(`开始获取增强机会数据，限制数量: ${limit}`)

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.log("Supabase客户端不可用，使用本地数据")
    return getRandomLocalOpportunities(limit)
  }

  try {
    // 先获取总数
    const { count, error: countError } = await supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    if (countError) {
      console.error("获取数据总数失败:", countError)
      return getRandomLocalOpportunities(limit)
    }

    const totalCount = count || 0
    console.log(`数据库中共有 ${totalCount} 条活跃机会`)

    if (totalCount === 0) {
      console.log("数据库中没有活跃机会，使用本地数据")
      return getRandomLocalOpportunities(limit)
    }

    // 随机选择起始位置
    const maxOffset = Math.max(0, totalCount - limit)
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1))

    console.log(`随机偏移量: ${randomOffset}, 最大偏移量: ${maxOffset}`)

    // 获取随机数据
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .range(randomOffset, randomOffset + limit - 1)

    if (error) {
      console.error("获取机会数据失败:", error)
      return getRandomLocalOpportunities(limit)
    }

    if (!data || data.length === 0) {
      console.log("数据库返回空结果，使用本地数据")
      return getRandomLocalOpportunities(limit)
    }

    console.log(`成功从数据库获取 ${data.length} 条机会数据`)

    // 转换数据格式
    const opportunities = data.map(transformDatabaseToEnhanced)

    // 如果数据不足，用本地数据补充
    if (opportunities.length < limit) {
      const needed = limit - opportunities.length
      const localData = getRandomLocalOpportunities(needed)
      console.log(`数据不足，用本地数据补充 ${needed} 条`)
      opportunities.push(...localData)
    }

    return opportunities.slice(0, limit)
  } catch (error) {
    console.error("获取增强机会数据时出错:", error)
    return getRandomLocalOpportunities(limit)
  }
}

/**
 * 搜索增强版机会（支持随机选择）
 */
export async function searchEnhancedOpportunities(filters: OpportunityFilters): Promise<OpportunityEnhanced[]> {
  console.log("执行增强机会搜索，筛选条件:", filters)

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.log("Supabase客户端不可用，使用本地筛选")
    return filterLocalOpportunities(filters)
  }

  try {
    let query = supabase.from("opportunities").select("*").eq("is_active", true)

    // 应用筛选条件
    if (filters.keyword) {
      query = query.or(`company_name.ilike.%${filters.keyword}%,job_title.ilike.%${filters.keyword}%`)
    }

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`)
    }

    if (filters.fundingStage) {
      query = query.eq("funding_stage", filters.fundingStage)
    }

    if (filters.jobLevel) {
      query = query.ilike("job_level", `%${filters.jobLevel}%`)
    }

    if (filters.priority) {
      query = query.gte("priority", filters.priority)
    }

    // 先获取符合条件的总数
    const { count, error: countError } = await query.select("*", { count: "exact", head: true })

    if (countError) {
      console.error("获取筛选结果总数失败:", countError)
      return filterLocalOpportunities(filters)
    }

    const totalCount = count || 0
    console.log(`筛选条件下共有 ${totalCount} 条匹配机会`)

    if (totalCount === 0) {
      console.log("没有匹配的机会，返回空结果")
      return []
    }

    const limit = filters.limit || 6

    // 如果结果数量少于等于限制数量，直接返回所有结果
    if (totalCount <= limit) {
      const { data, error } = await query.order("priority", { ascending: false })

      if (error) {
        console.error("获取筛选结果失败:", error)
        return filterLocalOpportunities(filters)
      }

      console.log(`返回所有 ${data?.length || 0} 条匹配结果`)
      return (data || []).map(transformDatabaseToEnhanced)
    }

    // 随机选择起始位置
    const maxOffset = Math.max(0, totalCount - limit)
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1))

    console.log(`筛选结果随机偏移量: ${randomOffset}, 最大偏移量: ${maxOffset}`)

    // 获取随机筛选结果
    const { data, error } = await query
      .order("priority", { ascending: false })
      .range(randomOffset, randomOffset + limit - 1)

    if (error) {
      console.error("获取随机筛选结果失败:", error)
      return filterLocalOpportunities(filters)
    }

    console.log(`成功获取 ${data?.length || 0} 条随机筛选结果`)
    return (data || []).map(transformDatabaseToEnhanced)
  } catch (error) {
    console.error("搜索增强机会时出错:", error)
    return filterLocalOpportunities(filters)
  }
}

/**
 * 获取机会统计信息
 */
export async function getOpportunityStatistics(): Promise<OpportunityStatistics> {
  console.log("获取机会统计信息")

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.log("Supabase客户端不可用，使用本地统计")
    return getLocalStatistics()
  }

  try {
    // 使用RPC函数获取统计信息（如果存在）
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_opportunity_statistics")

    if (!rpcError && rpcData) {
      console.log("成功通过RPC获取统计信息:", rpcData)
      return rpcData
    }

    console.log("RPC函数不可用，手动计算统计信息")

    // 手动计算统计信息
    const { data: allOpportunities, error } = await supabase.from("opportunities").select("*")

    if (error) {
      console.error("获取机会数据失败:", error)
      return getLocalStatistics()
    }

    const opportunities = allOpportunities || []
    const activeOpportunities = opportunities.filter((opp) => opp.is_active)
    const highPriorityOpportunities = activeOpportunities.filter((opp) => (opp.priority || 0) >= 8)

    // 计算即将过期的机会（7天内）
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const expiringSoon = activeOpportunities.filter((opp) => {
      if (!opp.expires_at) return false
      return new Date(opp.expires_at) <= sevenDaysFromNow
    })

    const uniqueCompanies = new Set(opportunities.map((opp) => opp.company_name)).size

    const stats = {
      total_opportunities: opportunities.length,
      active_opportunities: activeOpportunities.length,
      high_priority_opportunities: highPriorityOpportunities.length,
      expiring_soon: expiringSoon.length,
      unique_companies: uniqueCompanies,
    }

    console.log("手动计算的统计信息:", stats)
    return stats
  } catch (error) {
    console.error("获取统计信息时出错:", error)
    return getLocalStatistics()
  }
}

/**
 * 获取本地缓存的增强机会数据
 */
export function getLocalEnhancedOpportunities(): OpportunityEnhanced[] {
  return LOCAL_ENHANCED_OPPORTUNITIES
}

// 辅助函数

/**
 * 随机获取本地机会数据
 */
function getRandomLocalOpportunities(limit: number): OpportunityEnhanced[] {
  const shuffled = [...LOCAL_ENHANCED_OPPORTUNITIES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, limit)
}

/**
 * 本地数据筛选
 */
function filterLocalOpportunities(filters: OpportunityFilters): OpportunityEnhanced[] {
  let filtered = LOCAL_ENHANCED_OPPORTUNITIES.filter((opp) => {
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      if (!opp.company_name.toLowerCase().includes(keyword) && !opp.job_title.toLowerCase().includes(keyword)) {
        return false
      }
    }

    if (filters.location && !opp.location?.toLowerCase().includes(filters.location.toLowerCase())) {
      return false
    }

    if (filters.fundingStage && opp.funding_stage !== filters.fundingStage) {
      return false
    }

    if (filters.jobLevel && !opp.job_level?.includes(filters.jobLevel)) {
      return false
    }

    if (filters.priority && opp.priority < filters.priority) {
      return false
    }

    return true
  })

  // 随机排序
  filtered = filtered.sort(() => Math.random() - 0.5)

  const limit = filters.limit || 6
  return filtered.slice(0, limit)
}

/**
 * 获取本地统计信息
 */
function getLocalStatistics(): OpportunityStatistics {
  const opportunities = LOCAL_ENHANCED_OPPORTUNITIES
  const activeOpportunities = opportunities.filter((opp) => opp.is_active)
  const highPriorityOpportunities = activeOpportunities.filter((opp) => opp.priority >= 8)
  const uniqueCompanies = new Set(opportunities.map((opp) => opp.company_name)).size

  return {
    total_opportunities: opportunities.length,
    active_opportunities: activeOpportunities.length,
    high_priority_opportunities: highPriorityOpportunities.length,
    expiring_soon: 0, // 本地数据暂不计算过期
    unique_companies: uniqueCompanies,
  }
}

/**
 * 将数据库数据转换为增强机会格式
 */
function transformDatabaseToEnhanced(dbData: any): OpportunityEnhanced {
  return {
    id: dbData.id,
    company_name: dbData.company_name || dbData.company || "未知公司",
    job_title: dbData.job_title || dbData.title || "未知职位",
    location: dbData.location || dbData.city,
    funding_stage: dbData.funding_stage,
    job_level: dbData.job_level,
    tags: Array.isArray(dbData.tags) ? dbData.tags : dbData.tags ? [dbData.tags] : [],
    reason: dbData.reason,
    contact_email: dbData.contact_email,
    contact_person: dbData.contact_person,
    company_logo: dbData.company_logo || "/placeholder-logo.png",
    priority: dbData.priority || 5,
    created_at: dbData.created_at || new Date().toISOString(),
    updated_at: dbData.updated_at || new Date().toISOString(),
    expires_at: dbData.expires_at,
    is_active: dbData.is_active !== false,
  }
}
