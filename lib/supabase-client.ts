import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.warn("Supabase环境变量未配置，将使用本地数据")
    return null
  }
  
  if (!client) {
    try {
      // 添加更详细的配置选项来处理网络问题
      client = createClient(url, key, {
        auth: {
          persistSession: false, // 禁用会话持久化以避免存储问题
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js-web',
          },
        },
        db: {
          schema: 'public',
        },
        realtime: {
          params: {
            eventsPerSecond: 2,
          },
        },
      })
      console.log("Supabase客户端初始化成功")
    } catch (error) {
      console.error("Supabase客户端初始化失败:", error)
      return null
    }
  }
  return client
}
