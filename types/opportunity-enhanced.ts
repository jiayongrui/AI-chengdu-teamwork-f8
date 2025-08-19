// 增强的机会类型定义
export interface OpportunityEnhanced {
  id: string
  company_name: string
  job_title: string
  location?: string
  funding_stage?: string
  job_level?: string
  tags?: string[]
  reason?: string
  contact_email?: string
  contact_person?: string
  company_logo?: string
  priority: number // 1-10 优先级，替代 urgency_level
  created_at: string
  updated_at: string
  expires_at?: string
  is_active: boolean
  // BOSS直聘风格新增字段
  salary_range?: string
  job_type?: string
  experience_required?: string
  education_required?: string
  job_description?: string
  company_size?: string
  industry?: string
  benefits?: string
  application_deadline?: string
  posted_date?: string
}

// 兼容旧版本的机会类型
export interface Opportunity {
  id: string
  company: string
  title: string
  city?: string
  tags: string[]
  reason?: string
}

// 转换函数：从增强版转换为简化版
export function convertToSimpleOpportunity(enhanced: OpportunityEnhanced): Opportunity {
  return {
    id: enhanced.id,
    company: enhanced.company_name,
    title: enhanced.job_title,
    city: enhanced.location,
    tags: enhanced.tags || [],
    reason: enhanced.reason,
  }
}

// 搜索过滤器类型定义
export interface OpportunityFilters {
  keyword?: string
  location?: string
  fundingStage?: string
  jobLevel?: string
  priority?: number // 替代 urgencyLevel
  limit?: number
}

// 机会统计类型定义
export interface OpportunityStatistics {
  total_opportunities: number
  active_opportunities: number
  high_priority_opportunities: number // 替代 urgent_opportunities
  expiring_soon: number
  unique_companies: number
}
