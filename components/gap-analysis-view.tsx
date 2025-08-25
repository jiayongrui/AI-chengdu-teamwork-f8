"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Lightbulb, Rocket, TrendingUp, AlertTriangle, BookOpen, Target, Star } from 'lucide-react'

// 定义分析数据的类型接口
interface DimensionScore {
  score: number
  max_score: number
  reason: string
}

interface AnalysisData {
  overall_score: number
  dimension_scores: {
    background_experience: DimensionScore
    professional_skills: DimensionScore
    product_works: DimensionScore
    core_competency: DimensionScore
    development_potential: DimensionScore
  }
  optimization_suggestions: {
    [key: string]: string[]
  }
  rewrite_examples: Array<{
    original: string
    optimized: string
  }>
  missing_opportunities: string[]
  summary: string
}

interface GapAnalysisViewProps {
  analysisData: AnalysisData
}

const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({ analysisData }) => {
  // 添加数据验证
  if (!analysisData || !analysisData.dimension_scores) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            分析数据加载失败，请稍后重试。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // 计算优势项（得分率 >= 70%）
  const getStrengths = () => {
    const strengths = []
    const dimensions = analysisData.dimension_scores
    
    // 添加安全检查
    if (!dimensions) return []
    
    Object.entries(dimensions).forEach(([key, value]) => {
      // 添加 value 的安全检查
      if (!value || typeof value.score !== 'number' || typeof value.max_score !== 'number') {
        return
      }
      
      const scoreRate = (value.score / value.max_score) * 100
      if (scoreRate >= 70) {
        strengths.push({
          dimension: getDimensionName(key),
          score: value.score,
          maxScore: value.max_score,
          reason: value.reason || '暂无说明',
          scoreRate
        })
      }
    })
    
    return strengths
  }

  // 计算待补充项（得分率 < 70%）
  const getGaps = () => {
    const gaps = []
    const dimensions = analysisData.dimension_scores
    
    // 添加安全检查
    if (!dimensions) return []
    
    Object.entries(dimensions).forEach(([key, value]) => {
      // 添加 value 的安全检查
      if (!value || typeof value.score !== 'number' || typeof value.max_score !== 'number') {
        return
      }
      
      const scoreRate = (value.score / value.max_score) * 100
      if (scoreRate < 70) {
        gaps.push({
          dimension: getDimensionName(key),
          score: value.score,
          maxScore: value.max_score,
          reason: value.reason || '暂无说明',
          scoreRate,
          suggestions: (analysisData.optimization_suggestions && analysisData.optimization_suggestions[key]) || []
        })
      }
    })
    
    return gaps
  }

  // 获取维度中文名称
  const getDimensionName = (key: string): string => {
    const nameMap: { [key: string]: string } = {
      background_experience: '背景与经验',
      professional_skills: '专业知识与技能',
      product_works: '产品作品与成果',
      core_competency: '核心胜任力',
      development_potential: '发展潜力'
    }
    return nameMap[key] || key
  }

  // 获取得分率对应的颜色
  const getScoreColor = (scoreRate: number): string => {
    if (scoreRate >= 80) return 'bg-green-100 text-green-800'
    if (scoreRate >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const strengths = getStrengths()
  const gaps = getGaps()

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* 总体评分卡片 */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            简历分析报告
          </CardTitle>
          <CardDescription className="text-lg">
            总体评分：<span className="text-2xl font-bold text-blue-600">{analysisData.overall_score}</span>/100
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="text-base">
              {analysisData.summary}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 主要内容区域 - 左右两栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左栏：您的优势 */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              您的优势 (Strengths)
            </CardTitle>
            <CardDescription>
              这些是您简历中表现突出的方面
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {strengths.length > 0 ? (
              strengths.map((strength, index) => (
                <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-800">{strength.dimension}</h4>
                    <Badge className={getScoreColor(strength.scoreRate)}>
                      {strength.score}/{strength.maxScore}
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700">{strength.reason}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>暂无突出优势项，建议重点提升各维度表现</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右栏：待补充项 */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              待补充项 (Gaps)
            </CardTitle>
            <CardDescription>
              这些方面需要重点改进和提升
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gaps.map((gap, index) => (
              <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-orange-800">{gap.dimension}</h4>
                  <Badge className={getScoreColor(gap.scoreRate)}>
                    {gap.score}/{gap.maxScore}
                  </Badge>
                </div>
                <p className="text-sm text-orange-700 mb-3">{gap.reason}</p>
                
                {/* 改进建议 */}
                {gap.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="flex items-center gap-1 text-sm font-medium text-orange-800">
                      <Lightbulb className="h-4 w-4" />
                      改进建议：
                    </h5>
                    <ul className="space-y-1">
                      {gap.suggestions.map((suggestion, suggestionIndex) => (
                        <li key={suggestionIndex} className="flex items-start gap-2 text-sm">
                          <Rocket className="h-3 w-3 mt-0.5 text-orange-600 flex-shrink-0" />
                          <span className="text-orange-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 知识补充建议区域 */}
      {gaps.length > 0 && (
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <BookOpen className="h-6 w-6" />
              💡 知识补充建议 - 拿下心仪岗位的关键
            </CardTitle>
            <CardDescription className="text-base">
              根据您的简历分析，以下是针对性的学习建议，帮助您快速提升岗位匹配度
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gaps.map((gap, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-800">{gap.dimension}</h4>
                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                      提升空间: {(100 - gap.scoreRate).toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                      <p className="text-sm text-red-700 font-medium">当前不足：</p>
                      <p className="text-sm text-red-600">{gap.reason}</p>
                    </div>
                    
                    {gap.suggestions.length > 0 && (
                      <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                        <p className="text-sm text-green-700 font-medium mb-2 flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          具体行动计划：
                        </p>
                        <ul className="space-y-1">
                          {gap.suggestions.map((suggestion, suggestionIndex) => (
                            <li key={suggestionIndex} className="flex items-start gap-2 text-sm">
                              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                              <span className="text-green-700">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 总结性建议 */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">🎯 快速提升建议</h4>
              </div>
              <p className="text-sm text-blue-700">
                建议您优先关注评分较低的维度，特别是 <strong>{gaps[0]?.dimension}</strong>。
                通过系统性学习和实践，预计可在 2-3 个月内显著提升岗位匹配度。
                记住：每一个小的改进都会让您更接近心仪的岗位！
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 底部：改写示例和缺失机会 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 改写示例 */}
        {analysisData.rewrite_examples && analysisData.rewrite_examples.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                描述改写示例
              </CardTitle>
              <CardDescription>
                参考以下示例优化您的项目描述
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisData.rewrite_examples.map((example, index) => (
                <div key={index} className="space-y-3">
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <h5 className="text-sm font-medium text-red-800 mb-1">优化前：</h5>
                    <p className="text-sm text-red-700">{example.original}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <h5 className="text-sm font-medium text-green-800 mb-1">优化后：</h5>
                    <p className="text-sm text-green-700">{example.optimized}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 缺失的机会点 */}
        {analysisData.missing_opportunities && analysisData.missing_opportunities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-purple-600" />
                关键加分项
              </CardTitle>
              <CardDescription>
                补充这些内容将显著提升简历竞争力
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysisData.missing_opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Rocket className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default GapAnalysisView