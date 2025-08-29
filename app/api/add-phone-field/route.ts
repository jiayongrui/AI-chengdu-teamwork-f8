import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // 先检查字段是否已存在
    const { data: checkData, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'opportunities')
      .eq('column_name', 'contact_phone')
    
    if (checkError) {
      console.error('检查字段失败:', checkError)
      // 继续尝试添加字段
    }
    
    const fieldExists = checkData && checkData.length > 0
    
    if (fieldExists) {
      return NextResponse.json({
        success: true,
        message: 'contact_phone字段已存在',
        fieldExists: true
      })
    }

    // 使用原生SQL添加字段（通过更新一个虚拟记录来触发schema更新）
    // 由于Supabase限制，我们需要手动在数据库中添加字段
    return NextResponse.json({
      success: false,
      error: '需要手动添加字段',
      message: '请在Supabase控制台中手动执行: ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_phone TEXT;',
      sqlCommand: 'ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_phone TEXT;'
    }, { status: 400 })

  } catch (error) {
    console.error('添加字段时出错:', error)
    return NextResponse.json(
      {
        success: false,
        error: '添加字段失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// GET 方法用于检查字段是否存在
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    // 检查字段是否存在
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'opportunities')
      .eq('column_name', 'contact_phone')

    if (error) {
      throw error
    }

    const fieldExists = data && data.length > 0

    return NextResponse.json({
      success: true,
      fieldExists: fieldExists,
      message: fieldExists ? 'contact_phone字段已存在' : 'contact_phone字段不存在'
    })

  } catch (error) {
    console.error('检查字段时出错:', error)
    return NextResponse.json(
      {
        success: false,
        error: '检查字段失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}