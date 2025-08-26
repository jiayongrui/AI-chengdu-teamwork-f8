import { type NextRequest, NextResponse } from "next/server"
import { callAiApi } from '@/lib/ai-api-client'

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

    // 提取简历亮点
    const resumeHighlightsObj = extractResumeHighlights(resumeText || "", opportunity.tags || [])
    const resumeHighlights = `**技能匹配：** ${resumeHighlightsObj.skills.join('、') || '无'}

**项目经验：**
${resumeHighlightsObj.experiences.map(exp => `- ${exp}`).join('\n') || '- 无相关经验'}

**教育背景：** ${resumeHighlightsObj.education || '未提供'}`

    // 构建简历优化报告生成的AI提示词
    const prompt = `# 角色与目标 
你是一位顶级的AI产品经理职业导师和招聘专家。你的唯一目标是基于一个特定的、量化的简历评估模型，帮助求职者优化简历，以最大限度地提高成功申请目标岗位的概率。 

# 核心评估模型 (Context) 
你必须严格按照以下五个维度及其权重，来分析和评估简历。这是你所有建议的基石。 

* **1. 背景与经验 (权重 20%)**: 评估教育背景、专业匹配度、以及实习/项目的相关性。 
* **2. 专业知识与技能 (权重 30%)**: 评估简历中体现的AI技术认知（如RAG, Agent）和产品方法论（如用户研究, PRD）。 
* **3. 产品作品与成果 (权重 20%)**: 评估提供的可交互作品、产品文档、分析报告等成果的质量和说服力。这是"Show, Don't Tell"的关键。 
* **4. 核心胜任力 (权重 15%)**: 通过简历的语言和结构，评估逻辑思维和结果导向意识。重点是项目描述是否量化，是否使用STAR法则。 
* **5. 发展潜力 (权重 15%)**: 寻找简历中体现自驱力、产品热情和主动性的信号，如个人博客、GitHub项目、开源贡献等。 

# 目标岗位信息
**公司**: ${opportunity.company}
**职位**: ${opportunity.title}
**城市**: ${opportunity.city || '未指定'}
**岗位标签**: ${(opportunity.tags || []).join(', ')}
**岗位描述**: ${opportunity.reason || '暂无详细描述'}

# 求职者简历信息
${resumeHighlights}

# 你的任务 (Instructions) 
请严格按照以下步骤，以清晰、专业、鼓励的语气，为求职者提供一份完整的简历优化报告： 

1. **量化评估诊断 (Score & Diagnose)**: 
   * 首先，根据上述评估模型和简历信息，为简历进行打分（满分100）。 
   * 然后，清晰地列出五个维度各自的得分（例如：背景与经验 15/20），并简要说明得分原因。这能让求职者直观地看到自己的长板和短板。 

2. **分维度优化建议 (Actionable Advice)**: 
   * 针对每一个维度，特别是失分较多的维度，提供**具体、可执行**的优化建议。 
   * 例如，如果"作品成果"维度失分，你应该建议："可以尝试将你在XX项目中的需求文档整理成一份简洁的PDF，并添加到作品集链接中。" 

3. **核心描述改写 (Rewrite Key Points)**: 
   * 从"实习经历"或"项目经历"中，**挑选出2-3条最薄弱的描述**。 
   * 展示一个**"优化前"**和**"优化后"**的对比。 
   * "优化后"的版本必须运用**STAR法则**，并尽可能地**加入量化结果或业务影响**。这是报告中最核心的部分。 

4. **机会点挖掘 (Uncover Opportunities)**: 
   * 最后，总结出简历目前**缺失的关键信息或"加分项"**。 
   * 例如："你的简历缺少一个可交互的作品，强烈建议你花一天时间，使用Coze或Dify搭建一个能解决身边小问题的AI Bot，并将链接附上，这将是决定性的加分项。" 

# 输出要求
**重要：你必须严格按照以下JSON格式输出，不要添加任何其他文字说明或markdown标记。直接输出纯JSON格式的内容。**

请按以下JSON格式输出简历优化报告：

{
  "quantitativeAssessment": {
    "totalScore": 85,
    "dimensionScores": {
      "背景与经验": {"score": "16/20", "reason": "教育背景与AI产品经理岗位匹配度较高，但缺少相关实习经验"},
      "专业知识与技能": {"score": "24/30", "reason": "掌握基础AI技术概念，但缺少RAG、Agent等前沿技术实践和PRD撰写经验"},
      "产品作品与成果": {"score": "15/20", "reason": "有项目经历，但缺少可交互的AI产品作品和详细的产品文档"},
      "核心胜任力": {"score": "12/15", "reason": "项目描述基本清晰，但缺少STAR法则结构和量化业务影响数据"},
      "发展潜力": {"score": "13/15", "reason": "有GitHub项目展示技术能力，但缺少产品思维和用户洞察的体现"}
    }
  },
  "dimensionalOptimization": {
    "背景与经验": ["建议寻找AI产品相关的实习机会，或参与AI产品的用户研究项目"],
    "专业知识与技能": ["深入学习RAG、Agent技术并完成实践项目，学习PRD撰写和用户研究方法论"],
    "产品作品与成果": ["使用Coze或Dify搭建一个AI Bot作品，整理项目的PRD文档和用户反馈分析"],
    "核心胜任力": ["使用STAR法则重写所有项目描述，重点突出Situation、Task、Action、Result四个要素"],
    "发展潜力": ["开设技术博客分享AI产品思考，参与开源AI项目贡献代码或文档"]
  },
  "coreDescriptionRewrite": [
    {
      "type": "项目经历",
      "original": "参与了AI聊天机器人项目开发",
      "optimized": "【Situation】针对校园信息查询效率低的问题，【Task】负责设计并开发AI聊天机器人产品，【Action】通过用户调研收集200+条真实需求，设计对话流程和知识库架构，使用RAG技术提升回答准确率，【Result】最终产品服务1000+用户，查询成功率达85%，用户满意度4.2/5.0",
      "improvements": ["使用STAR法则结构化描述", "添加具体的用户调研数据", "量化产品使用效果和用户反馈"]
    },
    {
      "type": "项目经历",
      "original": "完成了产品需求文档撰写",
      "optimized": "【Situation】为提升用户体验，【Task】负责核心功能的PRD撰写和产品规划，【Action】深度访谈15位目标用户，分析竞品功能差异，设计用户故事地图和功能优先级矩阵，【Result】PRD获得技术团队一致认可，功能上线后用户留存率提升20%",
      "improvements": ["明确PRD撰写的业务背景", "详细描述用户研究方法", "量化PRD质量和业务影响"]
    }
  ],
  "opportunityMining": {
    "missingElements": ["缺少可交互的AI产品作品展示", "没有完整的产品分析报告", "缺少AI产品相关的专业认证"],
    "actionableSteps": ["使用Coze或Dify搭建一个解决实际问题的AI Bot", "撰写一份AI产品市场分析报告", "参加AI产品相关的比赛或获得产品经理认证"],
    "gameChangers": ["搭建一个有实际用户使用的AI产品作品，这是AI产品经理岗位的核心加分项", "完成对AI产品市场的深度分析，展示商业洞察和产品思维"]
  }
}

**再次提醒：请直接输出上述JSON格式的内容，不要添加任何解释文字或代码块标记。**

`

    // 使用新的API管理系统调用AI
    const apiResult = await callAiApi({
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 8000,
      temperature: 0.7
    })

    const text = apiResult.choices[0].message.content

    // 尝试解析AI返回的JSON格式报告
    let reportData
    try {
      // 清理AI返回的文本，移除可能的markdown代码块标记
      let cleanText = text.trim()
      
      // 移除可能的markdown代码块标记
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      
      // 尝试直接解析整个文本
      try {
        reportData = JSON.parse(cleanText)
      } catch (directParseError) {
        // 如果直接解析失败，尝试提取JSON部分
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          // 找到最后一个完整的JSON对象
          let jsonStr = jsonMatch[0]
          // 确保JSON对象完整（括号匹配）
          let braceCount = 0
          let endIndex = 0
          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') braceCount++
            if (jsonStr[i] === '}') braceCount--
            if (braceCount === 0) {
              endIndex = i + 1
              break
            }
          }
          if (endIndex > 0) {
            jsonStr = jsonStr.substring(0, endIndex)
          }
          reportData = JSON.parse(jsonStr)
        } else {
          throw new Error('未找到有效的JSON格式数据')
        }
      }
      
      // 验证返回的数据结构是否符合预期
      if (!reportData.quantitativeAssessment || !reportData.dimensionalOptimization || !reportData.coreDescriptionRewrite || !reportData.opportunityMining) {
        throw new Error('AI返回的数据结构不符合预期格式')
      }
      
    } catch (parseError) {
      console.error('JSON解析失败:', parseError, '原始文本:', text.substring(0, 500))
      // 如果解析失败，返回原始文本作为报告
      reportData = {
        dimensionalOptimization: {
          "技能匹配度": {
            score: "待评估",
            analysis: text.slice(0, 500),
            suggestions: ["请查看完整报告内容"]
          }
        },
        summary: {
          overallScore: "待评估",
          keyStrengths: ["请查看完整报告"],
          improvementAreas: ["请查看完整报告"],
          actionPlan: ["请查看完整报告"]
        }
      }
    }

    return NextResponse.json({
      success: true,
      report: reportData,
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
    
    const fallbackReport = {
      dimensionalOptimization: {
        "技能匹配度": {
          score: "待评估",
          analysis: "AI服务暂时不可用，无法进行详细分析",
          suggestions: ["请稍后重试获取详细建议"]
        },
        "项目经验": {
          score: "待评估",
          analysis: fallbackResumeHighlights.includes('项目经验') ? "检测到项目经验" : "未检测到明显项目经验",
          suggestions: ["请稍后重试获取详细建议"]
        },
        "教育背景": {
          score: "待评估",
          analysis: fallbackResumeHighlights.includes('教育背景') ? "检测到教育背景" : "未检测到教育背景",
          suggestions: ["请稍后重试获取详细建议"]
        }
      },
      coreDescriptionRewrite: {
        original: "当前简历内容",
        optimized: "AI服务恢复后将提供优化建议",
        improvements: ["请稍后重试"]
      },
      keyOpportunityMining: {
        hiddenStrengths: ["请稍后重试获取分析"],
        marketAlignment: "AI服务恢复后将提供分析",
        competitiveAdvantage: "AI服务恢复后将提供分析"
      },
      summary: {
        overallScore: "待评估",
        keyStrengths: ["请稍后重试获取分析"],
        improvementAreas: ["请稍后重试获取分析"],
        actionPlan: ["请稍后重试获取完整的优化建议"]
      }
    }
    
    return NextResponse.json({
      success: true,
      report: fallbackReport,
      rawText: fallbackBody,
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