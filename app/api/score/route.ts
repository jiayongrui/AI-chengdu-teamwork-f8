import { type NextRequest, NextResponse } from "next/server"
import { callAiApi } from '@/lib/ai-api-client'
import { ScoreCache } from '@/lib/score-cache'

export async function POST(req: NextRequest) {
  // 解析请求体
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 })
  }

  const { 
    resumeText, 
    jobPosition, 
    jobLocation,
    salaryRange,
    experienceRequired,
    educationRequired,
    jobDescription,
    companyName,
    companySize,
    industry,
    benefits,
    tags
  } = payload || {}

  try {
    if (!resumeText) {
      return NextResponse.json({ error: "缺少简历内容" }, { status: 400 })
    }

    // 生成缓存键，使用职位信息作为机会ID
    const opportunityKey = `${companyName || 'unknown'}_${jobPosition || 'unknown'}_${jobLocation || 'unknown'}`
    
    // 检查缓存
    const cachedScore = ScoreCache.get(resumeText, opportunityKey)
    if (cachedScore) {
      console.log('使用缓存评分结果:', opportunityKey)
      return NextResponse.json({
        success: true,
        data: cachedScore,
        cached: true
      })
    }

    // 构建评分系统的 Prompt
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
- 公司名称：${companyName || '未知公司'}
- 岗位名称：${jobPosition || 'AI产品经理'}
- 工作地点：${jobLocation || '不限'}
- 薪资范围：${salaryRange || '面议'}
- 经验要求：${experienceRequired || '不限'}
- 学历要求：${educationRequired || '不限'}
- 所属行业：${industry || '未知'}
- 公司规模：${companySize || '未知'}
- 公司福利：${benefits || '未提及'}
- 职位标签：${tags ? tags.join('、') : '无'}
- 职位描述：${jobDescription || '暂无详细描述'}

请严格按照以上评分标准，对简历进行逐项评分，并输出JSON格式的结果，包含：
1. 每个二级评估项的得分（0-5分）、理由
2. 加权总分（0-100分的百分制，计算方式：各项得分×权重后求和×20）
3. 推荐等级（严格标准）
4. 总体评价

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

**计算示例：**
假设各项得分为：3×8% + 2×15% + 1×15% + 2×10% + 0×20% + 1×8% + 3×6% + 2×12% + 1×8% + 2×6% + 1×2% + 0×2% = 2.4分
转换为百分制：2.4 × 20 = 48.0分

输出格式示例：
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
  "overall_comment": "候选人学历和专业与职位要求匹配，具备基础的技术背景和产品意识，但在AI实践经验和作品展示方面有待加强。薪资期望与能力水平基本匹配。"
}`

    // 使用新的API管理系统调用AI
    const apiResult = await callAiApi({
      model: 'deepseek-ai/DeepSeek-V3',
      messages: [
        {
          role: 'user',
          content: scoringPrompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3
    })

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
        raw_response: aiResponse
      }
    }

    // 缓存评分结果
    ScoreCache.set(resumeText, opportunityKey, scoreResult)
    console.log('评分结果已缓存:', opportunityKey)

    return NextResponse.json({
      success: true,
      data: scoreResult
    })

  } catch (error: any) {
    console.error("简历评分失败:", error)
    
    // 返回错误信息和默认评分
    return NextResponse.json({
      success: false,
      error: error.message || "评分服务暂时不可用",
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


// 增强分数验证和转换逻辑
function validateAndConvertScore(score: any): number {
  const numScore = parseFloat(score);
  if (isNaN(numScore)) return 0;
  
  // 0-5分制转换为百分制
  if (numScore <= 5) {
    return Math.round(numScore * 20);
  }
  
  // 百分制范围校验
  return Math.max(0, Math.min(100, Math.round(numScore)));
}

// API响应处理增强
try {
  const parsedResponse = JSON.parse(responseText);
  
  // 验证必要字段
  if (!parsedResponse.total_score) {
    throw new Error('Missing total_score in response');
  }
  
  // 转换和验证分数
  parsedResponse.total_score = validateAndConvertScore(parsedResponse.total_score);
  
} catch (error) {
  console.error('Score validation failed:', error);
  // 返回默认分数结构
}