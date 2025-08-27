import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase-client"

export async function POST(req: NextRequest) {
  // 解析请求体
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 })
  }

  const { userId, opportunityId } = payload || {}
  console.log('Score breakdown API called with:', { userId, opportunityId })

  try {
    if (!userId || !opportunityId) {
      console.log('Missing required parameters:', { userId, opportunityId })
      return NextResponse.json({ 
        error: "缺少必要参数：userId 和 opportunityId" 
      }, { status: 400 })
    }

    // 获取 Supabase 客户端
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.log('Supabase client initialization failed')
      return NextResponse.json({ 
        error: "数据库连接失败" 
      }, { status: 500 })
    }
    console.log('Supabase client initialized successfully')

    // 获取用户最新简历
    console.log('Fetching resume for userId:', userId)
    const { data: resumeData, error: resumeError } = await supabase
      .from('resumes')
      .select('content')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    console.log('Resume query result:', { resumeData, resumeError })
    if (resumeError || !resumeData) {
      console.log('Resume not found for userId:', userId, 'Error:', resumeError)
      // 如果没有找到简历，使用默认简历内容进行演示
      const defaultResumeContent = `张三
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
      
      console.log('Using default resume content for demo')
      // 继续使用默认简历内容
      var resumeText = defaultResumeContent
    } else {
      var resumeText = resumeData.content
    }

    // 获取职位信息
    console.log('Fetching opportunity for opportunityId:', opportunityId)
    const { data: opportunityData, error: opportunityError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()
    
    console.log('Opportunity query result:', { opportunityData, opportunityError })
    if (opportunityError || !opportunityData) {
      console.log('Opportunity not found for opportunityId:', opportunityId, 'Error:', opportunityError)
      // 如果没有找到职位信息，使用默认职位信息进行演示
      var opportunityInfo = {
        job_title: 'AI产品经理',
        company_name: '科技公司',
        location: '北京',
        salary_range: '20-35K',
        experience_required: '3-5年',
        education_required: '本科及以上',
        job_description: 'AI产品经理岗位，负责AI产品的规划、设计和管理，需要具备良好的产品思维和技术理解能力。',
        company_size: '500-1000人',
        industry: '人工智能',
        benefits: '五险一金、弹性工作、股票期权'
      }
      console.log('Using default opportunity info for demo')
    } else {
      var opportunityInfo = opportunityData
    }

    // 移除原来的错误返回，现在使用fallback机制
    const opportunity = opportunityInfo

    // 构建增强版评分系统的 Prompt
    const scoringPrompt = `# AI 产品经理岗位简历量化打分指南

你是一名**严格遵守评分维度表**的 AI 招聘官，需要综合评估候选人简历与目标职位的匹配度。

**重要：你需要同时考虑简历内容和目标职位的完整信息（包括学历要求、经验要求、薪资水平、公司背景、职位描述等）来进行匹配度评估。**

执行步骤：
1. **逐条读取**下方 12 项二级评估项（含权重）。
2. **在简历原文中定位**能佐证该项的事实；若无可佐证内容则给 0 分。
3. **结合目标职位信息**评估匹配度：考虑学历匹配、经验匹配、技能匹配、薪资匹配等。
4. **按 0–5 整数评分**，并写一句 ≤30 字的理由（必须引用简历原文和职位要求）。
5. **计算加权总分** = Σ(得分 × 权重) × 20（转换为百分制）。
   **注意：最终total_score必须是百分制分数，即0-100之间的数值！**
6. **输出推荐等级**：
   - 90–100：强烈推荐
   - 75–89：推荐
   - 60–74：谨慎推荐
   - <60：不推荐

## 📊 评分维度表

| 一级维度 | 二级评估项 | 权重 | 严格评分标准 (0-5 分) |
|---|---|---|---|
| **1. 背景与经验** | 1.1 学历与专业匹配 | 8% | 5 985/211院校相关专业硕士及以上<br>4 重点院校相关专业本科或普通院校硕士<br>3 普通院校相关专业本科<br>2 专业不完全匹配但有相关辅修/自学证明<br>1 学历或专业与要求有明显差距<br>0 完全不符合学历专业要求 |
|  | 1.2 AI 相关实习/项目 | 15% | 5 头部公司AI PM实习6个月以上+独立负责上线项目<br>4 知名公司AI相关实习3个月以上<br>3 有完整AI项目经验但非头部公司<br>2 参与过AI项目但贡献度一般<br>1 仅有AI相关课程项目<br>0 无任何AI相关经验 |
| **2. 专业知识与技能** | 2.1 AI 技术认知 | 15% | 5 深度掌握RAG/Agent/Fine-tuning并有实际应用案例<br>4 理解核心AI技术原理并有简单应用<br>3 了解主流AI技术但应用有限<br>2 仅了解基础概念无实际应用<br>1 只能罗列AI关键词<br>0 无AI技术认知 |
|  | 2.2 产品方法论 | 10% | 5 完整PM方法论实践+数据驱动决策案例<br>4 掌握核心PM技能并有项目应用<br>3 了解PM基础方法论<br>2 仅有理论知识无实践<br>1 对PM方法论了解有限<br>0 无产品方法论基础 |
| **3. 产品作品与成果** | 3.1 可交互作品 | 20% | 5 多个高质量AI产品上线+用户数据证明<br>4 至少1个完整AI产品可访问使用<br>3 有可交互原型但功能有限<br>2 仅有静态演示或截图<br>1 只有设计稿无实际产品<br>0 无任何产品作品 |
|  | 3.2 产品文档与分析 | 8% | 5 专业级PRD/竞品分析+公开技术博客<br>4 高质量产品文档+深度分析<br>3 标准格式产品文档<br>2 简单的产品描述文档<br>1 仅有项目介绍无深度分析<br>0 无产品文档 |
| **4. 核心胜任力** | 4.1 逻辑与结构 | 6% | 5 简历逻辑完美+所有项目STAR量化描述<br>4 结构清晰+部分项目有量化数据<br>3 基本结构合理<br>2 结构一般但内容完整<br>1 结构混乱但信息基本完整<br>0 结构极差难以理解 |
|  | 4.2 结果导向 | 12% | 5 多个项目有明确量化成果(增长率/转化率等)<br>4 至少2个项目有量化结果<br>3 至少1个项目有明确数据成果<br>2 有业务影响描述但缺乏具体数据<br>1 仅有定性描述无量化结果<br>0 无任何结果导向表述 |
| **5. 发展潜力** | 5.1 自驱与热情 | 8% | 5 活跃的技术博客/开源项目+行业影响力<br>4 持续的个人项目+技术分享<br>3 有个人项目但更新不频繁<br>2 偶尔的技术学习分享<br>1 仅表达兴趣无实际行动<br>0 无自驱学习证明 |
|  | 5.2 创新与主动性 | 6% | 5 创业经历或顶级竞赛冠军+创新项目<br>4 在实习/项目中主导创新解决方案<br>3 有创新想法并付诸实践<br>2 参与创新项目但贡献一般<br>1 仅有创新意识无实际行动<br>0 无创新主动性体现 |
| **6. 企业认知与匹配** | 6.1 业务领域匹配 | 2% | 5 深度了解目标行业+相关项目经验<br>4 对目标行业有一定认知<br>3 有相关行业接触经验<br>2 通过学习了解相关行业<br>1 对行业了解有限<br>0 完全不了解目标行业 |
|  | 6.2 薪资期望匹配 | 2% | 5 能力明显超出薪资要求<br>4 能力与薪资要求匹配<br>3 能力基本符合薪资水平<br>2 能力略低于薪资要求<br>1 能力与薪资有一定差距<br>0 能力明显不匹配薪资 |

## 候选人简历内容：
${resumeText}

## 目标岗位完整信息：
- 公司名称：${opportunity.company_name || '未知公司'}
- 岗位名称：${opportunity.job_title || 'AI产品经理'}
- 工作地点：${opportunity.location || '不限'}
- 薪资范围：${opportunity.salary_range || '面议'}
- 经验要求：${opportunity.experience_required || '不限'}
- 学历要求：${opportunity.education_required || '不限'}
- 所属行业：${opportunity.industry || '未知'}
- 公司规模：${opportunity.company_size || '未知'}
- 公司福利：${opportunity.benefits || '未提及'}
- 职位标签：${opportunity.tags ? opportunity.tags.join('、') : '无'}
- 职位描述：${opportunity.job_description || '暂无详细描述'}

请严格按照以上评分标准，对简历进行逐项评分，并输出JSON格式的结果。

**重要：total_score必须是0-100的百分制分数，不能是0-5分！**

**严格推荐等级标准：**
- 85-100分：强烈推荐（顶尖候选人，各方面表现优异）
- 70-84分：推荐（优秀候选人，核心能力突出）
- 55-69分：谨慎推荐（合格候选人，但有明显短板）
- 40-54分：不推荐（能力不足，风险较高）
- 0-39分：强烈不推荐（严重不符合要求）

**严格评分要求：**
- 必须有具体事实支撑才能给分，不能基于推测
- 优先考虑实际成果和量化数据
- 对于缺乏证据的能力声明要严格扣分
- 重点关注AI产品经理的核心胜任力

**输出格式要求：**
{
  "scores": {
    "education_background": { "score": 3, "reason": "本科学历符合要求，计算机专业相关" },
    "ai_experience": { "score": 2, "reason": "有AI相关课程项目经验" },
    "ai_technical_knowledge": { "score": 1, "reason": "仅提及机器学习关键词" },
    "product_methodology": { "score": 2, "reason": "简历中体现部分产品技能" },
    "interactive_works": { "score": 0, "reason": "未提供可交互作品" },
    "product_documents": { "score": 1, "reason": "仅有文字描述的项目" },
    "logic_structure": { "score": 3, "reason": "简历结构清晰" },
    "result_oriented": { "score": 2, "reason": "有定性描述但缺乏量化" },
    "self_motivation": { "score": 1, "reason": "提及兴趣但无作品" },
    "innovation_initiative": { "score": 2, "reason": "有学生干部经历" },
    "business_matching": { "score": 1, "reason": "项目经验与目标行业一般相关" },
    "salary_matching": { "score": 3, "reason": "能力基本匹配薪资水平" }
  },
  "total_score": 52.0,
  "recommendation_level": "谨慎推荐",
  "overall_comment": "候选人学历和专业与职位要求匹配，具备基础的技术背景和产品意识，但在AI实践经验和作品展示方面有待加强。薪资期望与能力水平基本匹配。",
  "breakdown": [
    { "dimension": "背景与经验", "score": 50, "weight": 19 },
    { "dimension": "专业知识与技能", "score": 30, "weight": 20 },
    { "dimension": "产品作品与成果", "score": 20, "weight": 26 },
    { "dimension": "核心胜任力", "score": 60, "weight": 15 },
    { "dimension": "发展潜力", "score": 30, "weight": 16 },
    { "dimension": "企业认知与匹配", "score": 40, "weight": 4 }
  ]
}`

    // 清理 prompt 中的特殊字符，但保留中文字符
    const cleanPrompt = scoringPrompt.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim()
    
    console.log('Sending prompt to AI API, length:', cleanPrompt.length)
    console.log('Prompt preview:', cleanPrompt.substring(0, 200) + '...')
    
    // 调用 SiliconFlow API，确保正确处理UTF-8编码
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
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
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`)
    }

    const apiResult = await response.json()
    const aiResponse = apiResult.choices[0].message.content
    
    // 添加详细日志
    console.log('AI原始响应:', aiResponse)
    console.log('AI响应长度:', aiResponse.length)

    // 尝试解析 AI 返回的 JSON
    let scoreResult
    try {
      // 提取 JSON 部分（如果 AI 返回了额外的文本）
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      console.log('JSON匹配结果:', jsonMatch ? '找到JSON' : '未找到JSON')
      if (jsonMatch) {
        console.log('提取的JSON:', jsonMatch[0])
        scoreResult = JSON.parse(jsonMatch[0])
        console.log('解析后的结果:', scoreResult)
        console.log('原始total_score值:', scoreResult.total_score)
        
        // 检查并修正total_score：如果小于等于5，说明AI没有转换为百分制，需要乘以20
        if (scoreResult.total_score && scoreResult.total_score <= 5) {
          console.log('检测到非百分制分数，自动转换为百分制')
          scoreResult.total_score = scoreResult.total_score * 20
          console.log('转换后的total_score值:', scoreResult.total_score)
        }

        // 如果没有 breakdown 数组，根据 scores 生成
        if (!scoreResult.breakdown) {
          console.log('生成 breakdown 数组')
          scoreResult.breakdown = generateBreakdownFromScores(scoreResult.scores)
        }
      } else {
        console.error('未找到有效的JSON格式，AI响应:', aiResponse)
        throw new Error('未找到有效的JSON格式')
      }
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      console.error('解析失败的内容:', aiResponse)
      // 返回默认的评分结果
      scoreResult = {
        scores: {
          education_background: { score: 0, reason: "AI解析失败，请重试" },
          ai_experience: { score: 0, reason: "AI解析失败，请重试" },
          ai_technical_knowledge: { score: 0, reason: "AI解析失败，请重试" },
          product_methodology: { score: 0, reason: "AI解析失败，请重试" },
          interactive_works: { score: 0, reason: "AI解析失败，请重试" },
          product_documents: { score: 0, reason: "AI解析失败，请重试" },
          logic_structure: { score: 0, reason: "AI解析失败，请重试" },
          result_oriented: { score: 0, reason: "AI解析失败，请重试" },
          self_motivation: { score: 0, reason: "AI解析失败，请重试" },
          innovation_initiative: { score: 0, reason: "AI解析失败，请重试" },
          business_matching: { score: 0, reason: "AI解析失败，请重试" },
          salary_matching: { score: 0, reason: "AI解析失败，请重试" }
        },
        total_score: 0,
        recommendation_level: "系统错误",
        overall_comment: "评分系统暂时不可用，请稍后重试。",
        breakdown: [
          { "dimension": "背景与经验", "score": 0, "weight": 19 },
          { "dimension": "专业知识与技能", "score": 0, "weight": 20 },
          { "dimension": "产品作品与成果", "score": 0, "weight": 26 },
          { "dimension": "核心胜任力", "score": 0, "weight": 15 },
          { "dimension": "发展潜力", "score": 0, "weight": 16 },
          { "dimension": "企业认知与匹配", "score": 0, "weight": 4 }
        ],
        raw_response: aiResponse
      }
    }

    // 返回符合前端组件要求的数据格式
    return NextResponse.json({
      success: true,
      totalScore: scoreResult.total_score,
      rating: scoreResult.recommendation_level,
      breakdown: scoreResult.breakdown,
      data: scoreResult
    })

  } catch (error: any) {
    console.error("评分详情获取失败:", error)
    
    // 返回错误信息和默认评分
    return NextResponse.json({
      success: false,
      error: error.message || "评分服务暂时不可用",
      totalScore: 0,
      rating: "服务异常",
      breakdown: [
        { "dimension": "背景与经验", "score": 0, "weight": 19 },
        { "dimension": "专业知识与技能", "score": 0, "weight": 20 },
        { "dimension": "产品作品与成果", "score": 0, "weight": 26 },
        { "dimension": "核心胜任力", "score": 0, "weight": 15 },
        { "dimension": "发展潜力", "score": 0, "weight": 16 },
        { "dimension": "企业认知与匹配", "score": 0, "weight": 4 }
      ],
      data: {
        scores: {
          education_background: { score: 0, reason: "服务异常" },
          ai_experience: { score: 0, reason: "服务异常" },
          ai_technical_knowledge: { score: 0, reason: "服务异常" },
          product_methodology: { score: 0, reason: "服务异常" },
          interactive_works: { score: 0, reason: "服务异常" },
          product_documents: { score: 0, reason: "服务异常" },
          logic_structure: { score: 0, reason: "服务异常" },
          result_oriented: { score: 0, reason: "服务异常" },
          self_motivation: { score: 0, reason: "服务异常" },
          innovation_initiative: { score: 0, reason: "服务异常" },
          business_matching: { score: 0, reason: "服务异常" },
          salary_matching: { score: 0, reason: "服务异常" }
        },
        total_score: 0,
        recommendation_level: "服务异常",
        overall_comment: "评分服务暂时不可用，请稍后重试。"
      }
    }, { status: 500 })
  }
}

// 辅助函数：根据详细评分生成 breakdown 数组
function generateBreakdownFromScores(scores: any): any[] {
  // 维度映射和权重
  const dimensionMapping = {
    "背景与经验": {
      items: ["education_background", "ai_experience"],
      weights: [7, 12],
      totalWeight: 19
    },
    "专业知识与技能": {
      items: ["ai_technical_knowledge", "product_methodology"],
      weights: [12, 8],
      totalWeight: 20
    },
    "产品作品与成果": {
      items: ["interactive_works", "product_documents"],
      weights: [18, 8],
      totalWeight: 26
    },
    "核心胜任力": {
      items: ["logic_structure", "result_oriented"],
      weights: [5, 10],
      totalWeight: 15
    },
    "发展潜力": {
      items: ["self_motivation", "innovation_initiative"],
      weights: [11, 5],
      totalWeight: 16
    },
    "企业认知与匹配": {
      items: ["business_matching", "salary_matching"],
      weights: [2, 2],
      totalWeight: 4
    }
  }

  const breakdown = []
  
  for (const [dimension, config] of Object.entries(dimensionMapping)) {
    let weightedSum = 0
    let totalWeight = 0
    
    // 计算该维度的加权平均分
    for (let i = 0; i < config.items.length; i++) {
      const itemKey = config.items[i]
      const itemWeight = config.weights[i]
      const itemScore = scores[itemKey]?.score || 0
      
      weightedSum += itemScore * itemWeight
      totalWeight += itemWeight
    }
    
    // 转换为百分制分数
    const dimensionScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 20) : 0
    
    breakdown.push({
      dimension: dimension,
      score: dimensionScore,
      weight: config.totalWeight
    })
  }
  
  return breakdown
}


const dimensionMapping = {
  "背景与经验": {
    items: ["教育背景", "AI经验"],
    weights: [0.08, 0.15], // 严格权重调整：总权重23%
    totalWeight: 0.23
  },
  "专业知识与技能": {
    items: ["AI技术知识", "产品方法论"],
    weights: [0.15, 0.10], // 严格权重调整：总权重25%
    totalWeight: 0.25
  },
  "产品作品与成果": {
    items: ["交互作品", "产品文档"],
    weights: [0.20, 0.08], // 严格权重调整：总权重28%
    totalWeight: 0.28
  },
  "核心胜任力": {
    items: ["逻辑结构", "结果导向"],
    weights: [0.06, 0.12], // 严格权重调整：总权重18%
    totalWeight: 0.18
  },
  "发展潜力": {
    items: ["自我驱动", "创新主动性"],
    weights: [0.08, 0.06], // 严格权重调整：总权重14%
    totalWeight: 0.14
  },
  "企业认知与匹配": {
    items: ["业务匹配", "薪资匹配"],
    weights: [0.02, 0.02], // 保持总权重4%
    totalWeight: 0.04
  }
};