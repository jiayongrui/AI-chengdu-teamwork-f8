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
    job_description: "<h3>职位职责：</h3><ul><li>深度追踪全球AI技术前沿动态，包括大型语言模型演进、Agent架构等核心技术发展</li><li>构思突破性AI产品概念，制定产品战略规划和路线图</li><li>与技术团队紧密合作，推动AI产品从概念到落地的全流程管理</li><li>分析市场需求和竞品动态，识别产品机会点</li><li>协调跨部门资源，确保产品按时高质量交付</li></ul><h3>任职要求：</h3><ul><li>计算机、人工智能相关专业本科及以上学历</li><li>3年以上AI产品管理经验，熟悉大模型、Agent等前沿技术</li><li>具备优秀的产品思维和用户体验设计能力</li><li>良好的沟通协调能力和项目管理经验</li><li>对AI技术发展趋势有深刻理解和敏锐洞察</li></ul>",
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
    job_description: "<h3>职位职责：</h3><ul><li>主导AI软件产品全生命周期管理，从需求分析到产品上线</li><li>与研发、设计、运营等内部各部门紧密协作，确保产品顺利交付</li><li>制定产品规划和迭代计划，推动产品功能优化和用户体验提升</li><li>进行市场调研和用户需求分析，识别产品改进机会</li><li>跟踪产品数据表现，制定数据驱动的产品决策</li></ul><h3>任职要求：</h3><ul><li>本科及以上学历，计算机、软件工程等相关专业优先</li><li>2-4年产品管理经验，有AI相关产品经验者优先</li><li>具备良好的项目管理和跨部门协作能力</li><li>熟悉产品设计流程和用户体验设计原则</li><li>欢迎优秀应届生投递简历</li></ul>",
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
    job_description: "<h3>职位职责：</h3><ul><li>主导创作者平台与官网产品的迭代升级，提升用户体验</li><li>深度接触AI艺术家群体，了解用户需求和痛点</li><li>优化AIGC相关产品功能与服务，推动产品商业化</li><li>制定产品路线图，协调技术资源实现产品目标</li><li>分析用户行为数据，持续优化产品功能</li></ul><h3>任职要求：</h3><ul><li>本科及以上学历，产品、设计、计算机相关专业优先</li><li>对AIGC、AI艺术创作领域有浓厚兴趣和深入了解</li><li>具备良好的用户洞察能力和产品设计思维</li><li>优秀的沟通协调能力，能与艺术家群体有效交流</li><li>欢迎应届生和转行人员投递</li></ul>",
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
    job_description: "<h3>职位职责：</h3><ul><li>负责AI医疗健康产品的需求调研与分析</li><li>洞察医疗健康行业发展趋势，识别产品机会</li><li>设计开发AI驱动的医疗健康解决方案</li><li>与医疗专家和技术团队协作，确保产品专业性</li><li>制定产品商业化策略和市场推广计划</li></ul><h3>任职要求：</h3><ul><li>本科及以上学历，医学、生物、计算机相关专业优先</li><li>对医疗健康和AI技术结合有深入理解</li><li>具备产品需求分析和解决方案设计能力</li><li>良好的跨领域沟通协调能力</li><li>欢迎医疗背景应届生投递</li></ul>",
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
    job_description: "<h3>职位职责：</h3><ul><li>打造下一代AI驱动的智能婚恋平台产品</li><li>深入理解AI产品底层逻辑，设计智能匹配算法产品化方案</li><li>拥有从0到1完整主导产品的全流程经验</li><li>负责用户需求分析和产品功能规划</li><li>与算法团队协作，将AI技术转化为用户价值</li></ul><h3>任职要求：</h3><ul><li>本科及以上学历，计算机、心理学、社会学相关专业优先</li><li>深入理解AI技术在社交领域的应用</li><li>具备从0到1产品孵化的完整经验</li><li>对用户心理和社交行为有深刻洞察</li><li>优秀的产品设计和用户体验能力</li></ul>",
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
    job_description: "<h3>职位职责：</h3><ul><li>负责AI声乐教练产品的全生命周期管理</li><li>结合声乐教学专业知识与AI技术进行产品创新</li><li>设计智能化声乐教学解决方案和用户体验</li><li>与音乐教育专家和技术团队协作开发产品功能</li><li>分析用户学习数据，优化AI教学算法效果</li></ul><h3>任职要求：</h3><ul><li>本科及以上学历，音乐、教育、计算机相关专业优先</li><li>对声乐教学和音乐教育有深入了解</li><li>熟悉AI技术在教育领域的应用</li><li>具备产品设计和用户体验优化能力</li><li>欢迎音乐教育背景应届生投递</li></ul>",
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
    job_description: "<h3>职位职责：</h3><ul><li>负责AI产品的市场调研和竞品分析</li><li>设计产品原型和用户交互流程</li><li>规划产品商业化路径和盈利模式</li><li>与技术团队协作，推动产品从概念到落地</li><li>参与雄安新区智慧城市建设相关AI项目</li></ul><h3>任职要求：</h3><ul><li>本科及以上学历，产品、计算机、管理相关专业优先</li><li>对AI技术和智慧城市建设有浓厚兴趣</li><li>具备市场调研和商业分析能力</li><li>良好的产品设计和原型制作能力</li><li>愿意在雄安新区发展的应届生优先</li></ul>",
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
    job_description: "<h3>职位职责：</h3><ul><li>协助执行光电产品线的市场洞察和需求分析</li><li>参与产品规划与技术路标的制定工作</li><li>支持光电产品开发项目的全流程管理</li><li>与研发团队协作，推动产品技术创新</li><li>分析行业趋势，识别新的产品机会</li></ul><h3>任职要求：</h3><ul><li>硕士及以上学历，光电、物理、电子工程相关专业</li><li>对光电技术和产业发展有深入了解</li><li>具备良好的技术理解和产品思维能力</li><li>优秀的项目管理和团队协作能力</li><li>2026届应届硕士毕业生优先</li></ul>",
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
    job_description: "<h3>职位职责：</h3><ul><li>负责助贷产品的全生命周期管理</li><li>深入分析信贷业务问题，提出解决方案</li><li>优化产品流程，提升用户体验和业务效率</li><li>与风控、技术、运营团队协作推进产品迭代</li><li>监控产品数据表现，制定数据驱动的优化策略</li></ul><h3>任职要求：</h3><ul><li>本科及以上学历，金融、计算机、数学相关专业优先</li><li>对金融科技和信贷业务有深入理解</li><li>具备优秀的业务分析和产品设计能力</li><li>熟悉移动APP产品开发流程</li><li>欢迎金融背景应届生投递简历</li></ul>",
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
      console.error("获取数据总数失败:", countError.message || countError)
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
      console.error("获取机会数据失败:", error.message || error)
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
      console.error("获取筛选结果总数失败:", countError.message || countError)
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
        console.error("获取筛选结果失败:", error.message || error)
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
      console.error("获取随机筛选结果失败:", error.message || error)
      return filterLocalOpportunities(filters)
    }

    console.log(`成功获取 ${data?.length || 0} 条随机筛选结果`)
    return (data || []).map(transformDatabaseToEnhanced)
  } catch (error) {
    console.error("搜索增强机会时出错:", error.message || error)
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
      console.error("数据库连接失败:", connectionError.message || connectionError)
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
    // 添加职位描述字段映射
    job_description: dbData.job_description || dbData.description || dbData.reason,
    salary_range: dbData.salary_range,
    job_type: dbData.job_type,
    experience_required: dbData.experience_required,
    education_required: dbData.education_required,
    company_size: dbData.company_size,
    industry: dbData.industry,
    benefits: dbData.benefits,
    application_deadline: dbData.application_deadline,
    posted_date: dbData.posted_date,
  }
}
