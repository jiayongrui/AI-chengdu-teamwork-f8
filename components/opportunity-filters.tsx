"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"

interface OpportunityFiltersProps {
  onFiltersChange: (filters: any) => void
}

export function OpportunityFilters({ onFiltersChange }: OpportunityFiltersProps) {
  const [filters, setFilters] = useState({
    keyword: "",
    location: "",
    fundingStage: "全部",
    jobLevel: "全部",
    priority: "全部",
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    // 过滤掉空值
    const activeFilters = Object.entries(newFilters).reduce((acc, [k, v]) => {
      if (v && v.trim()) {
        acc[k] = v.trim()
      }
      return acc
    }, {} as any)

    onFiltersChange(activeFilters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      keyword: "",
      location: "",
      fundingStage: "全部",
      jobLevel: "全部",
      priority: "全部",
    }
    setFilters(emptyFilters)
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some((value) => value && value.trim())

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="搜索公司名称或职位..."
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2">
          <Filter size={16} />
          高级筛选
        </Button>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-transparent"
          >
            <X size={16} />
            清空
          </Button>
        )}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
            <Input
              placeholder="如：北京、上海"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">融资阶段</label>
            <Select value={filters.fundingStage} onValueChange={(value) => handleFilterChange("fundingStage", value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择融资阶段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="种子轮">种子轮</SelectItem>
                <SelectItem value="天使轮">天使轮</SelectItem>
                <SelectItem value="A轮">A轮</SelectItem>
                <SelectItem value="B轮">B轮</SelectItem>
                <SelectItem value="C轮">C轮</SelectItem>
                <SelectItem value="D轮及以后">D轮及以后</SelectItem>
                <SelectItem value="已上市">已上市</SelectItem>
                <SelectItem value="未融资">未融资</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">职位级别</label>
            <Select value={filters.jobLevel} onValueChange={(value) => handleFilterChange("jobLevel", value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择职位级别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="实习生">实习生</SelectItem>
                <SelectItem value="应届生">应届生</SelectItem>
                <SelectItem value="初级">初级</SelectItem>
                <SelectItem value="中级">中级</SelectItem>
                <SelectItem value="高级">高级</SelectItem>
                <SelectItem value="专家">专家</SelectItem>
                <SelectItem value="管理层">管理层</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部</SelectItem>
                <SelectItem value="8">高优先级 (8-10)</SelectItem>
                <SelectItem value="6">中优先级 (6-7)</SelectItem>
                <SelectItem value="4">普通 (4-5)</SelectItem>
                <SelectItem value="1">低优先级 (1-3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || !value.trim()) return null

              const labels: Record<string, string> = {
                keyword: "关键词",
                location: "地点",
                fundingStage: "融资阶段",
                jobLevel: "职位级别",
                priority: "优先级",
              }

              return (
                <div
                  key={key}
                  className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                >
                  <span>
                    {labels[key]}: {value}
                  </span>
                  <button onClick={() => handleFilterChange(key, "")} className="hover:bg-green-200 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
