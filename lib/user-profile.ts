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
      default:
        throw new Error(`不支持的文件格式: .${ext}。当前支持的格式：.txt, .docx`)
    }
  } catch (error: any) {
    console.error("文件解析错误:", error)
    throw new Error(`文件解析失败: ${error.message}`)
  }
}

async function extractTextFromTxt(file: File): Promise<string> {
  try {
    const text = await file.text()
    if (!text.trim()) {
      throw new Error("文本文件内容为空")
    }
    return text.trim()
  } catch (error: any) {
    throw new Error("TXT文件读取失败，请确保文件编码正确")
  }
}

async function extractTextFromDocx(file: File): Promise<string> {
  try {
    // 检查文件是否真的是DOCX格式
    if (!file.name.toLowerCase().endsWith(".docx")) {
      throw new Error("请选择正确的DOCX文件")
    }

    // 检查文件MIME类型
    const validMimeTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream", // 有些浏览器可能返回这个
    ]

    if (file.type && !validMimeTypes.includes(file.type)) {
      console.warn(`DOCX文件MIME类型不匹配: ${file.type}，但继续尝试解析`)
    }

    // 动态导入 mammoth，并添加更好的错误处理
    let mammoth
    try {
      mammoth = await import("mammoth/mammoth.browser")
    } catch (importError) {
      console.error("Mammoth库导入失败:", importError)
      throw new Error("DOCX parsing library failed to load, please refresh and retry")
    }

    const arrayBuffer = await file.arrayBuffer()

    // 检查文件是否为空
    if (arrayBuffer.byteLength === 0) {
      throw new Error("DOCX file is empty")
    }

    // 检查文件头，确保是ZIP格式（DOCX本质上是ZIP文件）
    const uint8Array = new Uint8Array(arrayBuffer)
    const zipSignature = [0x50, 0x4b, 0x03, 0x04] // ZIP文件头
    const isZip = zipSignature.every((byte, index) => uint8Array[index] === byte)

    if (!isZip) {
      throw new Error("Invalid file format, please ensure it is a valid DOCX file")
    }

    console.log("开始解析DOCX文件...")
    const result = await mammoth.convertToHtml({ arrayBuffer })

    // 检查解析结果
    if (!result || typeof result.value !== "string") {
      throw new Error("DOCX file parsing failed, invalid result returned")
    }

    // 记录警告信息（如果有）
    if (result.messages && result.messages.length > 0) {
      console.warn("DOCX解析警告:", result.messages)
    }

    // 清理HTML标签并格式化文本
    const text = result.value
      .replace(/<[^>]+>/g, " ") // 移除HTML标签
      .replace(/&nbsp;/g, " ") // 替换HTML空格
      .replace(/&amp;/g, "&") // 替换HTML实体
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ") // 合并多个空格
      .replace(/\n\s*\n/g, "\n") // 合并多个换行
      .trim()

    if (!text || text.length < 10) {
      throw new Error("Insufficient content after DOCX parsing, please check if file contains valid text")
    }

    console.log(`DOCX解析成功，提取文本长度: ${text.length}`)
    return text
  } catch (error: any) {
    console.error("DOCX解析详细错误:", error)

    // 提供更具体的错误信息，使用安全的字符编码
    const errorMsg = error.message || 'Unknown error'
    if (errorMsg.includes("mammoth")) {
      throw new Error(
        "DOCX parsing library error. Please try: 1. Refresh and retry 2. Save file as new DOCX 3. Copy content to TXT file"
      )
    } else if (errorMsg.includes("ZIP") || errorMsg.includes("format")) {
      throw new Error(
        "File may be corrupted or invalid DOCX format. Please try: 1. Re-save with Word 2. Check file integrity 3. Copy content to TXT file"
      )
    } else if (errorMsg.includes("content")) {
      throw new Error(
        "Insufficient text content found in DOCX. Please ensure: 1. File contains text (not just images) 2. File is not password protected 3. File format is correct"
      )
    } else {
      throw new Error(`DOCX processing failed: ${errorMsg}. Suggestion: Copy resume content to TXT file or contact support`)
    }
  }
}

// 文件验证 - 只支持TXT和DOCX
export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  const allowedExtensions = ["txt", "docx"]
  const ext = file.name.split(".").pop()?.toLowerCase()

  // 检查文件扩展名
  if (!ext || !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `不支持的文件格式。当前支持的格式：${allowedExtensions.map((e) => `.${e}`).join(", ")}`,
    }
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

  // DOCX特殊检查
  if (ext === "docx") {
    const validMimeTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "", // 有些情况下可能为空
    ]

    if (file.type && !validMimeTypes.includes(file.type)) {
      console.warn(`DOCX文件MIME类型警告: ${file.type}`)
      // 不阻止上传，只是警告
    }
  }

  return { valid: true }
}
