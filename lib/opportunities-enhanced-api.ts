import { getSupabaseClient } from "@/lib/supabase-client"
import type { OpportunityEnhanced, OpportunityFilters, OpportunityStatistics } from "@/types/opportunity-enhanced"

// 扩展的本地缓存数据，用于演示和降级
const LOCAL_ENHANCED_OPPORTUNITIES: OpportunityEnhanced[] = [
  {
    id: "local-1",
    company_name: "上海缠山科技有限公司",
    job_title: "AI产品经理",
    location: "成都青羊区",
    funding_stage: "初创期",
    job_level: "中级",
    tags: ["AI", "产品经理", "前沿技术", "Agent"],
    reason: "深度追踪全球AI技术前沿动态，包括大型语言模型演进、Agent架构等，构思突破性AI产品概念",
    contact_email: "请通过招聘平台联系",
    contact_person: "HR",
    company_logo: "/placeholder-logo.png",
    priority: 8,
    created_at: "2023-12-15T10:00:00Z",
    updated_at: "2023-12-15T10:00:00Z",
    expires_at: "2024-06-15T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-2",
    company_name: "辛恩励科技有限公司",
    job_title: "AI产品经理",
    location: "深圳南山区",
    funding_stage: "成长期",
    job_level: "中级",
    tags: ["AI", "产品经理", "项目管理", "应届生"],
    reason: "主导AI软件产品全生命周期，与内部各部门紧密协作，推动产品开发落地",
    contact_email: "请通过招聘平台联系",
    contact_person: "HR",
    company_logo: "/placeholder-logo.png",
    priority: 7,
    created_at: "2023-12-20T09:30:00Z",
    updated_at: "2023-12-20T09:30:00Z",
    expires_at: "2025-12-31T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-3",
    company_name: "杭州知行元科技",
    job_title: "AI产品经理",
    location: "杭州余杭区",
    funding_stage: "初创期",
    job_level: "中级",
    tags: ["AI", "产品经理", "AIGC", "应届生"],
    reason: "主导创作者平台与官网产品迭代，深度接触AI艺术家群体，优化产品功能与服务",
    contact_email: "请通过招聘平台联系",
    contact_person: "HR",
    company_logo: "/placeholder-logo.png",
    priority: 6,
    created_at: "2023-12-25T14:20:00Z",
    updated_at: "2023-12-25T14:20:00Z",
    expires_at: "2025-12-31T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-4",
    company_name: "蜜蜂数联",
    job_title: "AI产品经理",
    location: "重庆渝北区",
    funding_stage: "初创期",
    job_level: "中级",
    tags: ["AI", "产品经理", "医疗健康", "应届生"],
    reason: "负责产品需求调研与分析，洞察行业发展趋势，设计开发解决方案",
    contact_email: "请通过招聘平台联系",
    contact_person: "HR",
    company_logo: "/placeholder-logo.png",
    priority: 5,
    created_at: "2023-12-30T11:15:00Z",
    updated_at: "2023-12-30T11:15:00Z",
    expires_at: "2025-12-31T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-5",
    company_name: "杭州智能涌现人工智能科技有限公司",
    job_title: "AI产品经理",
    location: "杭州滨江区",
    funding_stage: "初创期",
    job_level: "中级",
    tags: ["AI", "产品经理", "婚恋平台", "应届生"],
    reason: "打造下一代AI婚恋平台，懂AI产品底层逻辑，有从0到1完整主导产品经验",
    contact_email: "请通过招聘平台联系",
    contact_person: "HR",
    company_logo: "/placeholder-logo.png",
    priority: 4,
    created_at: "2024-01-05T16:45:00Z",
    updated_at: "2024-01-05T16:45:00Z",
    expires_at: "2025-08-31T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-6",
    company_name: "皓域科技（河北）有限责任公司",
    job_title: "AI声乐教练产品经理",
    location: "深圳南山区",
    funding_stage: "成长期",
    job_level: "中级",
    tags: ["AI", "产品经理", "声乐教育", "应届生"],
    reason: "负责AI声乐教练产品全生命周期管理，结合声乐教学与AI技术创新",
    contact_email: "请通过招聘平台联系",
    contact_person: "HR",
    company_logo: "/placeholder-logo.png",
    priority: 3,
    created_at: "2024-01-10T13:30:00Z",
    updated_at: "2024-01-10T13:30:00Z",
    expires_at: "2025-12-31T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-7",
    company_name: "雄安九典科技有限公司",
    job_title: "AI产品经理",
    location: "保定容城县",
    funding_stage: "初创期",
    job_level: "中级",
    tags: ["AI", "产品经理", "雄安新区", "应届生"],
    reason: "负责AI产品市场调研，设计产品原型，规划产品商业化路径",
    contact_email: "请通过招聘平台联系",
    contact_person: "HR",
    company_logo: "/placeholder-logo.png",
    priority: 2,
    created_at: "2024-01-15T10:20:00Z",
    updated_at: "2024-01-15T10:20:00Z",
    expires_at: "2025-08-16T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-8",
    company_name: "苏州苏纳光电有限公司",
    job_title: "产品开发经理（2026）",
    location: "苏州",
    funding_stage: "成长期",
    job_level: "中级",
    tags: ["产品经理", "光电技术", "应届生", "硕士"],
    reason: "协助执行产品线市场洞察，参与产品规划与路标制定，支持产品开发项目",
    contact_email: "请通过招聘平台联系",
    contact_person: "HR",
    company_logo: "/placeholder-logo.png",
    priority: 1,
    created_at: "2024-01-20T15:10:00Z",
    updated_at: "2024-01-20T15:10:00Z",
    expires_at: "2025-06-30T23:59:59Z",
    is_active: true,
  },
  {
    id: "local-9",
    company_name: "聚合吧科技有限公司",
    job_title: "信贷APP产品经理",
    location: "北京",
    funding_stage: "成长期",
    job_level: "中级",
    tags: ["产品经理", "金融科技", "信贷", "应届生"],
    reason: "负责助贷产品全生命周期管理，深入分析业务问题，优化产品流程",
    contact_email: "请通过招聘平台联系",
    contact_person: "HR",
    company_logo: "/placeholder-logo.png",
    priority: 9,
    created_at: "2024-01-25T12:00:00Z",
    updated_at: "2024-01-25T12:00:00Z",
    expires_at: "2025-06-30T23:59:59Z",
    is_active: true,
  },
]

/**
 * 获取增强版机会列表（支持随机选择）
 */
export async function fetchEnhancedOpportunities(limit = 6): Promise<OpportunityEnhanced[]> {
  console.log(`获取增强机会数据，限制: ${limit}`)

  const supabase = getSupabaseClient()
  if (!supabase) {
    console.log("Supabase客户端不可用，使用本地数据")
    return getRandomLocalOpportunities(limit)
  }

  // 测试数据库连接（使用更简单的查询避免网络问题）
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时
    
    const { error: testError } = await supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .limit(1)
      .abortSignal(controller.signal)
    
    clearTimeout(timeoutId)
    
    if (testError) {
      console.error("数据库连接测试失败:", testError)
      console.log("数据库连接异常，使用本地数据")
      return getRandomLocalOpportunities(limit)
    }
    console.log("数据库连接正常")
  } catch (error) {
    console.error("数据库连接测试异常:", error)
    console.log("网络连接失败或超时，使用本地数据")
    return getRandomLocalOpportunities(limit)
  }

  try {
    // 先获取总数（添加超时控制）
    const countController = new AbortController()
    const countTimeoutId = setTimeout(() => countController.abort(), 8000) // 8秒超时
    
    const { count, error: countError } = await supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .abortSignal(countController.signal)

    clearTimeout(countTimeoutId)

    if (countError) {
      console.error("获取数据总数失败:", countError)
      console.log("数据库查询失败，使用本地数据")
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

    // 获取随机数据（添加超时控制）
    const dataController = new AbortController()
    const dataTimeoutId = setTimeout(() => dataController.abort(), 10000) // 10秒超时
    
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .range(randomOffset, randomOffset + limit - 1)
      .abortSignal(dataController.signal)

    clearTimeout(dataTimeoutId)

    if (error) {
      console.error("获取机会数据失败:", error)
      console.log("数据查询失败，使用本地数据")
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
    // 首先测试数据库连接（添加超时控制）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒超时
    
    const { error: connectionError } = await supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .limit(1)
      .abortSignal(controller.signal)
    
    clearTimeout(timeoutId)
    
    if (connectionError) {
      console.error("数据库连接失败:", connectionError)
      console.log("数据库不可用，使用本地统计数据")
      return getLocalStatistics()
    }
    
    console.log("统计查询数据库连接正常")

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
      console.log("数据库查询失败，使用本地统计数据")
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
    console.log("统计信息获取异常，使用本地统计数据")
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
