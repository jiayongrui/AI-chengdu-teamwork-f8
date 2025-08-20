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

# 输出格式要求
请严格按照以下Markdown格式输出，确保结构清晰、美观易读：

# 你的任务 (Instructions) 
请严格按照以下步骤和格式，以清晰、专业、鼓励的语气，为我提供一份完整的简历优化报告： 

## 📊 简历评估总览

### 🎯 总体评分
**综合得分：XX/100分**

### 📈 五维度评分详情
| 评估维度 | 得分 | 满分 | 评价等级 | 核心问题 |
|---------|------|------|----------|----------|
| 🎓 背景与经验 | XX | 20 | ⭐⭐⭐ | 简要说明 |
| 🧠 专业知识与技能 | XX | 30 | ⭐⭐⭐ | 简要说明 |
| 🏆 产品作品与成果 | XX | 20 | ⭐⭐⭐ | 简要说明 |
| 💪 核心胜任力 | XX | 15 | ⭐⭐⭐ | 简要说明 |
| 🚀 发展潜力 | XX | 15 | ⭐⭐⭐ | 简要说明 |

---

## 🔧 分维度优化建议

### 🎓 背景与经验优化
**当前状态：** [简要描述]
**优化建议：**
- 📌 具体建议1
- 📌 具体建议2
- 📌 具体建议3

### 🧠 专业知识与技能优化
**当前状态：** [简要描述]
**优化建议：**
- 📌 具体建议1
- 📌 具体建议2
- 📌 具体建议3

### 🏆 产品作品与成果优化
**当前状态：** [简要描述]
**优化建议：**
- 📌 具体建议1
- 📌 具体建议2
- 📌 具体建议3

### 💪 核心胜任力优化
**当前状态：** [简要描述]
**优化建议：**
- 📌 具体建议1
- 📌 具体建议2
- 📌 具体建议3

### 🚀 发展潜力优化
**当前状态：** [简要描述]
**优化建议：**
- 📌 具体建议1
- 📌 具体建议2
- 📌 具体建议3

---

## ✏️ 核心描述改写对比

### 📝 项目经历改写示例

#### 改写案例1
**🔴 优化前：**
> [原始描述]

**🟢 优化后：**
> [STAR法则优化后的描述，包含具体数据和业务影响]

**💡 改写要点：**
- 使用STAR法则结构
- 添加量化数据
- 突出业务价值

#### 改写案例2
**🔴 优化前：**
> [原始描述]

**🟢 优化后：**
> [STAR法则优化后的描述，包含具体数据和业务影响]

**💡 改写要点：**
- 使用STAR法则结构
- 添加量化数据
- 突出业务价值

---

## 🎯 关键机会点挖掘

### 🔍 当前简历缺失的关键要素

#### 🚨 高优先级补充项
1. **📱 可交互作品展示**
   - 现状：[描述当前状态]
   - 建议：[具体可执行的建议]
   - 预期效果：[说明对求职的帮助]

2. **📊 数据驱动成果**
   - 现状：[描述当前状态]
   - 建议：[具体可执行的建议]
   - 预期效果：[说明对求职的帮助]

#### ⚡ 中优先级补充项
1. **🔗 技术博客/开源贡献**
   - 建议：[具体建议]
   - 实施方案：[如何执行]

2. **🎨 产品设计作品集**
   - 建议：[具体建议]
   - 实施方案：[如何执行]

---

## 🎉 总结与行动计划

### 📋 30天优化清单
- [ ] **第1周：** [具体任务]
- [ ] **第2周：** [具体任务]
- [ ] **第3周：** [具体任务]
- [ ] **第4周：** [具体任务]

### 🌟 预期提升效果
通过以上优化，预计你的简历竞争力将从当前的 **XX分** 提升至 **XX分**，在应届生AI产品经理岗位申请中将具备更强的竞争优势。

---

*💪 记住：优秀的简历不是一蹴而就的，而是在不断优化中逐步完善的。相信通过系统性的改进，你一定能够获得心仪的AI产品经理offer！*

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
