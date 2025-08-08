import type { Opportunity } from "@/types/opportunity"
import type { User } from "@/types/user"

/**
 * 规则模板化“破冰邮件”生成（无外部模型依赖）。
 * 可在此处替换为 AI SDK：
 *   import { generateText } from "ai"
 *   import { openai } from "@ai-sdk/openai"
 *   await generateText({ model: openai("gpt-4o"), prompt: ... })
 * 以获得更智能的内容生成 [^4]
 */
export function generateIcebreakerEmail(params: {
  user: User
  resumeText?: string | null
  opp: Opportunity
}) {
  const { user, resumeText, opp } = params
  // 从简历中提取一些可能的关键词（极简启发式）
  const topSkills = extractTopSkills(resumeText ?? "")
  const skillLine = topSkills.length ? `我擅长：${topSkills.slice(0, 3).join("、")}。` : ""
  const subject = `祝贺${opp.company}${opp.tags?.[0] ?? ""} - 一位对${opp.title.replace(/工程师|开发/g, "")}充满热情的候选人`
  const body = [
    "您好！",
    "",
    `我关注到贵公司「${opp.company}」近期${opp.reason ?? "发展迅速"}，并对贵司的岗位「${opp.title}」非常感兴趣，特此致信。`,
    "",
    skillLine || "我具备扎实的工程基础与自驱力，乐于在快速变化的环境中交付高质量结果。",
    resumeText ? "我的简历重点包含：\n" + summarizeResume(resumeText) : "我的简历已随信附上，欢迎查阅。",
    "",
    "若有机会参与到贵司的下一阶段产品迭代，我将非常珍惜，也乐于先行完成小任务/技术作业以便您评估。",
    "",
    `此致\n${user.username}`,
  ].join("\n")
  return { subject, body }
}

function extractTopSkills(text: string) {
  const dict = ["NLP", "LLM", "Transformer", "Python", "PyTorch", "Hugging Face", "TypeScript", "React", "Go", "Rust", "K8s", "SQL", "数据分析", "AIGC"]
  const found = new Set<string>()
  const lower = text.toLowerCase()
  dict.forEach((k) => {
    if (lower.includes(k.toLowerCase())) found.add(k)
  })
  return Array.from(found)
}

function summarizeResume(text: string) {
  // 截取若干行作为“简历摘要”
  let t = text.replace(/\r/g, "").split("\n").filter(Boolean).slice(0, 6).join("\n")
  if (t.length > 500) t = t.slice(0, 500) + "..."
  return t
}
