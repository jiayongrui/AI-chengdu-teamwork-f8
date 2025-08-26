import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"
import { todayOpportunities } from "@/lib/opportunities"
import { callAiApi } from "@/lib/ai-api-client"

export async function POST(req: NextRequest) {
  // 解析请求体
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 })
  }

  const { userId, opportunityId } = payload || {}

  try {
    if (!userId || !opportunityId) {
      return NextResponse.json({ 
        error: "缺少必要参数：userId 和 opportunityId" 
      }, { status: 400 })
    }

    let resumeText = ""
    let opportunity: any = null

    // 尝试从数据库获取数据
    const supabase = getSupabaseClient()
    if (supabase) {
      try {
        // 获取用户最新简历
        const { data: resumeData, error: resumeError } = await supabase
          .from('resumes')
          .select('content')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (!resumeError && resumeData) {
          resumeText = resumeData.content
        }

        // 获取职位信息
        const { data: opportunityData, error: opportunityError } = await supabase
          .from('opportunities')
          .select('*')
          .eq('id', opportunityId)
          .single()

        if (!opportunityError && opportunityData) {
          opportunity = opportunityData
        }
      } catch (dbError) {
        console.log('数据库查询失败，使用本地数据:', dbError)
      }
    }

    // Fallback: 使用本地数据
    if (!resumeText) {
      // 使用默认简历内容
      resumeText = `张三
软件工程师

教育背景：
- 计算机科学与技术学士学位
- 毕业于某知名大学

工作经验：
- 3年前端开发经验
- 熟悉React、Vue等前端框架
- 具备良好的团队协作能力

技能特长：
- JavaScript、TypeScript
- HTML、CSS
- Node.js、Express
- 数据库设计与优化`
      console.log('使用默认简历内容进行演示')
    }

    if (!opportunity) {
      // 从本地机会数据中查找
      const localOpp = todayOpportunities.find(opp => opp.id === opportunityId)
      if (localOpp) {
        opportunity = {
          id: localOpp.id,
          company_name: localOpp.company,
          job_title: localOpp.title,
          location: localOpp.city,
          salary_range: '20-35K',
          experience_required: '3-5年',
          education_required: '本科及以上',
          industry: '互联网',
          company_size: '100-500人',
          tags: localOpp.tags,
          job_description: localOpp.reason || '暂无详细描述',
          benefits: '五险一金、弹性工作、年终奖'
        }
      } else {
        // 使用默认职位信息
        opportunity = {
          id: opportunityId,
          company_name: 'AI科技公司',
          job_title: 'AI产品经理',
          location: '北京',
          salary_range: '20-35K',
          experience_required: '3-5年',
          education_required: '本科及以上',
          industry: '人工智能',
          company_size: '100-500人',
          tags: ['AI', '产品经理'],
          job_description: '负责AI产品的规划、设计和优化',
          benefits: '五险一金、弹性工作、年终奖'
        }
      }
      console.log('使用本地职位数据进行演示')
    }

    // 构建AI分析的Prompt
    const analysisPrompt = `# 角色与目标
你是一位顶级的AI产品经理职业导师和招聘专家。你的唯一目标是基于一个特定的、量化的简历评估模型，帮助我优化简历，以最大限度地提高我成功申请【应届生AI产品经理】岗位的概率。

# 核心评估模型 (Context)
你必须严格按照以下五个维度及其权重，来分析和评估我的简历。这是你所有建议的基石。

* **1. 背景与经验 (权重 20%)**: 评估我的教育背景、专业匹配度、以及实习/项目的相关性。
* **2. 专业知识与技能 (权重 30%)**: 评估我简历中体现的AI技术认知（如RAG, Agent）和产品方法论（如用户研究, PRD）。
* **3. 产品作品与成果 (权重 20%)**: 评估我提供的可交互作品、产品文档、分析报告等成果的质量和说服力。这是"Show, Don't Tell"的关键。
* **4. 核心胜任力 (权重 15%)**: 通过简历的语言和结构，评估我的逻辑思维和结果导向意识。重点是项目描述是否量化，是否使用STAR法则。
* **5. 发展潜力 (权重 15%)**: 寻找简历中体现自驱力、产品热情和主动性的信号，如个人博客、GitHub项目、开源贡献等。

# 目标岗位信息
- 公司名称：${opportunity.company_name || '未知公司'}
- 岗位名称：${opportunity.job_title || 'AI产品经理'}
- 工作地点：${opportunity.location || '不限'}
- 薪资范围：${opportunity.salary_range || '面议'}
- 经验要求：${opportunity.experience_required || '不限'}
- 学历要求：${opportunity.education_required || '不限'}
- 所属行业：${opportunity.industry || '未知'}
- 公司规模：${opportunity.company_size || '未知'}
- 职位标签：${opportunity.tags ? opportunity.tags.join('、') : '无'}
- 职位描述：${opportunity.job_description || '暂无详细描述'}

# 我的简历信息
${resumeText}

# 你的任务 (Instructions)
请严格按照以下步骤，以清晰、专业、鼓励的语气，为我提供一份完整的简历优化报告：

1. **量化评估诊断 (Score & Diagnose)**:
   * 首先，根据上述评估模型和我的简历信息，为我的简历进行打分（满分100）。
   * 然后，清晰地列出五个维度各自的得分（例如：背景与经验 15/20），并简要说明得分原因。这能让我直观地看到自己的长板和短板。

2. **分维度优化建议 (Actionable Advice)**:
   * 针对每一个维度，特别是失分较多的维度，提供**具体、可执行**的优化建议。
   * 例如，如果"作品成果"维度失分，你应该建议我："可以尝试将你在XX项目中的需求文档整理成一份简洁的PDF，并添加到作品集链接中。"

3. **核心描述改写 (Rewrite Key Points)**:
   * 从我的"实习经历"或"项目经历"中，**挑选出2-3条最薄弱的描述**。
   * 展示一个**"优化前"**和**"优化后"**的对比。
   * "优化后"的版本必须运用**STAR法则**，并尽可能地**加入量化结果或业务影响**。这是报告中最核心的部分。

4. **机会点挖掘 (Uncover Opportunities)**:
   * 最后，总结出我的简历目前**缺失的关键信息或"加分项"**。
   * 例如："你的简历缺少一个可交互的作品，强烈建议你花一天时间，使用Coze或Dify搭建一个能解决身边小问题的AI Bot，并将链接附上，这将是决定性的加分项。"

**输出格式要求（必须严格按照JSON格式返回）：**
{
  "overall_score": 75,
  "dimension_scores": {
    "background_experience": { "score": 15, "max_score": 20, "reason": "学历匹配度高，但缺乏相关实习经验" },
    "professional_skills": { "score": 20, "max_score": 30, "reason": "具备基础AI技术认知，但产品方法论体现不足" },
    "product_works": { "score": 12, "max_score": 20, "reason": "有项目经历但缺乏可交互作品" },
    "core_competency": { "score": 12, "max_score": 15, "reason": "简历结构清晰，但项目描述缺乏量化" },
    "development_potential": { "score": 10, "max_score": 15, "reason": "缺少个人作品和开源贡献" }
  },
  "optimization_suggestions": {
    "background_experience": ["建议寻找AI产品相关的实习机会", "可以参与开源AI项目获得实践经验"],
    "professional_skills": ["深入学习RAG、Agent等前沿AI技术", "学习并实践产品需求文档(PRD)撰写"],
    "product_works": ["创建一个可交互的AI应用Demo", "整理项目文档并制作作品集"],
    "core_competency": ["使用STAR法则重写项目描述", "为项目成果添加量化数据"],
    "development_potential": ["建立技术博客分享AI产品见解", "在GitHub上展示个人项目"]
  },
  "rewrite_examples": [
    {
      "original": "参与了机器学习项目开发",
      "optimized": "【Situation】在XX课程项目中，【Task】负责构建用户行为预测模型，【Action】使用Python和TensorFlow实现了基于LSTM的推荐算法，【Result】模型准确率达到85%，为300+用户提供个性化推荐，用户点击率提升30%"
    }
  ],
  "missing_opportunities": [
    "缺少可访问的AI产品Demo链接",
    "简历中未体现对目标公司业务的了解",
    "缺少量化的项目成果数据",
    "未展示产品思维和用户洞察能力"
  ],
  "summary": "你的简历具备良好的技术基础，但在产品实践和作品展示方面有较大提升空间。建议重点补充可交互作品和量化项目成果。"
}

请开始你的分析和优化吧！`

    // 使用新的API管理系统调用AI
    const apiResult = await callAiApi({
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      max_tokens: 6000,
      temperature: 0.3
    })

    const aiResponse = apiResult.choices[0].message.content
    
    // 添加详细日志
    console.log('AI原始响应:', aiResponse)
    console.log('AI响应长度:', aiResponse.length)

    // 尝试解析 AI 返回的 JSON
    let analysisResult
    try {
      // 提取 JSON 部分（如果 AI 返回了额外的文本）
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      console.log('JSON匹配结果:', jsonMatch ? '找到JSON' : '未找到JSON')
      if (jsonMatch) {
        console.log('提取的JSON:', jsonMatch[0])
        analysisResult = JSON.parse(jsonMatch[0])
        console.log('解析后的结果:', analysisResult)
      } else {
        throw new Error('AI返回的内容中未找到有效的JSON格式')
      }
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      console.error('AI原始响应:', aiResponse)
      
      // 返回解析失败的错误，但包含原始AI响应用于调试
      return NextResponse.json({
        error: "AI返回数据解析失败",
        debug_info: {
          ai_response: aiResponse,
          parse_error: parseError instanceof Error ? parseError.message : String(parseError)
        }
      }, { status: 500 })
    }

    // 验证返回数据的完整性
    if (!analysisResult.overall_score || !analysisResult.dimension_scores) {
      console.error('AI返回数据不完整:', analysisResult)
      return NextResponse.json({
        error: "AI返回数据格式不完整",
        debug_info: { analysis_result: analysisResult }
      }, { status: 500 })
    }

    // 返回成功结果
    return NextResponse.json({
      success: true,
      data: analysisResult
    })

  } catch (error) {
    console.error('Gap analysis API错误:', error)
    return NextResponse.json({
      error: "服务器内部错误",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}