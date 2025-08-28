import { getSupabaseClient } from "@/lib/supabase-client"
import type { Opportunity } from "@/types/opportunity"
import type { Task, TaskStatus } from "@/types/task"

export interface SendEmailParams {
  to: string
  subject: string
  body: string
  senderName: string
  senderEmail?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
  demo?: boolean
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    console.log("Sending email request:", {
      to: params.to,
      subject: params.subject,
      senderName: params.senderName,
      senderEmail: params.senderEmail,
      bodyLength: params.body.length,
    })

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    console.log("API response status:", response.status, response.statusText)

    // 检查响应是否为 JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("API returned non-JSON response:", contentType)
      const textResponse = await response.text()
      console.error("Response content:", textResponse.substring(0, 500))
      throw new Error(`服务器返回了非 JSON 响应 (${response.status}): ${textResponse.substring(0, 100)}`)
    }

    const data = await response.json()
    console.log("API response data:", data)

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return {
      success: true,
      messageId: data.messageId,
      demo: data.demo || false,
    }
  } catch (error: any) {
    console.warn("⚠️ 邮件发送失败:", error?.message || error)
    return {
      success: false,
      error: error.message || "邮件发送失败",
    }
  }
}

export async function logAndAdvanceTask(args: {
  userId: string
  opp: Opportunity
  subject: string
  body: string
  recipientEmail?: string
  messageId?: string
  demo?: boolean
}) {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.warn("Supabase not configured, skipping database record")
    return
  }

  try {
    // 1) 写入 emails 日志
    const { error: mailErr } = await supabase.from("emails").insert({
      user_id: args.userId,
      company: args.opp.company,
      title: args.opp.title,
      subject: args.subject,
      body: args.body,
      recipient_email: args.recipientEmail || null,
      message_id: args.messageId || null,
      status: args.demo ? "demo" : "sent",
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

    const noteText = args.demo ? `演示发送至: ${args.recipientEmail}` : `已发送至: ${args.recipientEmail}`

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
        note: args.recipientEmail ? noteText : null,
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
        .update({
          status: "sent",
          ord: newOrd,
          note: args.recipientEmail ? noteText : null,
        })
        .eq("id", exists.id)
      if (upErr) throw upErr
    }
  } catch (error: any) {
    console.warn("⚠️ 数据库操作失败:", error?.message || error)
    // 不抛出错误，允许邮件发送成功但数据库记录失败
    console.warn("📧 邮件发送成功，但数据库记录失败，继续执行")
  }
}
