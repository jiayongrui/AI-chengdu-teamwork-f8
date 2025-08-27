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

    // DeepSeek API key is now hardcoded, so we can proceed with AI generation
    // If needed, fallback logic can be added here for error handling

    // 提取简历亮点
    const resumeHighlightsObj = extractResumeHighlights(resumeText || "", opportunity.tags || [])
    const resumeHighlights = `**技能匹配：** ${resumeHighlightsObj.skills.join('、') || '无'}

**项目经验：**
${resumeHighlightsObj.experiences.map(exp => `- ${exp}`).join('\n') || '- 无相关经验'}

**教育背景：** ${resumeHighlightsObj.education || '未提供'}`

    // 生成个性化开场白
    const personalizedGreeting = generatePersonalizedGreeting(
      opportunity.company,
      opportunity.title,
      opportunity.reason,
    )

    // 构建求职邮件生成的AI提示词
    const prompt = `# 角色与目标
你是一位专业的求职邮件写作专家。你需要帮助求职者撰写一封专业、个性化的求职邮件。

# 任务要求
1. 根据求职者简历和目标职位信息，生成一封专业的求职邮件
2. 邮件应该体现求职者与职位的匹配度
3. 语言要专业、诚恳，避免过于夸张
4. 突出求职者的核心优势和相关经验

# 目标岗位信息
**公司**: ${opportunity.company}
**职位**: ${opportunity.title}
**城市**: ${opportunity.city || '未指定'}
**岗位标签**: ${(opportunity.tags || []).join(', ')}
**岗位描述**: ${opportunity.reason || '暂无详细描述'}
**个性化开场**: ${personalizedGreeting}

# 求职者简历信息
${resumeHighlights}

# 输出要求
请按以下JSON格式输出求职邮件：

{
  "subject": "邮件主题",
  "body": "邮件正文内容"
}

邮件正文应包含：
1. 专业的问候语
2. 简洁的自我介绍和求职意向
3. 突出与职位相关的技能和经验
4. 表达对公司和职位的兴趣
5. 礼貌的结尾和联系方式

请确保邮件内容专业、简洁，长度适中（300-500字）。`

    // 使用直接HTTP请求调用SiliconFlow API
    const cleanPrompt = prompt.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim()
    
    const requestBody = {
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [
        {
          role: 'user',
          content: cleanPrompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    }
    
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer sk-ufnwysgrwnebkczychcgkvzvvinyydmppnrvgyclbwdluvpu'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`)
    }

    const apiResult = await response.json()
    const text = apiResult.choices[0].message.content

    // 尝试解析AI返回的JSON格式邮件
    let emailData
    try {
      // 提取JSON部分（如果AI返回包含其他文本）
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        emailData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('未找到JSON格式数据')
      }
    } catch (parseError) {
      // 如果解析失败，使用模板邮件
      const templateEmail = buildTemplateEmail({ user, opportunity, resumeText })
      emailData = {
        subject: templateEmail.subject,
        body: templateEmail.body
      }
    }

    return NextResponse.json({
      success: true,
      email: emailData,
      rawText: text,
      metadata: {
        company: opportunity.company,
        position: opportunity.title,
        city: opportunity.city,
        tags: opportunity.tags,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error("AI email generation failed:", error)
    // 返回基础的模板邮件
    const templateEmail = buildTemplateEmail({ user, opportunity, resumeText })
    
    return NextResponse.json({
      success: true,
      email: {
        subject: templateEmail.subject,
        body: templateEmail.body
      },
      rawText: templateEmail.body,
      fallback: true,
      metadata: {
        company: opportunity.company,
        position: opportunity.title,
        city: opportunity.city,
        tags: opportunity.tags,
        generatedAt: new Date().toISOString()
      }
    })
  }
}
