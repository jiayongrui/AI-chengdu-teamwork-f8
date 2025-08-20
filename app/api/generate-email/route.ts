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

    // 构建简历优化报告生成的AI提示词，直接分析用户简历信息
    const prompt = `# 角色与目标 
你是一位顶级的AI产品经理职业导师和招聘专家。你的唯一目标是基于一个特定的、量化的简历评估模型，帮助我优化简历，以最大限度地提高我成功申请【应届生AI产品经理】岗位的概率。 

# 核心评估模型 (Context) 
你必须严格按照以下五个维度及其权重，来分析和评估我的简历。这是你所有建议的基石。 

* **1. 背景与经验 (权重 20%)**: 评估我的教育背景、专业匹配度、以及实习/项目的相关性。 
* **2. 专业知识与技能 (权重 30%)**: 评估我简历中体现的AI技术认知（如RAG, Agent）和产品方法论（如用户研究, PRD）。 
* **3. 产品作品与成果 (权重 20%)**: 评估我提供的可交互作品、产品文档、分析报告等成果的质量和说服力。这是"Show, Don't Tell"的关键。 
* **4. 核心胜任力 (权重 15%)**: 通过简历的语言和结构，评估我的逻辑思维和结果导向意识。重点是项目描述是否量化，是否使用STAR法则。 
* **5. 发展潜力 (权重 15%)**: 寻找简历中体现自驱力、产品热情和主动性的信号，如个人博客、GitHub项目、开源贡献等。 

# 目标岗位信息
**公司**: ${opportunity.company}
**职位**: ${opportunity.title}
**城市**: ${opportunity.city || '未指定'}
**岗位标签**: ${(opportunity.tags || []).join(', ')}
**岗位描述**: ${opportunity.reason || '暂无详细描述'}

# 我的简历信息 (Input) 
${resumeHighlights}

# 你的任务 (Instructions) 
请严格按照以下步骤，以清晰、专业、鼓励的语气，为我提供一份完整的简历优化报告： 

1.  **量化评估诊断 (Score & Diagnose)**: 
    * 首先，根据上述评估模型和我的简历信息，为我的简历进行打分（满分100）。 
    * 然后，清晰地列出五个维度各自的得分（例如：背景与经验 15/20），并简要说明得分原因。这能让我直观地看到自己的长板和短板。 

2.  **分维度优化建议 (Actionable Advice)**: 
    * 针对每一个维度，特别是失分较多的维度，提供**具体、可执行**的优化建议。 
    * 例如，如果"作品成果"维度失分，你应该建议我："可以尝试将你在XX项目中的需求文档整理成一份简洁的PDF，并添加到作品集链接中。" 

3.  **核心描述改写 (Rewrite Key Points)**: 
    * 从我的"实习经历"或"项目经历"中，**挑选出2-3条最薄弱的描述**。 
    * 展示一个**"优化前"**和**"优化后"**的对比。 
    * "优化后"的版本必须运用**STAR法则**，并尽可能地**加入量化结果或业务影响**。这是报告中最核心的部分。 

4.  **机会点挖掘 (Uncover Opportunities)**: 
    * 最后，总结出我的简历目前**缺失的关键信息或"加分项"**。 
    * 例如："你的简历缺少一个可交互的作品，强烈建议你花一天时间，使用Coze或Dify搭建一个能解决身边小问题的AI Bot，并将链接附上，这将是决定性的加分项。" 

请开始你的分析和优化吧！`

    // 使用直接HTTP请求调用SiliconFlow API
    const cleanPrompt = prompt.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim()
    
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-ufnwysgrwnebkczychcgkvzvvinyydmppnrvgyclbwdluvpu'
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3',
        messages: [
          {
            role: 'user',
            content: cleanPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`)
    }

    const apiResult = await response.json()
    const text = apiResult.choices[0].message.content

    return NextResponse.json({
      body: text,
      subject: '简历优化报告',
      success: true
    })
  } catch (error: any) {
    console.error("AI简历优化生成失败:", error)
    // 返回基础的简历优化模板
    const fallbackResumeHighlightsObj = resumeText ? extractResumeHighlights(resumeText, opportunity.tags || []) : null
    const fallbackResumeHighlights = fallbackResumeHighlightsObj ? 
      `**技能匹配：** ${fallbackResumeHighlightsObj.skills.join('、') || '无'}

**项目经验：**
${fallbackResumeHighlightsObj.experiences.map(exp => `- ${exp}`).join('\n') || '- 无相关经验'}

**教育背景：** ${fallbackResumeHighlightsObj.education || '未提供'}` : 
      "未提供简历内容"
    const fallbackBody = `# 简历优化报告

## 目标职位信息
- 公司：${opportunity.company}
- 职位：${opportunity.title}
- 地点：${opportunity.city || '未指定'}
- 标签：${opportunity.tags?.join(', ') || '无'}

## 简历内容分析
${fallbackResumeHighlights}

## 优化建议
由于AI服务暂时不可用，请稍后重试获取详细的优化建议。

当前简历内容已显示在上方，您可以根据目标职位要求进行相应调整。`
    
    return NextResponse.json({
      body: fallbackBody,
      subject: '简历优化报告',
      success: true,
      fallback: true
    })
  }
}
