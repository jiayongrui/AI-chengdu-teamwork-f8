import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"

// 请求体类型定义
interface OnboardingRequest {
  userId: string  // 由于项目使用自定义认证，需要前端传递userId
  city: string
  keywords: string[]
  salary: string
}

export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    let payload: OnboardingRequest
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json(
        { error: "无效的请求体" }, 
        { status: 400 }
      )
    }

    const { userId, city, keywords, salary } = payload

    // 验证必要参数
    if (!userId) {
      return NextResponse.json(
        { error: "用户未登录，缺少userId" }, 
        { status: 401 }
      )
    }

    if (!city || !keywords || !salary) {
      return NextResponse.json(
        { error: "缺少必要参数：city, keywords, salary" }, 
        { status: 400 }
      )
    }

    // 验证keywords是数组
    if (!Array.isArray(keywords)) {
      return NextResponse.json(
        { error: "keywords必须是字符串数组" }, 
        { status: 400 }
      )
    }

    // 获取Supabase客户端
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "数据库连接失败" }, 
        { status: 500 }
      )
    }

    // 验证用户是否存在
    const { data: userExists, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (userCheckError || !userExists) {
      return NextResponse.json(
        { error: "用户不存在或已失效" }, 
        { status: 401 }
      )
    }

    // 更新用户的求职偏好信息
    // 在更新用户偏好时同时更新时间戳
    const { data, error } = await supabase
      .from('users')
      .update({
        target_city: city,
        target_keywords: keywords,
        target_salary: salary,
        preferences_updated_at: new Date().toISOString() // 添加时间戳
      })
      .eq('id', userId)
      .select('id, username, target_city, target_keywords, target_salary, preferences_updated_at')
      .single()

    if (error) {
      console.error('更新用户求职偏好失败:', error)
      return NextResponse.json(
        { 
          error: "更新失败", 
          message: error.message 
        }, 
        { status: 500 }
      )
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "求职偏好更新成功",
      data: {
        userId: data.id,
        username: data.username,
        preferences: {
          city: data.target_city,
          keywords: data.target_keywords,
          salary: data.target_salary
        }
      }
    })

  } catch (error) {
    console.error('Onboarding API错误:', error)
    return NextResponse.json(
      { 
        error: "服务器内部错误", 
        message: error instanceof Error ? error.message : "未知错误" 
      }, 
      { status: 500 }
    )
  }
}

// GET方法：获取用户当前的求职偏好
export async function GET(req: NextRequest) {
  try {
    // 从URL参数获取userId
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: "缺少userId参数" }, 
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "数据库连接失败" }, 
        { status: 500 }
      )
    }

    // 获取用户的求职偏好
    const { data, error } = await supabase
      .from('users')
      .select('id, username, target_city, target_keywords, target_salary')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "用户不存在" }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: data.id,
        username: data.username,
        preferences: {
          city: data.target_city,
          keywords: data.target_keywords,
          salary: data.target_salary
        }
      }
    })

  } catch (error) {
    console.error('获取用户偏好错误:', error)
    return NextResponse.json(
      { 
        error: "服务器内部错误", 
        message: error instanceof Error ? error.message : "未知错误" 
      }, 
      { status: 500 }
    )
  }
}