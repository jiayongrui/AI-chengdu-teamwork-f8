import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// 公司联系信息更新数据
const COMPANY_CONTACTS = [
  {
    company_name: '上海缠山科技有限公司',
    contact_email: '1119143624@qq.com',
    contact_phone: null
  },
  {
    company_name: '辛恩励科技有限公司',
    contact_email: null,
    contact_phone: '18512176096'
  },
  {
    company_name: '杭州知行元科技',
    contact_email: '18796827019@163.com',
    contact_phone: '18796827019'
  },
  {
    company_name: '蜜蜂数联',
    contact_email: 'mifengshulian@hotmai',
    contact_phone: '13637920466'
  },
  {
    company_name: '皓域科技（河北）有限责任公司',
    contact_email: null,
    contact_phone: '15612272355'
  },
  {
    company_name: '雄安九典科技有限公司',
    contact_email: null,
    contact_phone: '15251832263'
  },
  {
    company_name: '苏州苏纳光电有限公司',
    contact_email: 'yyhuang2006@sinano.ac.cn',
    contact_phone: '13306136603'
  },
  {
    company_name: '聚合吧科技有限公司',
    contact_email: '15589871755@139.com',
    contact_phone: '15589871755'
  }
]

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    // 注意：由于Supabase限制，暂时只更新contact_email字段
    // contact_phone字段需要在数据库控制台手动添加

    const results = []
    let successCount = 0
    let errorCount = 0

    // 批量更新每个公司的联系信息
    for (const contact of COMPANY_CONTACTS) {
      try {
        // 构建更新对象，暂时只更新邮箱字段
        const updateData: any = {}
        if (contact.contact_email) {
          updateData.contact_email = contact.contact_email
        }
        // 暂时跳过电话字段更新，需要先在数据库中添加contact_phone字段
        // if (contact.contact_phone) {
        //   updateData.contact_phone = contact.contact_phone
        // }

        // 如果没有要更新的数据，跳过
        if (Object.keys(updateData).length === 0) {
          results.push({
            company: contact.company_name,
            status: 'skipped',
            message: '无联系信息需要更新'
          })
          continue
        }

        // 使用模糊匹配更新公司信息
        const { data, error } = await supabase
          .from('opportunities')
          .update(updateData)
          .ilike('company_name', `%${contact.company_name}%`)
          .select('id, company_name')

        if (error) {
          console.error(`更新 ${contact.company_name} 失败:`, error)
          results.push({
            company: contact.company_name,
            status: 'error',
            message: error.message
          })
          errorCount++
        } else {
          const updatedCount = data?.length || 0
          results.push({
            company: contact.company_name,
            status: 'success',
            message: `成功更新 ${updatedCount} 条记录`,
            updatedRecords: updatedCount,
            data: data
          })
          successCount += updatedCount
        }
      } catch (err) {
        console.error(`处理 ${contact.company_name} 时出错:`, err)
        results.push({
          company: contact.company_name,
          status: 'error',
          message: err instanceof Error ? err.message : '未知错误'
        })
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `批量更新完成：成功 ${successCount} 条，失败 ${errorCount} 条`,
      summary: {
        totalCompanies: COMPANY_CONTACTS.length,
        successfulUpdates: successCount,
        errors: errorCount
      },
      details: results
    })

  } catch (error) {
    console.error('批量更新联系信息失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '批量更新失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// GET 方法用于查询当前联系信息状态
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    // 查询所有相关公司的当前联系信息
    const companyNames = COMPANY_CONTACTS.map(c => c.company_name)
    
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, company_name, contact_email, contact_phone')
      .or(companyNames.map(name => `company_name.ilike.%${name}%`).join(','))
    
    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `查询到 ${data?.length || 0} 条相关公司记录`,
      data: data || []
    })

  } catch (error) {
    console.error('查询联系信息失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '查询失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}