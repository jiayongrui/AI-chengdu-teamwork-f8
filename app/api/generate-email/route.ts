import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

// Create DeepSeek client using OpenAI-compatible API
const deepseek = createOpenAI({
  name: "deepseek",
  apiKey: "sk-ufnwysgrwnebkczychcgkvzvvinyydmppnrvgyclbwdluvpu",
  baseURL: "https://api.deepseek.com/v1",
})

export async function POST(req: NextRequest) {
  try {
    const { user, opportunity, resumeText } = await req.json()

    if (!user || !opportunity) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

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
      model: deepseek("deepseek-chat"),
      prompt,
      maxTokens: 800,
      temperature: 0.7,
    })

    // 解析AI生成的内容
    const content = result.text
    const subjectMatch = content.match(/主题：(.+?)(?:\n|正文：)/s)
    const bodyMatch = content.match(/正文：(.+)$/s)

    const subject = subjectMatch?.[1]?.trim() || `关于${opportunity.title}职位的求职申请 - ${user.username}`
    const body = bodyMatch?.[1]?.trim() || content

    return NextResponse.json({
      subject,
      body,
      success: true,
    })
  } catch (error: any) {
    console.error("DeepSeek邮件生成失败:", error)
    return NextResponse.json({ error: `邮件生成失败: ${error.message || "未知错误"}` }, { status: 500 })
  }
}
