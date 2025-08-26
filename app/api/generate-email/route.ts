import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"
import { callAiApi } from '@/lib/ai-api-client'
import { apiManager } from '@/lib/api-manager'

// 从简历中提取个人信息（姓名和联系方式）
function extractPersonalInfo(resumeText: string) {
  if (!resumeText || resumeText.trim().length === 0) {
    return {
      name: '',
      phone: '',
      email: ''
    }
  }

  const text = resumeText.trim()
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let name = ''
  let phone = ''
  let email = ''
  
  // 提取邮箱
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emailMatch = text.match(emailRegex)
  if (emailMatch && emailMatch.length > 0) {
    email = emailMatch[0]
  }
  
  // 提取手机号
  const phoneRegex = /(?:1[3-9]\d{9}|\+86\s*1[3-9]\d{9}|\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4})/g
  const phoneMatch = text.match(phoneRegex)
  if (phoneMatch && phoneMatch.length > 0) {
    phone = phoneMatch[0].replace(/\s+/g, '').replace(/[()\-]/g, '')
  }
  
  // 提取姓名（通常在简历开头，寻找可能的姓名模式）
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const line = lines[i].trim()
    
    // 跳过空行
    if (!line) continue
    
    // 跳过包含常见简历关键词的行
    if (line.includes('简历') || line.includes('求职') || line.includes('应聘') || 
        line.includes('联系方式') || line.includes('个人信息') || line.includes('基本信息') ||
        line.includes('教育背景') || line.includes('工作经验') || line.includes('技能') ||
        line.includes('项目经验') || line.includes('自我评价')) {
      continue
    }
    
    // 跳过包含邮箱或长电话号码的行
    if (line.includes('@') || /\d{10,}/.test(line)) {
      continue
    }
    
    // 跳过包含明显非姓名内容的行
    if (line.includes('：') || line.includes(':') || line.includes('，') || 
        line.includes('。') || line.includes('、') || line.includes('；')) {
      continue
    }
    
    // 优先匹配纯中文姓名（2-4个字符）
    const chineseNameMatch = line.match(/^([\u4e00-\u9fa5]{2,4})$/)
    if (chineseNameMatch) {
      name = chineseNameMatch[1]
      break
    }
    
    // 匹配英文姓名
    const englishNameMatch = line.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)+)$/)
    if (englishNameMatch) {
      name = englishNameMatch[1]
      break
    }
    
    // 匹配包含中文姓名的行（如"姓名：张三"）
    const nameWithLabelMatch = line.match(/(?:姓名|名字|Name)[:：]?\s*([\u4e00-\u9fa5]{2,4}|[A-Za-z]+(?:\s+[A-Za-z]+)+)/)
    if (nameWithLabelMatch) {
      name = nameWithLabelMatch[1]
      break
    }
    
    // 如果行很短且只包含字母和中文，可能是姓名
    if (line.length >= 2 && line.length <= 8 && /^[\u4e00-\u9fa5A-Za-z\s]+$/.test(line)) {
      // 排除一些常见的非姓名词汇
      if (!line.includes('先生') && !line.includes('女士') && !line.includes('同学') &&
          !line.includes('老师') && !line.includes('经理') && !line.includes('工程师')) {
        name = line
        break
      }
    }
  }
  
  return {
    name: name || '',
    phone: phone || '',
    email: email || ''
  }
}

function buildTemplateEmail(params: {
  user: { username: string }
  opportunity: any
  resumeText?: string | null
  topRequirements?: string[]
}) {
  const { user, opportunity, resumeText, topRequirements } = params
  const companyName = opportunity.company || opportunity.company_name
  const jobTitle = opportunity.title || opportunity.job_title
  
  // 从简历中提取个人信息
  const personalInfo = extractPersonalInfo(resumeText || '')
  const displayName = personalInfo.name || user.username
  
  // 统一的主题格式
  const subject = `应聘${jobTitle} - ${displayName}`
  
  // 构建联系方式信息
  const contactInfo = []
  if (personalInfo.phone) {
    contactInfo.push(`电话：${personalInfo.phone}`)
  }
  if (personalInfo.email) {
    contactInfo.push(`邮箱：${personalInfo.email}`)
  }
  
  // 构建格式规范的邮件正文
  const body = [
    `您好！我对贵公司的${jobTitle}职位非常感兴趣。`,
    "",
    "针对岗位核心要求，我的匹配情况如下：",
    // 分点列出匹配要求
    ...(topRequirements && topRequirements.length > 0 
      ? topRequirements.slice(0, 3).map(req => `• ${req.replace(/^\d+\.\s*/, '').slice(0, 50)}${req.length > 50 ? '...' : ''}`)
      : [
          "• 具备扎实的专业技术基础和学习能力",
          "• 拥有相关项目开发和实践经验", 
          "• 具备良好的团队协作和沟通能力"
        ]),
    "",
    "个人亮点：",
    resumeText && resumeText.trim().length > 0
      ? `${resumeText.slice(0, 120)}${resumeText.length > 120 ? '...' : ''}`
      : "具备相关技术栈经验，能够快速适应团队需求并贡献价值。",
    "",
    "期待有机会进一步交流，感谢您的时间！",
    "",
    "此致",
    "敬礼！",
    "",
    displayName,
    ...(contactInfo.length > 0 ? ["", ...contactInfo] : []),
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

// 提取招聘要求的最重要三条
function extractTopThreeRequirements(opportunity: any): string[] {
  const requirements: string[] = []
  
  // 从职位描述中提取要求
  if (opportunity.job_description) {
    const desc = opportunity.job_description
    // 查找包含要求关键词的句子
    const requirementKeywords = ['要求', '需要', '具备', '熟悉', '掌握', '经验', '能力', '技能', '负责', '参与']
    const sentences = desc.split(/[。；;\n]/).filter(s => s.trim().length > 5)
    
    sentences.forEach(sentence => {
      if (requirementKeywords.some(keyword => sentence.includes(keyword))) {
        requirements.push(sentence.trim())
      }
    })
  }
  
  // 添加经验要求
  if (opportunity.experience_required) {
    requirements.push(`工作经验：${opportunity.experience_required}`)
  }
  
  // 添加学历要求
  if (opportunity.education_required) {
    requirements.push(`学历要求：${opportunity.education_required}`)
  }
  
  // 从标签中提取技能要求
  if (opportunity.tags && opportunity.tags.length > 0) {
    const skillTags = opportunity.tags.filter((tag: string) => 
      !['大厂', '创业', '融资', '北京', '上海', '深圳', '杭州', '广州'].includes(tag)
    )
    if (skillTags.length > 0) {
      requirements.push(`核心技能：${skillTags.join('、')}`)
    }
  }
  
  // 返回最重要的三条，优先选择更具体和详细的要求
  return requirements
    .sort((a, b) => b.length - a.length) // 按长度排序，更详细的排在前面
    .slice(0, 3)
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

    // 提取招聘要求的最重要三条
    const topRequirements = extractTopThreeRequirements(opportunity)
    
    // 提取个人信息
    const personalInfo = extractPersonalInfo(resumeText || '')
    const displayName = personalInfo.name || user.username
    
    // 提取简历亮点
    const resumeHighlightsObj = extractResumeHighlights(resumeText || "", opportunity.tags || [])
    const resumeHighlights = `**个人信息：**
姓名：${displayName}${personalInfo.phone ? `\n电话：${personalInfo.phone}` : ''}${personalInfo.email ? `\n邮箱：${personalInfo.email}` : ''}

**技能匹配：** ${resumeHighlightsObj.skills.join('、') || '无'}

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
你是一位专业的求职邮件写作专家。你需要帮助求职者撰写一封格式规范、重点突出的求职邮件。

# 核心要求
1. 邮件格式规范，重点内容分点分行，提高可读性
2. 重点针对岗位的三条最重要招聘要求进行匹配
3. 语言专业诚恳，结构清晰
4. 总长度控制在250-350字以内

# 岗位最重要的三条招聘要求
${topRequirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

# 目标岗位信息
**公司**: ${opportunity.company || opportunity.company_name}
**职位**: ${opportunity.title || opportunity.job_title}
**城市**: ${opportunity.city || opportunity.location || '未指定'}
**薪资**: ${opportunity.salary_range || '面议'}
**个性化开场**: ${personalizedGreeting}

# 求职者简历信息
${resumeHighlights}

# 输出要求
请按以下JSON格式输出求职邮件：

{
  "subject": "邮件主题",
  "body": "邮件正文内容"
}

# 邮件格式规范

## 主题格式
应聘【职位名称】- 【姓名】

## 正文结构
1. **开场问候**：您好！我对贵公司的【职位名称】职位非常感兴趣。

2. **核心匹配**（分点列出）：
   针对岗位核心要求，我的匹配情况如下：
   • 【要求1的匹配说明】
   • 【要求2的匹配说明】  
   • 【要求3的匹配说明】

3. **个人亮点**：
   【1-2句话概括核心优势或项目经验】

4. **结尾**：
   期待有机会进一步交流，感谢您的时间！
   
   此致
   敬礼！
   
   【姓名】
   【联系方式】

重要：严格按照上述格式生成邮件，确保分点分行，结构清晰。在邮件结尾的【姓名】处填入"${displayName}"，在【联系方式】处填入联系信息${personalInfo.phone || personalInfo.email ? '（' + [personalInfo.phone && `电话：${personalInfo.phone}`, personalInfo.email && `邮箱：${personalInfo.email}`].filter(Boolean).join('，') + '）' : '（如有）'}。`

    // 使用新的API管理系统调用AI
    console.log('发送AI请求，内容长度:', prompt.length)
    
    const apiResult = await callAiApi({
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })
    
    console.log('AI API响应成功')
    
    if (!apiResult.choices || !apiResult.choices[0] || !apiResult.choices[0].message) {
      throw new Error('AI API返回格式异常')
    }
    
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
      const templateEmail = buildTemplateEmail({ user, opportunity, resumeText, topRequirements })
      emailData = {
        subject: templateEmail.subject,
        body: templateEmail.body
      }
    }

    // 获取当前API状态
    const apiStatus = apiManager.getStatus()
    
    return NextResponse.json({
      success: true,
      email: emailData,
      rawText: text,
      metadata: {
        company: opportunity.company,
        position: opportunity.title,
        city: opportunity.city,
        tags: opportunity.tags,
        generatedAt: new Date().toISOString(),
        apiKey: apiStatus.currentKey,
        apiStatus: `${apiStatus.availableCount}/${apiStatus.totalCount} 可用`
      }
    })
  } catch (error: any) {
    console.error("AI邮件生成失败:", error)
    // 提取招聘要求用于模板邮件
    const topRequirements = extractTopThreeRequirements(opportunity)
    // 返回基础的模板邮件
    const templateEmail = buildTemplateEmail({ user, opportunity, resumeText, topRequirements })
    
    // 获取当前API状态（fallback情况）
    const fallbackApiStatus = apiManager.getStatus()
    
    return NextResponse.json({
      success: true,
      email: {
        subject: templateEmail.subject,
        body: templateEmail.body
      },
      rawText: templateEmail.body,
      fallback: true,
      metadata: {
        company: opportunity.company || opportunity.company_name,
        position: opportunity.title || opportunity.job_title,
        city: opportunity.city || opportunity.location,
        tags: opportunity.tags,
        generatedAt: new Date().toISOString(),
        apiKey: fallbackApiStatus.currentKey,
        apiStatus: `${fallbackApiStatus.availableCount}/${fallbackApiStatus.totalCount} 可用`
      }
    })
  }
}
