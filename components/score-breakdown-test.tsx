"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ScoreBreakdown from '@/components/score-breakdown'
import { Loader2 } from 'lucide-react'

interface ScoreBreakdownData {
  totalScore: number
  rating: string
  breakdown: Array<{
    dimension: string
    score: number
    weight: number
  }>
  data?: any
}

export function ScoreBreakdownTest() {
  const [userId, setUserId] = useState('')
  const [opportunityId, setOpportunityId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScoreBreakdownData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    if (!userId || !opportunityId) {
      setError('请输入 userId 和 opportunityId')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/score-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          opportunityId: opportunityId
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || '请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown API 测试</CardTitle>
          <CardDescription>
            测试新的 /api/score-breakdown 接口功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="输入用户ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opportunityId">Opportunity ID</Label>
              <Input
                id="opportunityId"
                placeholder="输入职位ID"
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleTest} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? '测试中...' : '测试接口'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">错误</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API 响应结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>总分:</strong> {result.totalScore}</p>
                <p><strong>推荐等级:</strong> {result.rating}</p>
                <p><strong>成功状态:</strong> {result.success ? '成功' : '失败'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>评分详情展示</CardTitle>
              <CardDescription>
                使用 ScoreBreakdown 组件展示评分数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown scoreData={result.breakdown} />
            </CardContent>
          </Card>

          {result.data && (
            <Card>
              <CardHeader>
                <CardTitle>详细数据 (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>1. 输入有效的 userId 和 opportunityId</p>
          <p>2. 点击"测试接口"按钮</p>
          <p>3. 查看返回的评分数据和可视化展示</p>
          <p className="text-sm text-gray-600">
            注意：需要确保数据库中存在对应的用户简历和职位信息
          </p>
        </CardContent>
      </Card>
    </div>
  )
}