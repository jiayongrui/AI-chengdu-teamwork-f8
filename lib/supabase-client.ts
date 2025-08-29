import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.warn("Supabase environment variables not configured, will use local data")
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
          fetch: (url, options = {}) => {
            // 添加超时和错误处理
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时
            
            return fetch(url, {
              ...options,
              signal: controller.signal,
            }).finally(() => {
              clearTimeout(timeoutId)
            })
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
      console.log("✅ Supabase 客户端初始化成功")
    } catch (error) {
      console.warn("⚠️ Supabase 客户端初始化失败:", error instanceof Error ? error.message : error)
      return null
    }
  }
  return client
}
