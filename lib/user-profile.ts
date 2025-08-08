import { getSupabaseClient } from "@/lib/supabase-client"

export async function updateUserResumeText(userId: string, resumeText: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")
  const { error } = await supabase.from("users").update({ resume_text: resumeText }).eq("id", userId)
  if (error) throw error
}

export async function fetchUserResumeText(userId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")
  const { data, error } = await supabase.from("users").select("resume_text").eq("id", userId).maybeSingle()
  if (error) throw error
  return (data?.resume_text as string | null) ?? null
}
