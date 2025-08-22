import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  // 解析请求体
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 })
  }

  const { resumeText, jobPosition, jobLocation } = payload || {}

  try {
    if (!resumeText) {
      return NextResponse.json({ error: "缺少简历内容" }, { status: 400 })
    }

    // 构建评分系统的 Prompt
    const scoringPrompt = `# AI 产品经理岗位简历量化打分指南

你是一名**严格遵守评分维度表**的 AI 招聘官，仅依据候选人提供的简历文本进行打分，禁止脑补。

执行步骤：
1. **逐条读取**下方 12 项二级评估项（含权重）。
2. **在简历原文中定位**能佐证该项的事实；若无可佐证内容则给 0 分。
3. **按 0–5 整数评分**，并写一句 ≤30 字的理由（必须引用简历原文）。
4. **计算加权总分** = Σ(得分 × 权重) × 20（转换为百分制）。
   **注意：最终total_score必须是百分制分数，即0-100之间的数值！**
5. **输出推荐等级**：
   - 90–100：强烈推荐
   - 75–89：推荐
   - 60–74：谨慎推荐
   - <60：不推荐

## 📊 评分维度表

| 一级维度 | 二级评估项 | 权重 | 评分标准 (0-5 分) |
|---|---|---|---|
| **1. 背景与经验** | 1.1 学历与专业 | 7% | 5 顶尖院校+CS/AI 或复合学位<br>4 知名院校+CS/AI 或顶尖+设计/商科<br>3 普通院校+CS/AI 或知名+设计/商科<br>2 普通院校+设计/商科 或知名+其他<br>1 普通院校+其他 |
|  | 1.2 AI 相关实习/项目 | 12% | 5 知名公司 AI PM 实习或主导已上线 AI 项目<br>3 AI 相关实习/完整课程项目<br>1-2 其他 PM 实习或低贡献参与<br>0 无 |
| **2. 专业知识与技能** | 2.1 AI 技术认知 | 12% | 5 项目体现 RAG/Agent/Fine-tuning 深度应用<br>3-4 提及关键词并简单应用<br>1 仅罗列关键词<br>0 无 |
|  | 2.2 产品方法论 | 8% | 5 完整 PM 闭环（调研→需求→设计→分析）<br>3 部分技能体现<br>1-2 仅提及未结合项目<br>0 无 |
| **3. 产品作品与成果** | 3.1 可交互作品 | 18% | 5 可访问 AI 应用/Bot Demo 完成度高<br>3 可交互原型链接<br>1-2 截图/视频<br>0 无 |
|  | 3.2 产品文档与分析 | 8% | 5 高质量 PRD/MRD/竞品分析/博客链接<br>3 课程级文档<br>1-2 仅文字描述<br>0 无 |
| **4. 核心胜任力** | 4.1 逻辑与结构 | 5% | 5 简历结构极清晰，项目用 STAR/XYZ 量化<br>3 结构清晰<br>1 结构乱 |
|  | 4.2 结果导向 | 10% | 5 多处量化结果（用户增长 %/效率提升 %）<br>3-4 至少一处量化或业务影响<br>1-2 定性描述<br>0 无 |
| **5. 发展潜力** | 5.1 自驱与热情 | 11% | 5 活跃技术博客/GitHub/产品社区，内容高质相关<br>3-4 有个人项目或开源，但活跃度一般<br>1-2 仅提及兴趣无作品<br>0 无 |
|  | 5.2 创新与主动性 | 5% | 5 创始人/负责人或顶级竞赛最高奖<br>3-4 实习/项目中主动发现并推动解决<br>1-2 普通竞赛/学生干部<br>0 无 |
| **6. 企业认知与匹配** | 6.1 业务领域匹配 | 2% | 3-5 项目经验与公司领域高度相关<br>1-2 仅兴趣/课程项目<br>0 无 |
|  | 6.2 企业认知与动机 | 2% | 3-5 简历巧妙体现对公司了解与热情<br>1-2 通用陈述<br>0 无 |

## 候选人简历内容：
${resumeText}

## 目标岗位信息：
- 岗位：${jobPosition || 'AI产品经理'}
- 地点：${jobLocation || '不限'}

请严格按照以上评分标准，对简历进行逐项评分，并输出JSON格式的结果，包含：
1. 每个二级评估项的得分（0-5分）、理由
2. 加权总分（0-100分的百分制，计算方式：各项得分×权重后求和×20）
3. 推荐等级
4. 总体评价

**重要：total_score必须是0-100的百分制分数，不能是0-5分！**

**计算示例：**
假设各项得分为：3×7% + 2×12% + 1×12% + 2×8% + 0×18% + 1×8% + 3×5% + 2×10% + 1×11% + 2×5% + 1×2% + 0×2% = 2.6分
转换为百分制：2.6 × 20 = 52.0分

输出格式示例：
{
  "scores": {
    "education_background": { "score": 3, "reason": "普通院校计算机专业" },
    "ai_experience": { "score": 2, "reason": "有AI相关课程项目经验" },
    "ai_technical_knowledge": { "score": 1, "reason": "仅提及机器学习关键词" },
    "product_methodology": { "score": 2, "reason": "简历中体现部分产品技能" },
    "interactive_works": { "score": 0, "reason": "未提供可交互作品" },
    "product_documents": { "score": 1, "reason": "仅有文字描述的项目" },
    "logic_structure": { "score": 3, "reason": "简历结构清晰" },
    "result_oriented": { "score": 2, "reason": "有定性描述但缺乏量化" },
    "self_motivation": { "score": 1, "reason": "提及兴趣但无作品" },
    "innovation_initiative": { "score": 2, "reason": "有学生干部经历" },
    "business_matching": { "score": 1, "reason": "仅有课程项目经验" },
    "company_awareness": { "score": 0, "reason": "未体现企业认知" }
  },
  "total_score": 52.0,
  "recommendation_level": "谨慎推荐",
  "overall_comment": "候选人具备基础的技术背景和产品意识，但在AI实践经验和作品展示方面有待加强。建议补充可交互的AI产品作品和量化的项目成果。"
}`

    // 清理 prompt 中的特殊字符
    const cleanPrompt = scoringPrompt.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim()
    
    // 调用 SiliconFlow API
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
          company_awareness: { score: 0, reason: "AI解析失败，请重试" }
        },
        total_score: 0,
        recommendation_level: "系统错误",
        overall_comment: "评分系统暂时不可用，请稍后重试。",
        raw_response: aiResponse
      }
    }

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
          company_awareness: { score: 0, reason: "服务异常" }
        },
        total_score: 0,
        recommendation_level: "服务异常",
        overall_comment: "评分服务暂时不可用，请稍后重试。"
      }
    }, { status: 500 })
  }
}