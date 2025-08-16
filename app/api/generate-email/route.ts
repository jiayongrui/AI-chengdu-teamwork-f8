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
  const skillHint =
    resumeText && resumeText.trim().length > 0
      ? "我简历中的关键经历与技能与岗位高度匹配。"
      : "我具备扎实的工程基础与自驱力，乐于在快速变化的环境中交付高质量结果。"
  const body = [
    "您好！",
    "",
    `我关注到贵公司「${opportunity.company}」${opportunity.reason ?? "发展迅速"}，对岗位「${opportunity.title}」非常感兴趣。`,
    "",
    skillHint,
    resumeText
      ? "我的简历重点包含：\n" + (resumeText.slice(0, 300) + (resumeText.length > 300 ? "..." : ""))
      : "我的简历已随信附上，欢迎查阅。",
    "",
    "若有机会参与到贵司的下一阶段产品迭代，我将非常珍惜，也乐于先行完成小任务以便您评估。",
    "",
    `此致\n${user.username}`,
  ].join("\n")
  return { subject, body }
}

// 从简历中提取关键技能和经验
function extractResumeHighlights(resumeText: string, jobTags: string[] = []) {
  if (!resumeText || resumeText.trim().length === 0) {
    return {
      skills: [],
      experiences: [],
      projects: [],
      education: "",
    }
  }

  const text = resumeText.toLowerCase()

  // 技能匹配（优先匹配职位标签）
  const allSkills = [
    ...jobTags.map((tag) => tag.toLowerCase()),
    "javascript",
    "typescript",
    "react",
    "vue",
    "angular",
    "node.js",
    "python",
    "java",
    "go",
    "rust",
    "mysql",
    "postgresql",
    "mongodb",
    "redis",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "机器学习",
    "深度学习",
    "nlp",
    "cv",
    "推荐系统",
    "大数据",
    "spark",
    "hadoop",
    "产品设计",
    "用户体验",
    "数据分析",
    "项目管理",
    "敏捷开发",
  ]

  const foundSkills = allSkills.filter((skill) => text.includes(skill.toLowerCase()))

  // 提取项目经验（寻找包含"项目"、"开发"、"设计"等关键词的句子）
  const projectKeywords = ["项目", "开发", "设计", "实现", "负责", "参与", "完成"]
  const sentences = resumeText.split(/[。！？\n]/).filter((s) => s.trim().length > 10)
  const experiences = sentences
    .filter((sentence) => projectKeywords.some((keyword) => sentence.includes(keyword)))
    .slice(0, 3)

  // 提取教育背景
  const educationKeywords = ["大学", "学院", "专业", "本科", "硕士", "博士", "学士"]
  const education = sentences.find((sentence) => educationKeywords.some((keyword) => sentence.includes(keyword))) || ""

  return {
    skills: foundSkills.slice(0, 5), // 最多5个技能
    experiences: experiences,
    projects: experiences.filter((exp) => exp.includes("项目")).slice(0, 2), // 最多2个项目
    education: education.slice(0, 100), // 限制长度
  }
}

// 根据公司和职位生成个性化的开场白
function generatePersonalizedGreeting(company: string, jobTitle: string, reason?: string) {
  const greetings = [
    `我一直关注${company}在行业中的创新表现`,
    `${company}的发展理念与我的职业规划高度契合`,
    `作为${company}产品的用户，我深深被其${reason ? reason.slice(0, 20) : "创新能力"}所吸引`,
    `在研究${jobTitle}相关技术时，${company}的技术实践给了我很多启发`,
    `${company}在${reason ? reason.slice(0, 15) : "技术创新"}方面的成就令我印象深刻`,
  ]

  return greetings[Math.floor(Math.random() * greetings.length)]
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

    // 提取简历亮点
    const resumeHighlights = extractResumeHighlights(resumeText || "", opportunity.tags || [])

    // 生成个性化开场白
    const personalizedGreeting = generatePersonalizedGreeting(
      opportunity.company,
      opportunity.title,
      opportunity.reason,
    )

    // 构建更详细和个性化的AI提示词
    const prompt = `你是一位资深的求职顾问，请帮助求职者生成一封专业且个性化的破冰邮件。

## 求职者信息
- 姓名：${user.username}
- 简历内容：${resumeText || "暂无详细简历"}

## 从简历中提取的关键信息
- 技能匹配：${resumeHighlights.skills.join("、") || "通用技能"}
- 项目经验：${resumeHighlights.experiences.join("；") || "相关工作经验"}
- 教育背景：${resumeHighlights.education || "相关教育背景"}

## 目标公司与职位
- 公司名称：${opportunity.company}
- 职位：${opportunity.title}
- 城市：${opportunity.city || "不限"}
- 技能要求：${opportunity.tags?.join("、") || "无特殊要求"}
- 公司亮点：${opportunity.reason || "行业领先企业"}

## 个性化要求
1. **开场白**：使用这个个性化开场："${personalizedGreeting}"，然后自然过渡到求职意图
2. **技能匹配**：重点突出简历中与职位要求匹配的技能：${resumeHighlights.skills.slice(0, 3).join("、")}
3. **经验展示**：简要提及1-2个相关项目或经验，体现实际能力
4. **公司认知**：体现对公司业务和发展的了解，引用公司亮点
5. **个人价值**：明确表达能为公司带来的价值和贡献
6. **行动导向**：提出具体的下一步行动建议

## 邮件风格要求
- 语气：专业而真诚，不卑不亢
- 长度：250-350字，简洁有力
- 结构：开场问候 → 个人介绍 → 技能匹配 → 价值主张 → 行动呼吁 → 礼貌结尾
- 避免：过度谦虚、模板化表达、冗长描述

## 特别注意
- 如果简历信息不足，重点突出学习能力和工作热情
- 针对不同类型职位（技术/产品/运营等）调整重点
- 体现对行业趋势的理解和个人成长规划

请按以下格式返回：
主题：[简洁有力的邮件主题，体现价值定位]
正文：[个性化的邮件正文]`

    const result = await generateText({
      model: deepinfra("meta-llama/Meta-Llama-3.1-70B-Instruct"),
      prompt,
      maxTokens: 1000,
      temperature: 0.8, // 提高创造性
    })

    // 解析AI生成的内容
    const content = result.text
    const subjectMatch = content.match(/主题：([\s\S]+?)(?:\n|正文：)/)
    const bodyMatch = content.match(/正文：([\s\S]+)$/)

    let subject = subjectMatch?.[1]?.trim() || `${opportunity.title}求职申请 - ${user.username}`
    let body = bodyMatch?.[1]?.trim() || content

    // 如果主题过长，进行优化
    if (subject.length > 50) {
      subject = `${opportunity.company} ${opportunity.title}职位申请 - ${user.username}`
    }

    // 确保邮件正文包含基本要素
    if (body.length < 100) {
      const { subject: fallbackSubject, body: fallbackBody } = buildTemplateEmail({ user, opportunity, resumeText })
      subject = fallbackSubject
      body = fallbackBody
    }

    return NextResponse.json({ subject, body, success: true })
  } catch (error: any) {
    console.error("AI邮件生成失败，降级为模板:", error)
    // Graceful fallback on any failure (200)
    const { subject, body } = buildTemplateEmail({ user, opportunity, resumeText })
    return NextResponse.json({ subject, body, success: true, fallback: true })
  }
}
