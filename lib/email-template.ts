import type { Opportunity } from "@/types/opportunity"
import type { User } from "@/types/user"

/**
 * 使用AI生成个性化破冰邮件
 */
export async function generateIcebreakerEmailWithAI(params: {
  user: User
  resumeText?: string | null
  opp: Opportunity
}): Promise<{ subject: string; body: string }> {
  try {
    const response = await fetch("/api/generate-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: params.user,
        opportunity: params.opp,
        resumeText: params.resumeText,
      }),
    })

    // If API is not configured (503) or other errors, fall back to template
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log("AI service unavailable, using template generation:", errorData.error || response.statusText)
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    return {
      subject: data.subject,
      body: data.body,
    }
  } catch (error: any) {
    console.log("Fallback to template generation, reason:", error.message)
    // 降级到模板生成 - 这里不再抛出错误
    return generateIcebreakerEmailTemplate(params)
  }
}

/**
 * 模板化邮件生成（作为AI生成的降级方案）
 */
export function generateIcebreakerEmailTemplate(params: {
  user: User
  resumeText?: string | null
  opp: Opportunity
}) {
  const { user, resumeText, opp } = params

  // 从简历中提取一些可能的关键词（极简启发式）
  const topSkills = extractTopSkills(resumeText ?? "")
  const personalizedIntro = generatePersonalizedIntro(user, opp, resumeText)
  const companyInsight = generateCompanyInsight(opp)

  const subject = generatePersonalizedSubject(user, opp, topSkills)

  const body = [
    "您好！",
    "",
    personalizedIntro,
    "",
    generateSkillsSection(topSkills, opp),
    generateExperienceSection(resumeText, opp),
    "",
    companyInsight,
    "",
    generateActionCall(opp),
    "",
    `此致\n${user.username}`,
  ]
    .filter(Boolean)
    .join("\n")

  return { subject, body }
}

// 生成个性化主题
function generatePersonalizedSubject(user: User, opp: Opportunity, skills: string[]) {
  const templates = [
    `${opp.company} ${opp.title}职位申请 - 具备${skills[0] || "相关"}经验的${user.username}`,
    `关于${opp.title}职位 - ${user.username}的求职申请`,
    `${user.username}申请${opp.company}${opp.title}职位`,
    `${opp.title}候选人推荐 - ${user.username}`,
  ]

  return templates[Math.floor(Math.random() * templates.length)]
}

// 生成个性化开场
function generatePersonalizedIntro(user: User, opp: Opportunity, resumeText?: string | null) {
  const hasResume = resumeText && resumeText.trim().length > 50

  const intros = [
    `我是${user.username}，一直关注${opp.company}在${opp.tags?.[0] || "技术"}领域的创新发展。看到贵公司的${opp.title}职位，我认为这是一个绝佳的机会。`,
    `作为一名${hasResume ? "有经验的" : "充满热情的"}求职者，我对${opp.company}的${opp.reason || "发展理念"}深表认同，希望能加入${opp.title}团队。`,
    `我是${user.username}，在了解到${opp.company}${opp.reason || "正在快速发展"}后，对贵公司的${opp.title}职位产生了浓厚兴趣。`,
  ]

  return intros[Math.floor(Math.random() * intros.length)]
}

// 生成技能匹配段落
function generateSkillsSection(skills: string[], opp: Opportunity) {
  if (skills.length === 0) {
    return "我具备扎实的专业基础和快速学习能力，能够快速适应团队需求。"
  }

  const matchedSkills = skills.filter((skill) =>
    opp.tags?.some((tag) => tag.toLowerCase().includes(skill.toLowerCase())),
  )

  if (matchedSkills.length > 0) {
    return `我在${matchedSkills.slice(0, 3).join("、")}等技术领域有实际经验，与贵公司的技术栈高度匹配。`
  }

  return `我掌握${skills.slice(0, 3).join("、")}等技能，相信能为团队带来价值。`
}

// 生成经验展示段落
function generateExperienceSection(resumeText?: string | null, opp?: Opportunity) {
  if (!resumeText || resumeText.trim().length < 50) {
    return "虽然我是应届生，但我有强烈的学习意愿和实践能力，愿意从基础工作做起，快速成长。"
  }

  // 提取项目经验
  const projectKeywords = ["项目", "开发", "设计", "实现", "负责"]
  const sentences = resumeText.split(/[。！？\n]/).filter((s) => s.trim().length > 10)
  const projectExperience = sentences.find((sentence) => projectKeywords.some((keyword) => sentence.includes(keyword)))

  if (projectExperience) {
    return `我的项目经验包括：${projectExperience.slice(0, 100)}${projectExperience.length > 100 ? "..." : ""}，这些经历让我具备了解决实际问题的能力。`
  }

  return `我的简历详细展示了相关经验和技能，相信能够胜任${opp?.title || "目标"}职位的要求。`
}

// 生成公司洞察
function generateCompanyInsight(opp: Opportunity) {
  if (opp.reason) {
    return `我特别认同${opp.company}${opp.reason}，这与我的职业发展方向高度一致。`
  }

  const insights = [
    `${opp.company}在行业中的领先地位和创新能力令我印象深刻。`,
    `我一直关注${opp.company}的发展，希望能够参与到公司的成长过程中。`,
    `${opp.company}的企业文化和发展理念与我的价值观非常契合。`,
  ]

  return insights[Math.floor(Math.random() * insights.length)]
}

// 生成行动呼吁
function generateActionCall(opp: Opportunity) {
  const calls = [
    "我非常希望能有机会进一步交流，展示我的能力和对这个职位的热情。",
    "如果可能，我很乐意先完成一个小的技术任务或项目来证明我的能力。",
    "期待能够与团队面谈，详细了解职位要求并展示我的相关经验。",
    "我已准备好迎接挑战，希望能够为团队的成功贡献自己的力量。",
  ]

  return calls[Math.floor(Math.random() * calls.length)]
}

function extractTopSkills(text: string) {
  const dict = [
    "React",
    "Vue",
    "Angular",
    "JavaScript",
    "TypeScript",
    "Node.js",
    "Python",
    "Java",
    "Go",
    "Rust",
    "C++",
    "C#",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "机器学习",
    "深度学习",
    "NLP",
    "CV",
    "推荐系统",
    "产品设计",
    "用户体验",
    "数据分析",
    "项目管理",
    "前端开发",
    "后端开发",
    "全栈开发",
    "移动开发",
    "DevOps",
    "测试",
    "运维",
    "安全",
  ]

  const found = new Set<string>()
  const lower = text.toLowerCase()

  dict.forEach((skill) => {
    if (lower.includes(skill.toLowerCase())) {
      found.add(skill)
    }
  })

  return Array.from(found).slice(0, 5) // 最多返回5个技能
}

function summarizeResume(text: string) {
  // 截取若干行作为"简历摘要"
  let t = text.replace(/\r/g, "").split("\n").filter(Boolean).slice(0, 6).join("\n")
  if (t.length > 500) t = t.slice(0, 500) + "..."
  return t
}

// 保持向后兼容
export function generateIcebreakerEmail(params: {
  user: User
  resumeText?: string | null
  opp: Opportunity
}) {
  return generateIcebreakerEmailTemplate(params)
}
