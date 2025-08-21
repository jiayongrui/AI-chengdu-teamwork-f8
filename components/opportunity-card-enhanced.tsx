"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Building2, MapPin, Clock, Star, Mail, User, Briefcase, GraduationCap, Calendar, DollarSign } from "lucide-react"
import type { OpportunityEnhanced } from "@/types/opportunity-enhanced"
import { OpportunityDetailDialog } from "./opportunity-detail-dialog"

interface OpportunityCardEnhancedProps {
  opportunity: OpportunityEnhanced
  onApply: (opportunity: OpportunityEnhanced) => void
  score?: number
}

export function OpportunityCardEnhanced({ opportunity, onApply, score }: OpportunityCardEnhancedProps) {
  const [showDetail, setShowDetail] = useState(false)
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
        className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200 border border-gray-200 cursor-pointer"
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
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1 font-semibold">
                评分: {score.toFixed(1)}
              </Badge>
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
