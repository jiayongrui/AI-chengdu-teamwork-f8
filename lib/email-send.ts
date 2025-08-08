import { getSupabaseClient } from "@/lib/supabase-client"
import type { Opportunity } from "@/types/opportunity"
import type { Task, TaskStatus } from "@/types/task"

export async function logAndAdvanceTask(args: {
  userId: string
  opp: Opportunity
  subject: string
  body: string
}) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  // 1) 写入 emails 日志
  const { error: mailErr } = await supabase.from("emails").insert({
    user_id: args.userId,
    company: args.opp.company,
    title: args.opp.title,
    subject: args.subject,
    body: args.body,
    status: "sent",
  })
  if (mailErr) throw mailErr

  // 2) 将任务推进到 sent（如果还没有这家公司任务则创建一条）
  const { data: exists, error: queryErr } = await supabase
    .from("tasks")
    .select("id, status, ord")
    .eq("user_id", args.userId)
    .ilike("title", `%${args.opp.company}%`)
    .maybeSingle()
  if (queryErr) throw queryErr

  if (!exists) {
    // 末尾 ord
    const { data: col, error: colErr } = await supabase
      .from("tasks")
      .select("ord")
      .eq("user_id", args.userId)
      .eq("status", "sent")
      .order("ord", { ascending: true })
    if (colErr) throw colErr
    const newOrd = (col?.[col.length - 1]?.ord ?? 0) + 1
    const { error: insErr } = await supabase.from("tasks").insert({
      user_id: args.userId,
      title: args.opp.company,
      status: "sent" as TaskStatus,
      ord: newOrd,
      note: null,
    } as Partial<Task> as any)
    if (insErr) throw insErr
  } else {
    // 更新为 sent 并顺位到末尾
    const { data: col, error: colErr } = await supabase
      .from("tasks")
      .select("ord")
      .eq("user_id", args.userId)
      .eq("status", "sent")
      .order("ord", { ascending: true })
    if (colErr) throw colErr
    const newOrd = (col?.[col.length - 1]?.ord ?? 0) + 1
    const { error: upErr } = await supabase
      .from("tasks")
      .update({ status: "sent", ord: newOrd })
      .eq("id", exists.id)
    if (upErr) throw upErr
  }
}
