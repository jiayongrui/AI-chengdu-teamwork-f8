import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

function buildTemplateEmail(params: {
  user: { username: string }
  opportunity: {
    company: string
    title: string
    city?: string
    tags?: string[]
    reason?: string
  }
  resumeText?: string | null
}) {
  const { user, opportunity, resumeText } = params
  const subject = `关于${opportunity.title}职位的求职申请 - ${user.username}`
  const skillHint = resumeText && resumeText.trim().length > 0 ? "我简历中的关键经历与技能与岗位高度匹配。" : "我具备扎实的工程基础与自驱力，乐于在快速变化的环境中交付高质量结果。"
  const body = [
    "您好！",
    "",
    `我关注到贵公司「${opportunity.company}」${opportunity.reason ?? "发展迅速"}，对岗位「${opportunity.title}」非常感兴趣。`,
    "",
    skillHint,
    resumeText ? "我的简历重点包含：\n" + (resumeText.slice(0, 300) + (resumeText.length > 300 ? "..." : "")) : "我的简历已随信附上，欢迎查阅。",
    "",
    "若有机会参与到贵司的下一阶段产品迭代，我将非常珍惜，也乐于先行完成小任务以便您评估。",
    "",
    `此致\n${user.username}`,
  ].join("\n")
  return { subject, body }
}

export async function POST(req: NextRequest) {
  // 仅解析一次请求体，避免在 catch 中重复读取失败
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 })
  }

  const { user, opportunity, resumeText } = payload || {}

  try {
    if (!user || !opportunity) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // If API key is not available, return server-side template fallback (200)
    if (!process.env.DEEPINFRA_API_KEY) {
      const { subject, body } = buildTemplateEmail({ user, opportunity, resumeText })
      return NextResponse.json({ subject, body, success: true, fallback: true })
    }

    // Create DeepSeek client using OpenAI-compatible API
    const deepinfra = createOpenAI({
      name: "deepinfra",
      apiKey: process.env.DEEPINFRA_API_KEY,
      baseURL: "https://api.deepinfra.com/v1/openai",
    })

    // 构建AI提示词
    const prompt = `你是一位专业的求职顾问，请帮助求职者生成一封专业的破冰邮件。

求职者信息：
- 姓名：${user.username}
- 简历内容：${resumeText || "暂无简历信息"}

目标公司信息：
- 公司名称：${opportunity.company}
- 职位：${opportunity.title}
- 城市：${opportunity.city || "不限"}
- 标签：${opportunity.tags?.join("、") || "无"}
- 机会原因：${opportunity.reason || "无特殊说明"}

请生成一封专业的求职邮件，包含：
1. 邮件主题（简洁有力，体现价值）
2. 邮件正文（3-4段，包含：问候、自我介绍与匹配度、对公司的了解与兴趣、行动呼吁）

要求：
- 语气专业但不失亲和力
- 突出求职者与职位的匹配度
- 体现对公司的了解和兴趣
- 避免过于模板化
- 字数控制在200-300字

请按以下格式返回：
主题：[邮件主题]
正文：[邮件正文]`

    const result = await generateText({
      model: deepinfra("meta-llama/Meta-Llama-3.1-70B-Instruct"),
      prompt,
      maxTokens: 800,
      temperature: 0.7,
    })

    // 解析AI生成的内容（避免使用 /s 标志，改用 [\s\S]）
    const content = result.text
    const subjectMatch = content.match(/主题：([\s\S]+?)(?:\n|正文：)/)
    const bodyMatch = content.match(/正文：([\s\S]+)$/)

    const subject = subjectMatch?.[1]?.trim() || `关于${opportunity.title}职位的求职申请 - ${user.username}`
    const body = bodyMatch?.[1]?.trim() || content

    return NextResponse.json({ subject, body, success: true })
  } catch (error: any) {
    console.error("AI邮件生成失败，降级为模板:", error)
    // Graceful fallback on any failure (200)
    const { subject, body } = buildTemplateEmail({ user, opportunity, resumeText })
    return NextResponse.json({ subject, body, success: true, fallback: true })
  }
}
