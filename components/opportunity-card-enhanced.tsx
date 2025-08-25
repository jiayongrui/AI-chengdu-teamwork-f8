"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Building2, MapPin, Clock, Star, Mail, User, Briefcase, GraduationCap, Calendar, DollarSign, ChevronDown, ChevronUp, Loader2, Phone } from "lucide-react"
import type { OpportunityEnhanced } from "@/types/opportunity-enhanced"
import { OpportunityDetailDialog } from "./opportunity-detail-dialog"
import ScoreBreakdown from "./score-breakdown"
import GapAnalysisView from "./gap-analysis-view"

interface OpportunityCardEnhancedProps {
  opportunity: OpportunityEnhanced
  onApply: (opportunity: OpportunityEnhanced) => void
  score?: number
  userId?: string
}

interface ScoreData {
  dimension: string
  score: number
  weight: number
}

interface GapAnalysisData {
  overall_score: number
  dimension_scores: Array<{
    dimension: string
    score: number
    weight: number
    strengths: Array<{
      point: string
      resume_evidence: string
      jd_requirement: string
    }>
    gaps: Array<{
      point: string
      suggestion: string
    }>
  }>
  optimization_suggestions: Array<{
    category: string
    suggestions: string[]
  }>
  description_rewrite_examples: Array<{
    original: string
    optimized: string
    improvement_points: string[]
  }>
  missing_opportunities: Array<{
    opportunity: string
    impact: string
    action_plan: string
  }>
}

export function OpportunityCardEnhanced({ opportunity, onApply, score, userId }: OpportunityCardEnhancedProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false)
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreData[] | null>(null)
  const [showGapAnalysis, setShowGapAnalysis] = useState(false)
  const [isLoadingGapAnalysis, setIsLoadingGapAnalysis] = useState(false)
  const [gapAnalysisData, setGapAnalysisData] = useState<GapAnalysisData | null>(null)
  const [gapAnalysisError, setGapAnalysisError] = useState<string | null>(null)

  const fetchScoreBreakdown = async () => {
    if (!userId || !opportunity.id || scoreBreakdown) return
    
    setIsLoadingBreakdown(true)
    try {
      const response = await fetch('/api/score-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          opportunityId: opportunity.id
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Score breakdown API response:', data)
        // API返回的数据结构：{ breakdown: [...] }
        setScoreBreakdown(data.breakdown || [])
      } else {
        console.error('Score breakdown API error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch score breakdown:', error)
    } finally {
      setIsLoadingBreakdown(false)
    }
  }

  const fetchGapAnalysis = async () => {
    if (!userId || !opportunity.id || gapAnalysisData) return
    
    setIsLoadingGapAnalysis(true)
    setGapAnalysisError(null)
    try {
      const response = await fetch('/api/gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          opportunityId: opportunity.id
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        // 修复：正确提取数据
        if (result.success && result.data) {
          setGapAnalysisData(result.data)
        } else {
          setGapAnalysisError('分析数据格式错误，请稍后重试')
        }
      } else {
        // 增强错误处理：显示具体错误信息
        const errorResult = await response.json().catch(() => null)
        const errorMessage = errorResult?.error || '获取分析数据失败，请稍后重试'
        setGapAnalysisError(errorMessage)
        
        // 输出调试信息
        if (errorResult?.debug_info) {
          console.error('Gap analysis debug info:', errorResult.debug_info)
        }
      }
    } catch (error) {
      console.error('Failed to fetch gap analysis:', error)
      setGapAnalysisError('网络错误，请检查网络连接')
    } finally {
      setIsLoadingGapAnalysis(false)
    }
  }

  const handleGapAnalysisClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowGapAnalysis(!showGapAnalysis)
    if (!showGapAnalysis && !gapAnalysisData) {
      fetchGapAnalysis()
    }
  }

  const handleScoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
    if (!isExpanded && !scoreBreakdown) {
      fetchScoreBreakdown()
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "bg-red-100 text-red-800 border-red-200"
    if (priority >= 6) return "bg-orange-100 text-orange-800 border-orange-200"
    if (priority >= 4) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return "高优先级"
    if (priority >= 6) return "中优先级"
    if (priority >= 4) return "普通"
    return "低优先级"
  }

  // 替换原有的getScoreColor函数
  const getScoreColor = (score: number) => {
    const bgColor = getScoreBackgroundColor(score)
    const textColor = getScoreTextColor(score)
    const borderColor = getScoreBorderColor(score)
    return `${bgColor} ${textColor} ${borderColor}`
  }

  // 根据评分返回对应的等级标签 - 积极化表述
  const getScoreLabel = (score: number) => {
    if (score >= 80) return "优势匹配"  // 原"高匹配" -> "优势匹配"
    if (score >= 60) return "成长潜力"  // 原"中等匹配" -> "成长潜力"
    return "发展机会"                   // 原"低匹配" -> "发展机会"
  }

  const isExpiringSoon =
    opportunity.expires_at && new Date(opportunity.expires_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <>
      <OpportunityDetailDialog 
        opportunity={opportunity}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onApply={onApply}
      />
      <Card 
        className={`h-full flex flex-col hover:shadow-lg transition-all duration-200 cursor-pointer ${
          score !== undefined 
            ? `border-2 ${getScoreBorderColor(score)} ${getScoreBackgroundColor(score)}/10` 
            : 'border border-gray-200'
        }`}
        onClick={() => setShowDetail(true)}
      >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {opportunity.company_logo ? (
              <img
                src={opportunity.company_logo || "/placeholder.svg"}
                alt={`${opportunity.company_name} logo`}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  target.nextElementSibling?.classList.remove("hidden")
                }}
              />
            ) : null}
            <div
              className={`w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 ${opportunity.company_logo ? "hidden" : ""}`}
            >
              <Building2 size={20} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{opportunity.company_name}</h3>
              <p className="text-gray-600 text-sm truncate">{opportunity.job_title}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end flex-shrink-0">
            {score !== undefined && (
              <div 
                className="cursor-pointer hover:opacity-80 rounded-lg p-1 transition-all duration-200"
                onClick={handleScoreClick}
              >
                <Badge className={`${getScoreColor(score)} text-xs px-2 py-1 font-semibold flex items-center gap-1 border`}>
                  {getScoreLabel(score)} {score.toFixed(1)}
                  {isLoadingBreakdown ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : isExpanded ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        <div className="space-y-3">
          {/* 薪资信息 - BOSS直聘风格 */}
          <div className="flex items-center">
            <span className="text-red-500 font-bold text-lg">{(opportunity as any).salary_range || "面议"}</span>
          </div>
          
          {/* 工作要求信息 - BOSS直聘风格 */}
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            {opportunity.location && (
              <div className="flex items-center gap-1">
                <MapPin size={14} className="flex-shrink-0" />
                <span className="truncate">{opportunity.location}</span>
              </div>
            )}
            {(opportunity as any).experience_required && (
              <div className="flex items-center gap-1">
                <Briefcase size={14} className="flex-shrink-0" />
                <span className="truncate">{(opportunity as any).experience_required}</span>
              </div>
            )}
            {(opportunity as any).education_required && (
              <div className="flex items-center gap-1">
                <GraduationCap size={14} className="flex-shrink-0" />
                <span className="truncate">{(opportunity as any).education_required}</span>
              </div>
            )}
          </div>

          {/* 公司信息 - BOSS直聘风格 */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {(opportunity as any).company_size && (
              <span className="bg-gray-100 px-2 py-1 rounded">{(opportunity as any).company_size}</span>
            )}
            {(opportunity as any).industry && (
              <span className="bg-gray-100 px-2 py-1 rounded">{(opportunity as any).industry}</span>
            )}
          </div>

          {/* 联系信息 */}
          <div className="space-y-1">
            {opportunity.contact_person && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={14} className="flex-shrink-0" />
                <span className="truncate">{opportunity.contact_person}</span>
              </div>
            )}
            {opportunity.contact_email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="flex-shrink-0" />
                <span className="truncate">{opportunity.contact_email}</span>
              </div>
            )}
            {opportunity.contact_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="flex-shrink-0" />
                <span className="truncate">{opportunity.contact_phone}</span>
              </div>
            )}
          </div>

          {/* 标签 */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {opportunity.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                  {tag}
                </Badge>
              ))}
              {opportunity.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  +{opportunity.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 福利标签 - BOSS直聘风格 */}
          {(opportunity as any).benefits && (
            <div className="flex flex-wrap gap-1">
              {(opportunity as any).benefits.split('、').slice(0, 3).map((benefit: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                  {benefit}
                </Badge>
              ))}
              {(opportunity as any).benefits.split('、').length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                  +{(opportunity as any).benefits.split('、').length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 推荐理由 */}
          {opportunity.reason && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{opportunity.reason}</p>
            </div>
          )}

          {/* 评分详情展开区域 */}
          {isExpanded && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              {isLoadingBreakdown ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">加载评分详情...</span>
                </div>
              ) : scoreBreakdown && scoreBreakdown.length > 0 ? (
                <div className="space-y-4">
                  <ScoreBreakdown scoreData={scoreBreakdown} />
                  
                  {/* 简历分析按钮 */}
                  <div className="border-t border-gray-200 pt-4">
                    <Button
                      onClick={handleGapAnalysisClick}
                      variant="outline"
                      className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200 text-purple-700 font-medium"
                      disabled={isLoadingGapAnalysis}
                    >
                      {isLoadingGapAnalysis ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          AI分析中，请稍候...
                        </>
                      ) : showGapAnalysis ? (
                        <>
                          <ChevronUp size={16} className="mr-2" />
                          收起简历与岗位匹配度分析
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} className="mr-2" />
                          进行简历与岗位匹配度分析
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* 简历分析结果展示区域 */}
                  {showGapAnalysis && (
                    <div className="border-t border-gray-200 pt-4">
                      {isLoadingGapAnalysis ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 size={24} className="animate-spin text-purple-500" />
                          <span className="ml-3 text-sm text-gray-600">AI正在分析您的简历与岗位匹配度，请稍候...</span>
                        </div>
                      ) : gapAnalysisError ? (
                        <div className="text-center py-6">
                          <p className="text-red-500 text-sm mb-2">{gapAnalysisError}</p>
                          <Button
                            onClick={() => {
                              setGapAnalysisError(null)
                              fetchGapAnalysis()
                            }}
                            size="sm"
                            variant="outline"
                          >
                            重试
                          </Button>
                        </div>
                      ) : gapAnalysisData ? (
                        <GapAnalysisView analysisData={gapAnalysisData} />
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-500">
                          暂无分析数据
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  暂无评分详情数据
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-gray-500">
            {formatDate(opportunity.created_at)}
            {opportunity.expires_at && <span className="ml-2">· 截止 {formatDate(opportunity.expires_at)}</span>}
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onApply(opportunity);
            }}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            申请职位
          </Button>
        </div>
      </CardFooter>
    </Card>
    </>
  )
}

/**
 * 根据评分获取对应的背景色类名
 * @param score 0-100的数值
 * @returns 对应的Tailwind背景色类名
 */
function getScoreBackgroundColor(score: number): string {
  if (score >= 80) return 'bg-amber-400';  // 荣耀金 - 成就阶段
  if (score >= 60) return 'bg-teal-400';   // 活力青 - 成长阶段
  return 'bg-slate-200';                   // 潜力灰 - 潜力阶段
}

/**
 * 根据评分获取对应的文字颜色类名
 * @param score 0-100的数值
 * @returns 对应的Tailwind文字颜色类名
 */
function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-amber-900';
  if (score >= 60) return 'text-teal-900';
  return 'text-slate-700';
}

/**
 * 根据评分获取对应的边框颜色类名
 * @param score 0-100的数值
 * @returns 对应的Tailwind边框颜色类名
 */
function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-amber-300';
  if (score >= 60) return 'border-teal-300';
  return 'border-slate-300';
}
