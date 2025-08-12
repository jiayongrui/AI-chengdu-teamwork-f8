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

export interface Resume {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export async function createResume(userId: string, title: string, content: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
    })
    .select("*")
    .single()

  if (error) throw error
  return data as Resume
}

export async function fetchUserResumes(userId: string): Promise<Resume[]> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) throw error
  return (data || []) as Resume[]
}

export async function updateResume(resumeId: string, title: string, content: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { data, error } = await supabase
    .from("resumes")
    .update({
      title: title.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", resumeId)
    .select("*")
    .single()

  if (error) throw error
  return data as Resume
}

export async function deleteResume(resumeId: string) {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error("缺少 Supabase 环境变量")

  const { error } = await supabase.from("resumes").delete().eq("id", resumeId)

  if (error) throw error
}

// 本地存储降级方案
const LS_RESUMES_PREFIX = "ci_resumes_"

export function getLocalResumes(userId: string): Resume[] {
  const key = LS_RESUMES_PREFIX + userId
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Resume[]) : []
  } catch {
    return []
  }
}

export function setLocalResumes(userId: string, resumes: Resume[]) {
  const key = LS_RESUMES_PREFIX + userId
  localStorage.setItem(key, JSON.stringify(resumes))
}

export function createLocalResume(userId: string, title: string, content: string): Resume {
  const resumes = getLocalResumes(userId)
  const newResume: Resume = {
    id: `local-${Date.now()}`,
    user_id: userId,
    title: title.trim(),
    content: content.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  resumes.unshift(newResume)
  setLocalResumes(userId, resumes)
  return newResume
}

export function updateLocalResume(userId: string, resumeId: string, title: string, content: string): Resume | null {
  const resumes = getLocalResumes(userId)
  const index = resumes.findIndex((r) => r.id === resumeId)
  if (index === -1) return null

  resumes[index] = {
    ...resumes[index],
    title: title.trim(),
    content: content.trim(),
    updated_at: new Date().toISOString(),
  }
  setLocalResumes(userId, resumes)
  return resumes[index]
}

export function deleteLocalResume(userId: string, resumeId: string) {
  const resumes = getLocalResumes(userId)
  const filtered = resumes.filter((r) => r.id !== resumeId)
  setLocalResumes(userId, filtered)
}

// 文件处理工具函数
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase()
  const maxSize = 10 * 1024 * 1024 // 10MB 限制

  if (file.size > maxSize) {
    throw new Error("文件大小不能超过 10MB")
  }

  try {
    switch (ext) {
      case "txt":
        return await extractTextFromTxt(file)
      case "docx":
        return await extractTextFromDocx(file)
      case "pdf":
        return await extractTextFromPdf(file)
      default:
        throw new Error(`不支持的文件格式: .${ext}。支持的格式：.txt, .docx, .pdf`)
    }
  } catch (error: any) {
    console.error("文件解析错误:", error)
    throw new Error(`文件解析失败: ${error.message}`)
  }
}

async function extractTextFromTxt(file: File): Promise<string> {
  const text = await file.text()
  if (!text.trim()) {
    throw new Error("文本文件内容为空")
  }
  return text.trim()
}

async function extractTextFromDocx(file: File): Promise<string> {
  try {
    // 动态导入 mammoth
    const mammoth = await import("mammoth/mammoth.browser")
    const arrayBuffer = await file.arrayBuffer()

    const result = await mammoth.convertToHtml({ arrayBuffer })

    if (result.messages && result.messages.length > 0) {
      console.warn("DOCX 解析警告:", result.messages)
    }

    // 清理 HTML 标签并格式化文本
    const text = result.value
      .replace(/<[^>]+>/g, " ") // 移除 HTML 标签
      .replace(/\s+/g, " ") // 合并多个空格
      .replace(/\n\s*\n/g, "\n") // 合并多个换行
      .trim()

    if (!text) {
      throw new Error("DOCX 文件内容为空或无法解析")
    }

    return text
  } catch (error: any) {
    if (error.message.includes("mammoth")) {
      throw new Error("DOCX 文件解析失败，请确保文件格式正确")
    }
    throw error
  }
}

async function extractTextFromPdf(file: File): Promise<string> {
  try {
    // 动态导入 pdf-parse
    const pdfParse = await import("pdf-parse/lib/pdf-parse")
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const data = await pdfParse.default(buffer)

    if (!data.text || !data.text.trim()) {
      throw new Error("PDF 文件内容为空或无法提取文本")
    }

    // 清理和格式化文本
    const text = data.text
      .replace(/\s+/g, " ") // 合并多个空格
      .replace(/\n\s*\n/g, "\n") // 合并多个换行
      .trim()

    return text
  } catch (error: any) {
    if (error.message.includes("pdf-parse") || error.message.includes("PDF")) {
      throw new Error("PDF 文件解析失败，请确保文件格式正确且包含可提取的文本")
    }
    throw error
  }
}

// 文件验证
export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    "text/plain", // .txt
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/pdf", // .pdf
  ]

  const allowedExtensions = ["txt", "docx", "pdf"]
  const ext = file.name.split(".").pop()?.toLowerCase()

  // 检查文件扩展名
  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `不支持的文件格式。支持的格式：${allowedExtensions.map((e) => `.${e}`).join(", ")}`,
    }
  }

  // 检查 MIME 类型（某些情况下可能不准确，所以主要依赖扩展名）
  if (!allowedTypes.includes(file.type) && file.type !== "") {
    console.warn(`文件 MIME 类型不匹配: ${file.type}，但扩展名正确，继续处理`)
  }

  // 检查文件大小
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "文件大小不能超过 10MB",
    }
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "文件为空",
    }
  }

  return { valid: true }
}
