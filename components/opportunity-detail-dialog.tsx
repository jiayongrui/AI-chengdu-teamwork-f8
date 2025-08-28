"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Clock, Star, Mail, User, Briefcase, GraduationCap, Calendar, DollarSign, Phone } from "lucide-react"
import type { OpportunityEnhanced } from "@/types/opportunity-enhanced"

interface OpportunityDetailDialogProps {
  opportunity: OpportunityEnhanced | null
  open: boolean
  onClose: () => void
  onApply: (opportunity: OpportunityEnhanced) => void
}

export function OpportunityDetailDialog({ opportunity, open, onClose, onApply }: OpportunityDetailDialogProps) {
  if (!opportunity) return null

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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {opportunity.company_logo ? (
                <img
                  src={opportunity.company_logo || "/placeholder.svg"}
                  alt={`${opportunity.company_name} logo`}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    target.nextElementSibling?.classList.remove("hidden")
                  }}
                />
              ) : null}
              <div
                className={`w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 ${opportunity.company_logo ? "hidden" : ""}`}
              >
                <Building2 size={24} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-bold text-gray-900">{opportunity.job_title}</DialogTitle>
                <p className="text-gray-600">{opportunity.company_name}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end flex-shrink-0">

            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 薪资信息 */}
          <div className="flex items-center">
            <DollarSign size={20} className="text-red-500 mr-2" />
            <span className="text-red-500 font-bold text-xl">{(opportunity as any).salary_range || "面议"}</span>
          </div>
          
          {/* 工作要求信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">工作地点</p>
                <p className="font-medium">{opportunity.location || "不限"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">经验要求</p>
                <p className="font-medium">{(opportunity as any).experience_required || "不限"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">学历要求</p>
                <p className="font-medium">{(opportunity as any).education_required || "不限"}</p>
              </div>
            </div>
          </div>

          {/* 公司信息 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">公司信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">公司规模</p>
                <p className="font-medium">{(opportunity as any).company_size || "未知"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">所属行业</p>
                <p className="font-medium">{(opportunity as any).industry || "未知"}</p>
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">联系方式</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunity.contact_person && (
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-500" />
                  <span>{opportunity.contact_person}</span>
                </div>
              )}
              {opportunity.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-500" />
                  <span>{opportunity.contact_email}</span>
                </div>
              )}
              {opportunity.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-500" />
                  <span>{opportunity.contact_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* 职位描述 */}
          <div>
            <h3 className="font-semibold mb-2">职位描述</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="prose max-w-none">
                {(opportunity as any).job_description ? (
                  <div dangerouslySetInnerHTML={{ __html: (opportunity as any).job_description.replace(/\n/g, '<br/>') }} />
                ) : (
                  <p className="text-gray-500">暂无详细描述</p>
                )}
              </div>
            </div>
          </div>

          {/* 福利标签 */}
          {(opportunity as any).benefits && (
            <div>
              <h3 className="font-semibold mb-2">公司福利</h3>
              <div className="flex flex-wrap gap-2">
                {(opportunity as any).benefits.split('、').map((benefit: string, index: number) => (
                  <Badge key={index} variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 标签 */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">职位标签</h3>
              <div className="flex flex-wrap gap-2">
                {opportunity.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 推荐理由 */}
          {opportunity.reason && (
            <div>
              <h3 className="font-semibold mb-2">推荐理由</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{opportunity.reason}</p>
              </div>
            </div>
          )}

          {/* 日期信息 */}
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              <Calendar size={14} className="inline mr-1" />
              发布于 {formatDate(opportunity.created_at)}
            </div>
            {opportunity.expires_at && (
              <div>
                <Clock size={14} className="inline mr-1" />
                截止日期 {formatDate(opportunity.expires_at)}
              </div>
            )}
          </div>

          {/* 申请按钮 */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={() => {
                onApply(opportunity)
                onClose()
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              破冰邮件
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}