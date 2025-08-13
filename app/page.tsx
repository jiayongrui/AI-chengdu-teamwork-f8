"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Noto_Sans_SC } from "next/font/google"
import { Menu, FileText, Gem, DoorOpen, BarChart3, Lightbulb, Users, Info } from "lucide-react"

import { getSupabaseClient } from "@/lib/supabase-client"
import { signIn, signUp, getLocalUser, setLocalUser } from "@/lib/auth"
import type { User } from "@/types/user"
import type { Opportunity } from "@/types/opportunity"
import { todayOpportunities } from "@/lib/opportunities"
import {
  fetchUserResumeText,
  updateUserResumeText,
  fetchUserResumes,
  createResume,
  updateResume,
  deleteResume,
  getLocalResumes,
  createLocalResume,
  updateLocalResume,
  deleteLocalResume,
  extractTextFromFile,
  validateResumeFile,
  type Resume,
} from "@/lib/user-profile"
import { generateIcebreakerEmail, generateIcebreakerEmailWithAI } from "@/lib/email-template"
import { logAndAdvanceTask, sendEmail } from "@/lib/email-send"

const noto = Noto_Sans_SC({ subsets: ["latin"], weight: ["400", "500", "700"] })

type PageKey =
  | "home"
  | "bounty" // 机会雷达
  | "forge" // 破冰工坊
  | "scraper" // 网页爬虫（管理员）
  | "opportunity-manager" // 机会管理（管理员）
  | "pricing" // 定价
  | "blog"
  | "login"
  | "signup"
  | "terms"
  | "profile"

const ADMIN_OPPORTUNITIES_KEY = "admin-opportunities"

export default function Page() {
  const [currentPage, setCurrentPage] = useState<PageKey>("home")
  const [mobileOpen, setMobileOpen] = useState(false)

  // Home 内部锚点
  const featuresRef = useRef<HTMLElement | null>(null)
  const testimonialsRef = useRef<HTMLElement | null>(null)
  const aboutRef = useRef<HTMLElement | null>(null)
  const [activeHomeSection, setActiveHomeSection] = useState<null | "features" | "about">(null)

  // Auth
  const [user, setUser] = useState<User | null>(null)
  const supabase = getSupabaseClient()
  const [connOk, setConnOk] = useState<boolean | null>(null)
  const [connErr, setConnErr] = useState<string | null>(null)

  // Auth states
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [signupErr, setSignupErr] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  // 破冰工坊上下文
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [resumeText, setResumeText] = useState<string | null>(null)
  const [mailSubject, setMailSubject] = useState("")
  const [mailBody, setMailBody] = useState("")
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState<string | null>(null)
  // 新增AI生成状态
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiGenerateError, setAiGenerateError] = useState<string | null>(null)

  // 网页爬虫状态（管理员功能）
  const [isAdmin, setIsAdmin] = useState(false)
  const [crawlUrl, setCrawlUrl] = useState("")
  const [crawlResult, setCrawlResult] = useState<string | null>(null)
  const [crawling, setCrawling] = useState(false)
  const [crawlError, setCrawlError] = useState<string | null>(null)

  // 机会管理状态
  const [adminOpportunities, setAdminOpportunities] = useState<Opportunity[]>([])
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [oppForm, setOppForm] = useState({
    company: "",
    title: "",
    city: "",
    tags: "",
    reason: "",
  })

  // 简历管理状态
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [showResumeForm, setShowResumeForm] = useState(false)
  const [editingResume, setEditingResume] = useState<Resume | null>(null)
  const [resumeForm, setResumeForm] = useState({
    title: "",
    content: "",
  })
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState<string | null>(null)

  // 文件上传状态
  const [fileUploading, setFileUploading] = useState(false)
  const [fileUploadError, setFileUploadError] = useState<string | null>(null)
  const [fileUploadSuccess, setFileUploadSuccess] = useState<string | null>(null)

  // 合并的机会列表（默认 + 管理员添加的）
  const allOpportunities = useMemo(() => {
    return [...todayOpportunities, ...adminOpportunities]
  }, [adminOpportunities])

  const validPages: Record<string, PageKey> = useMemo(
    () => ({
      home: "home",
      bounty: "bounty",
      forge: "forge",
      scraper: "scraper",
      "opportunity-manager": "opportunity-manager",
      pricing: "pricing",
      blog: "blog",
      login: "login",
      signup: "signup",
      terms: "terms",
      profile: "profile",
      features: "home",
      testimonials: "home",
      about: "home",
    }),
    [],
  )

  const smoothScrollInsideHome = useCallback((id?: string | null) => {
    if (!id) return
    if (id === "features" && featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    if (id === "testimonials" && testimonialsRef.current) {
      testimonialsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    if (id === "about" && aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  const showPage = useCallback(
    (hashOrKey: string, scrollToId?: string | null) => {
      const cleaned = hashOrKey.startsWith("#") ? hashOrKey.slice(1) : hashOrKey
      const target = validPages[cleaned] ?? "home"
      setCurrentPage(target)
      if (typeof window !== "undefined") {
        window.location.hash = cleaned
      }
      if (cleaned !== "home") {
        setActiveHomeSection(null)
      }
      if (scrollToId) {
        setTimeout(() => smoothScrollInsideHome(scrollToId), 100)
      } else {
        window.scrollTo({ top: 0 })
      }
    },
    [smoothScrollInsideHome, validPages],
  )

  // 初始化
  useEffect(() => {
    const initial = window.location.hash || "#home"
    showPage(initial)
    const u = getLocalUser()
    if (u) setUser(u)

    // 加载管理员添加的机会
    loadAdminOpportunities()
  }, [showPage])

  // hash 路由
  useEffect(() => {
    const handler = () => {
      const h = window.location.hash || "#home"
      showPage(h)
    }
    window.addEventListener("hashchange", handler)
    return () => window.removeEventListener("hashchange", handler)
  }, [showPage])

  // 进入视口动画
  useEffect(() => {
    const elements = document.querySelectorAll("section, .grid > div, table")
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in-element")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [currentPage])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    e.preventDefault()
    const scrollToId = e.currentTarget.getAttribute("data-scroll-to")
    if (href === "#home") {
      setActiveHomeSection((scrollToId as any) || "features")
    } else {
      setActiveHomeSection(null)
    }
    showPage(href, scrollToId)
    if (mobileOpen) setMobileOpen(false)
  }

  // 连接检测
  const checkConnection = useCallback(async () => {
    if (!supabase) throw new Error("缺少环境变量 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
    const { error } = await supabase.from("users").select("id", { count: "exact", head: true })
    if (error) throw error
  }, [supabase])

  // 切到 profile/forge 时加载简历
  useEffect(() => {
    ;(async () => {
      if (!user) return
      if (currentPage === "profile" || currentPage === "forge") {
        try {
          await checkConnection()
          setConnOk(true)
          setConnErr(null)

          // 加载用户的所有简历
          const userResumes = await fetchUserResumes(user.id)
          setResumes(userResumes)

          // 兼容旧的简历文本字段
          const txt = await fetchUserResumeText(user.id)
          setResumeText(txt)
        } catch (e: any) {
          setConnOk(false)
          setConnErr(e?.message ?? "连接 Supabase 失败")

          // 降级到本地存储
          const localResumes = getLocalResumes(user.id)
          setResumes(localResumes)
        }
      }
    })()
  }, [currentPage, user, checkConnection])

  // 登录
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthLoading(true)
    setLoginErr(null)
    const form = new FormData(e.currentTarget)
    const username = String(form.get("login-username") ?? "").trim()
    const password = String(form.get("login-password") ?? "")

    // 检查特殊管理员账户
    if (username === "offergungun" && password === "careericebreaker") {
      const adminUser: User = {
        id: "admin-special",
        username: "管理员",
        created_at: new Date().toISOString(),
      }
      setUser(adminUser)
      setLocalUser(adminUser)
      setIsAdmin(true)
      setAuthLoading(false)
      showPage("#scraper")
      return
    }

    try {
      const u = await signIn(username, password)
      setUser(u)
      setLocalUser(u)
      setIsAdmin(false)
      showPage("#bounty")
    } catch (err: any) {
      setLoginErr(err?.message ?? "登录失败")
    } finally {
      setAuthLoading(false)
    }
  }

  // 注册
  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthLoading(true)
    setSignupErr(null)
    const form = new FormData(e.currentTarget)
    const username = String(form.get("signup-name") ?? "").trim()
    const password = String(form.get("signup-password") ?? "")
    if (!username || !password) {
      setSignupErr("请输入昵称（用户名）与密码")
      setAuthLoading(false)
      return
    }
    try {
      const u = await signUp(username, password)
      setUser(u)
      setLocalUser(u)
      showPage("#profile")
    } catch (err: any) {
      setSignupErr(err?.message ?? "注册失败")
    } finally {
      setAuthLoading(false)
    }
  }

  // 机会卡片 -> 破冰工坊
  const onGoForge = async (opp: Opportunity) => {
    if (!user) {
      showPage("#login")
      return
    }
    setSelectedOpp(opp)

    // 先设置空的邮件内容，然后异步生成
    setMailSubject("")
    setMailBody("")
    setAiGenerateError(null)

    showPage("#forge")

    // 异步生成AI邮件
    setAiGenerating(true)
    try {
      const draft = await generateIcebreakerEmailWithAI({ user, resumeText, opp })
      setMailSubject(draft.subject)
      setMailBody(draft.body)
      // 清除错误信息，因为生成成功了
      setAiGenerateError(null)
    } catch (error: any) {
      // 这个catch应该不会被触发，因为我们在generateIcebreakerEmailWithAI中已经处理了降级
      console.error("意外错误:", error)
      setAiGenerateError("生成过程中出现问题，已使用模板生成")
      // 作为最后的保险，再次尝试模板生成
      const fallbackDraft = generateIcebreakerEmail({ user, resumeText, opp })
      setMailSubject(fallbackDraft.subject)
      setMailBody(fallbackDraft.body)
    } finally {
      setAiGenerating(false)
    }
  }

  // 重新生成邮件
  const onRegenerateEmail = async () => {
    if (!user || !selectedOpp) return

    setAiGenerating(true)
    setAiGenerateError(null)

    try {
      const draft = await generateIcebreakerEmailWithAI({ user, resumeText, opp: selectedOpp })
      setMailSubject(draft.subject)
      setMailBody(draft.body)
      setAiGenerateError(null)
    } catch (error: any) {
      // 同样，这个catch也不应该被触发
      console.error("重新生成时出现意外错误:", error)
      setAiGenerateError("重新生成失败，已使用模板生成")
      const fallbackDraft = generateIcebreakerEmail({ user, resumeText, opp: selectedOpp })
      setMailSubject(fallbackDraft.subject)
      setMailBody(fallbackDraft.body)
    } finally {
      setAiGenerating(false)
    }
  }

  // 添加邮件发送相关的状态
  const [recipientEmail, setRecipientEmail] = useState("")
  const [senderEmail, setSenderEmail] = useState("")

  // 破冰工坊：确认发送
  const onConfirmSend = async () => {
    if (!user || !selectedOpp) return

    // 验证收件人邮箱
    if (!recipientEmail.trim()) {
      setSendMsg("❌ 请输入收件人邮箱地址")
      return
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail.trim())) {
      setSendMsg("❌ 请输入有效的邮箱地址")
      return
    }

    // 验证邮件内容
    if (!mailSubject.trim()) {
      setSendMsg("❌ 请输入邮件主题")
      return
    }

    if (!mailBody.trim()) {
      setSendMsg("❌ 请输入邮件内容")
      return
    }

    setSending(true)
    setSendMsg("📤 正在发送邮件...")

    try {
      console.log("开始发送邮件流程...")

      // 1) 发送真实邮件
      const emailResult = await sendEmail({
        to: recipientEmail.trim(),
        subject: mailSubject.trim(),
        body: mailBody.trim(),
        senderName: user.username,
        senderEmail: senderEmail.trim() || undefined,
      })

      console.log("邮件发送结果:", emailResult)

      if (!emailResult.success) {
        throw new Error(emailResult.error || "邮件发送失败")
      }

      // 根据是否为演示模式显示不同消息
      if (emailResult.demo) {
        setSendMsg("🎭 演示模式：邮件发送成功！正在记录到系统...")
      } else {
        setSendMsg("📧 邮件发送成功，正在记录到系统...")
      }

      // 2) 记录到系统并推进任务状态
      await logAndAdvanceTask({
        userId: user.id,
        opp: selectedOpp,
        subject: mailSubject.trim(),
        body: mailBody.trim(),
        recipientEmail: recipientEmail.trim(),
        messageId: emailResult.messageId,
        demo: emailResult.demo,
      })

      if (emailResult.demo) {
        setSendMsg(
          `🎭 演示发送成功至 ${recipientEmail}！\n💡 这是演示模式，实际未发送真实邮件。要发送真实邮件，请配置 RESEND_API_KEY 环境变量。`,
        )
      } else {
        setSendMsg(`✅ 邮件已成功发送至 ${recipientEmail}！系统已自动记录。`)
      }

      // 5秒后跳转到机会雷达
      setTimeout(() => {
        setSendMsg("🎯 即将跳转到机会雷达...")
        setTimeout(() => showPage("#bounty"), 1000)
      }, 4000)
    } catch (e: any) {
      console.error("发送流程失败:", e)
      setSendMsg(`❌ 发送失败：${e?.message ?? "未知错误"}`)
    } finally {
      setSending(false)
    }
  }

  // 简历管理函数
  const handleCreateResume = async () => {
    if (!user || !resumeForm.title.trim() || !resumeForm.content.trim()) {
      setResumeError("请填写简历标题和内容")
      return
    }

    setResumeLoading(true)
    setResumeError(null)

    try {
      let newResume: Resume
      if (connOk) {
        newResume = await createResume(user.id, resumeForm.title, resumeForm.content)
      } else {
        newResume = createLocalResume(user.id, resumeForm.title, resumeForm.content)
      }

      setResumes((prev) => [newResume, ...prev])
      setResumeForm({ title: "", content: "" })
      setShowResumeForm(false)
    } catch (error: any) {
      setResumeError(error.message || "创建简历失败")
    } finally {
      setResumeLoading(false)
    }
  }

  const handleUpdateResume = async () => {
    if (!user || !editingResume || !resumeForm.title.trim() || !resumeForm.content.trim()) {
      setResumeError("请填写简历标题和内容")
      return
    }

    setResumeLoading(true)
    setResumeError(null)

    try {
      let updatedResume: Resume
      if (connOk) {
        updatedResume = await updateResume(editingResume.id, resumeForm.title, resumeForm.content)
      } else {
        updatedResume = updateLocalResume(user.id, editingResume.id, resumeForm.title, resumeForm.content)!
      }

      setResumes((prev) => prev.map((r) => (r.id === editingResume.id ? updatedResume : r)))
      setResumeForm({ title: "", content: "" })
      setEditingResume(null)
    } catch (error: any) {
      setResumeError(error.message || "更新简历失败")
    } finally {
      setResumeLoading(false)
    }
  }

  const handleDeleteResume = async (resumeId: string) => {
    if (!user || !confirm("确定要删除这份简历吗？")) return

    setResumeLoading(true)
    setResumeError(null)

    try {
      if (connOk) {
        await deleteResume(resumeId)
      } else {
        deleteLocalResume(user.id, resumeId)
      }

      setResumes((prev) => prev.filter((r) => r.id !== resumeId))
      if (selectedResumeId === resumeId) {
        setSelectedResumeId(null)
      }
    } catch (error: any) {
      setResumeError(error.message || "删除简历失败")
    } finally {
      setResumeLoading(false)
    }
  }

  const handleEditResume = (resume: Resume) => {
    setEditingResume(resume)
    setResumeForm({
      title: resume.title,
      content: resume.content,
    })
    setShowResumeForm(true)
  }

  const handleSelectResume = (resumeId: string) => {
    setSelectedResumeId(resumeId)
    const resume = resumes.find((r) => r.id === resumeId)
    if (resume) {
      setResumeText(resume.content)
    }
  }

  const cancelResumeForm = () => {
    setShowResumeForm(false)
    setEditingResume(null)
    setResumeForm({ title: "", content: "" })
    setResumeError(null)
  }

  // 改进的简历文件上传处理
  const onResumeFileChosen = async (file: File) => {
    if (!user) return

    // 清除之前的状态
    setFileUploadError(null)
    setFileUploadSuccess(null)
    setFileUploading(true)

    try {
      // 验证文件
      const validation = validateResumeFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // 提取文本内容
      const text = await extractTextFromFile(file)

      if (!text || text.length < 10) {
        throw new Error("文件内容过短，请确保简历包含足够的信息")
      }

      // 生成简历标题
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      const title = `${fileNameWithoutExt} - ${new Date().toLocaleDateString("zh-CN")}`

      // 创建新的简历记录
      let newResume: Resume
      if (connOk) {
        newResume = await createResume(user.id, title, text)
      } else {
        newResume = createLocalResume(user.id, title, text)
      }

      // 更新状态
      setResumes((prev) => [newResume, ...prev])
      setSelectedResumeId(newResume.id)
      setResumeText(text)

      // 兼容旧版本
      try {
        await updateUserResumeText(user.id, text)
      } catch (error) {
        console.warn("更新旧版本简历字段失败:", error)
      }

      setFileUploadSuccess(`简历 "${title}" 已成功添加并设为当前使用`)

      // 3秒后清除成功消息
      setTimeout(() => setFileUploadSuccess(null), 3000)
    } catch (error: any) {
      console.error("简历上传失败:", error)
      setFileUploadError(error.message || "简历上传失败，请重试")
    } finally {
      setFileUploading(false)
    }
  }

  // 网页爬取功能
  const handleCrawl = async () => {
    if (!crawlUrl.trim()) {
      setCrawlError("请输入有效的URL")
      return
    }

    setCrawling(true)
    setCrawlError(null)
    setCrawlResult(null)

    try {
      // 这里使用一个简单的代理服务来获取网页内容
      // 在实际应用中，你可能需要使用专门的爬虫服务
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(crawlUrl)}`
      const response = await fetch(proxyUrl)
      const data = await response.json()

      if (data.contents) {
        // 简单提取文本内容
        const parser = new DOMParser()
        const doc = parser.parseFromString(data.contents, "text/html")
        const textContent = doc.body?.textContent || doc.textContent || ""
        setCrawlResult(textContent.slice(0, 5000)) // 限制显示长度
      } else {
        setCrawlError("无法获取网页内容")
      }
    } catch (error: any) {
      setCrawlError(`爬取失败: ${error.message}`)
    } finally {
      setCrawling(false)
    }
  }

  // 机会管理功能
  const loadAdminOpportunities = () => {
    try {
      const stored = localStorage.getItem(ADMIN_OPPORTUNITIES_KEY)
      if (stored) {
        setAdminOpportunities(JSON.parse(stored))
      }
    } catch (error) {
      console.error("加载管理员机会失败:", error)
    }
  }

  const saveAdminOpportunities = (opportunities: Opportunity[]) => {
    try {
      localStorage.setItem(ADMIN_OPPORTUNITIES_KEY, JSON.stringify(opportunities))
      setAdminOpportunities(opportunities)
    } catch (error) {
      console.error("保存管理员机会失败:", error)
    }
  }

  const handleAddOpportunity = () => {
    if (!oppForm.company.trim() || !oppForm.title.trim()) {
      alert("请填写公司名称和职位标题")
      return
    }

    const newOpp: Opportunity = {
      id: `admin-opp-${Date.now()}`,
      company: oppForm.company.trim(),
      title: oppForm.title.trim(),
      city: oppForm.city.trim() || undefined,
      tags: oppForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      reason: oppForm.reason.trim() || undefined,
    }

    const updated = [...adminOpportunities, newOpp]
    saveAdminOpportunities(updated)

    // 重置表单
    setOppForm({ company: "", title: "", city: "", tags: "", reason: "" })
    setShowAddForm(false)
  }

  const handleEditOpportunity = (opp: Opportunity) => {
    setEditingOpp(opp)
    setOppForm({
      company: opp.company,
      title: opp.title,
      city: opp.city || "",
      tags: opp.tags.join(", "),
      reason: opp.reason || "",
    })
  }

  const handleUpdateOpportunity = () => {
    if (!editingOpp || !oppForm.company.trim() || !oppForm.title.trim()) {
      alert("请填写公司名称和职位标题")
      return
    }

    const updatedOpp: Opportunity = {
      ...editingOpp,
      company: oppForm.company.trim(),
      title: oppForm.title.trim(),
      city: oppForm.city.trim() || undefined,
      tags: oppForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      reason: oppForm.reason.trim() || undefined,
    }

    const updated = adminOpportunities.map((opp) => (opp.id === editingOpp.id ? updatedOpp : opp))
    saveAdminOpportunities(updated)

    // 重置编辑状态
    setEditingOpp(null)
    setOppForm({ company: "", title: "", city: "", tags: "", reason: "" })
  }

  const handleDeleteOpportunity = (oppId: string) => {
    if (confirm("确定要删除这个机会吗？")) {
      const updated = adminOpportunities.filter((opp) => opp.id !== oppId)
      saveAdminOpportunities(updated)
    }
  }

  const navItemClass = (active: boolean) =>
    `transition-colors nav-link ${active ? "text-green-600 font-semibold" : "text-gray-600 hover:text-green-500"}`

  const avatarInitial = (user?.username?.[0] || "U").toUpperCase()
  const handleLogout = () => {
    try {
      setLocalUser(null)
    } catch {}
    setUser(null)
    setIsAdmin(false)
    showPage("#home")
  }

  const onSubmitAlert = (msg: string) => (e: React.FormEvent) => {
    e.preventDefault()
    alert(msg)
  }

  return (
    <div className={`${noto.className} bg-[#f8f9fa] text-gray-800 antialiased`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="text-2xl font-bold text-gray-800">
            <a href="#home" className="nav-link" onClick={(e) => handleNavClick(e, "#home")}>
              简历冲鸭 🎯
            </a>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {isAdmin ? (
                  <>
                    <a
                      href="#scraper"
                      className={navItemClass(currentPage === "scraper")}
                      onClick={(e) => handleNavClick(e, "#scraper")}
                    >
                      网页爬虫
                    </a>
                    <a
                      href="#opportunity-manager"
                      className={navItemClass(currentPage === "opportunity-manager")}
                      onClick={(e) => handleNavClick(e, "#opportunity-manager")}
                    >
                      机会管理
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="#bounty"
                      className={navItemClass(currentPage === "bounty")}
                      onClick={(e) => handleNavClick(e, "#bounty")}
                    >
                      机会雷达
                    </a>
                    <a
                      href="#forge"
                      className={navItemClass(currentPage === "forge")}
                      onClick={(e) => handleNavClick(e, "#forge")}
                    >
                      破冰工坊
                    </a>
                  </>
                )}
              </>
            ) : (
              <>
                <a
                  href="#home"
                  data-scroll-to="features"
                  className={navItemClass(currentPage === "home" && activeHomeSection !== "about")}
                  onClick={(e) => handleNavClick(e, "#home")}
                >
                  产品功能
                </a>
                <a
                  href="#pricing"
                  className={navItemClass(currentPage === "pricing")}
                  onClick={(e) => handleNavClick(e, "#pricing")}
                >
                  定价
                </a>
                <a
                  href="#blog"
                  className={navItemClass(currentPage === "blog")}
                  onClick={(e) => handleNavClick(e, "#blog")}
                >
                  求职干货
                </a>
                <a
                  href="#home"
                  data-scroll-to="about"
                  className={navItemClass(currentPage === "home" && activeHomeSection === "about")}
                  onClick={(e) => handleNavClick(e, "#home")}
                >
                  关于我们
                </a>
              </>
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <a
                  href="#profile"
                  className="nav-link flex items-center"
                  onClick={(e) => handleNavClick(e, "#profile")}
                  aria-label="个人主页"
                  title="个人主页"
                >
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-green-500 text-white font-bold">
                    {avatarInitial}
                  </span>
                </a>
                <button onClick={handleLogout} className="text-gray-600 hover:text-green-500">
                  退出
                </button>
              </>
            ) : (
              <>
                <a
                  href="#login"
                  className="text-gray-600 hover:text-green-500 nav-link"
                  onClick={(e) => handleNavClick(e, "#login")}
                >
                  登录
                </a>
                <a
                  href="#signup"
                  className="bg-green-500 text-white font-bold py-2 px-5 rounded-full cta-button nav-link"
                  onClick={(e) => handleNavClick(e, "#signup")}
                >
                  免费注册
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              id="mobile-menu-button"
              className="text-gray-800 focus:outline-none"
              aria-label="打开菜单"
              onClick={() => setMobileOpen((s) => !s)}
            >
              <Menu size={32} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div id="mobile-menu" className={`${mobileOpen ? "block" : "hidden"} md:hidden px-6 pb-4`}>
          {!user ? (
            <>
              {/* 未登录：营销导航 */}
              <a
                href="#home"
                data-scroll-to="features"
                className={navItemClass(currentPage === "home" && activeHomeSection !== "about")}
                onClick={(e) => handleNavClick(e, "#home")}
              >
                产品功能
              </a>
              <a
                href="#pricing"
                className={navItemClass(currentPage === "pricing")}
                onClick={(e) => handleNavClick(e, "#pricing")}
              >
                定价
              </a>
              <a
                href="#blog"
                className={navItemClass(currentPage === "blog")}
                onClick={(e) => handleNavClick(e, "#blog")}
              >
                求职干货
              </a>
              <a
                href="#home"
                data-scroll-to="about"
                className={navItemClass(currentPage === "home" && activeHomeSection === "about")}
                onClick={(e) => handleNavClick(e, "#home")}
              >
                关于我们
              </a>
            </>
          ) : (
            <>
              {/* 已登录：功能菜单 */}
              {isAdmin ? (
                <>
                  <a
                    href="#scraper"
                    className={navItemClass(currentPage === "scraper")}
                    onClick={(e) => handleNavClick(e, "#scraper")}
                  >
                    网页爬虫
                  </a>
                  <a
                    href="#opportunity-manager"
                    className={navItemClass(currentPage === "opportunity-manager")}
                    onClick={(e) => handleNavClick(e, "#opportunity-manager")}
                  >
                    机会管理
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="#bounty"
                    className={navItemClass(currentPage === "bounty")}
                    onClick={(e) => handleNavClick(e, "#bounty")}
                  >
                    机会雷达
                  </a>
                  <a
                    href="#forge"
                    className={navItemClass(currentPage === "forge")}
                    onClick={(e) => handleNavClick(e, "#forge")}
                  >
                    破冰工坊
                  </a>
                </>
              )}
            </>
          )}

          <div className="mt-4 border-t pt-4 space-y-2">
            {user ? (
              <>
                <a
                  href="#profile"
                  className={navItemClass(currentPage === "profile")}
                  onClick={(e) => handleNavClick(e, "#profile")}
                >
                  个人主页
                </a>
                <button onClick={handleLogout} className="block w-full text-center text-gray-600 hover:text-green-500">
                  退出
                </button>
              </>
            ) : (
              <>
                <a
                  href="#login"
                  className={navItemClass(currentPage === "login")}
                  onClick={(e) => handleNavClick(e, "#login")}
                >
                  登录
                </a>
                <a
                  href="#signup"
                  className="block text-center bg-green-500 text-white font-bold py-2 px-5 rounded-full cta-button nav-link"
                  onClick={(e) => handleNavClick(e, "#signup")}
                >
                  免费注册
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Home（登录前完整主页） */}
        {currentPage === "home" && (
          <div id="page-home" className="page-content">
            <section className="hero-gradient py-20 md:py-32">
              <div className="container mx-auto px-6 text-center">
                <div className="max-w-3xl mx-auto">
                  <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                    别再海投，我们教你<span className="text-green-500">狙击</span>。
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 mb-10">
                    专为应届生打造的主动求职情报平台，AI为你挖掘被巨头忽略的"隐藏机会"。
                  </p>
                  <form
                    className="max-w-lg mx-auto flex flex-col sm:flex-row gap-4"
                    onSubmit={onSubmitAlert("已提交申请，稍后将收到今日情报（模拟提交）")}
                  >
                    <input
                      type="email"
                      placeholder="输入你的邮箱"
                      className="w-full px-6 py-4 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none transition-shadow"
                      required
                      aria-label="邮箱"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-green-500 text-white font-bold py-4 px-8 rounded-full cta-button whitespace-nowrap"
                    >
                      免费获取今日情报
                    </button>
                  </form>
                </div>
              </div>
            </section>

            {/* 痛点三卡片 */}
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">50份简历石沉大海，问题出在哪？</h2>
                  <p className="text-gray-600">我们理解你的困惑和挫败，因为我们也曾经历过。</p>
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                  <div className="text-center p-8 border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex justify-center items-center mb-6 w-16 h-16 mx-auto bg-red-100 rounded-full">
                      <FileText size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">信息海洋，简历被淹没</h3>
                    <p className="text-gray-500">你的优秀，在数千份简历中被轻易忽略。</p>
                  </div>

                  <div className="text-center p-8 border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex justify-center items-center mb-6 w-16 h-16 mx-auto bg-yellow-100 rounded-full">
                      <Gem size={32} className="text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">机会黑箱，好公司难寻</h3>
                    <p className="text-gray-500">除了大厂，那些高速成长的"潜力股"在哪？</p>
                  </div>

                  <div className="text-center p-8 border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex justify-center items-center mb-6 w-16 h-16 mx-auto bg-blue-100 rounded-full">
                      <DoorOpen size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">主动出击，不知如何开口</h3>
                    <p className="text-gray-500">找到邮箱却写不出第一句话，害怕成为"骚扰邮件"。</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 功能两段（从"求职者"到"机会猎手"） */}
            <section id="features" ref={featuresRef} className="py-20">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">从"求职者"到"机会猎手"</h2>
                  <p className="text-gray-600">"简历冲鸭"如何将你武装到牙齿，精准捕捉每一个机会。</p>
                </div>

                <div className="space-y-16">
                  {/* item 01 */}
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="md:w-1/2 p-8 bg-white rounded-2xl shadow-lg">
                      <img
                        src="https://placehold.co/600x400/34d399/ffffff?text=机会雷达UI"
                        alt="机会雷达UI界面"
                        className="rounded-lg w-full"
                      />
                    </div>
                    <div className="md:w-1/2">
                      <span className="text-green-500 font-bold">01</span>
                      <h3 className="text-2xl font-bold mt-2 mb-4">AI驱动的情报雷达</h3>
                      <p className="text-gray-600 mb-6">
                        7x24小时扫描融资新闻、行业峰会、项目发布，为你预测"即将"出现的招聘需求。不再错过任何一个潜力机会。
                      </p>
                      <a
                        href="#bounty"
                        className="nav-link font-bold text-green-600 hover:underline"
                        onClick={(e) => handleNavClick(e, "#bounty")}
                      >
                        了解机会雷达 →
                      </a>
                    </div>
                  </div>

                  {/* item 02 */}
                  <div className="flex flex-col md:flex-row-reverse items-center gap-10">
                    <div className="md:w-1/2 p-8 bg-white rounded-2xl shadow-lg">
                      <img
                        src="https://placehold.co/600x400/fbbf24/ffffff?text=破冰策略库UI"
                        alt="破冰策略库UI界面"
                        className="rounded-lg w-full"
                      />
                    </div>
                    <div className="md:w-1/2">
                      <span className="text-yellow-500 font-bold">02</span>
                      <h3 className="text-2xl font-bold mt-2 mb-4">AIGC生成破冰弹药</h3>
                      <p className="text-gray-600 mb-6">
                        从关键联系人到邮件第一句话，AI为你量身定制沟通策略，让你的出击不再尴尬，给HR留下深刻第一印象。
                      </p>
                      <a
                        href="#forge"
                        className="nav-link font-bold text-yellow-600 hover:underline"
                        onClick={(e) => handleNavClick(e, "#forge")}
                      >
                        查看破冰工坊 →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 证言 */}
            <section id="testimonials" ref={testimonialsRef} className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">他们已经成功"破冰"</h2>
                  <p className="text-gray-600">听听第一批"猎手"怎么说。</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                    <p className="text-gray-600 mb-6">
                      "通过'冲鸭'发现一家刚融资的AI公司，用它生成的邮件联系了CTO，三天后就收到了面试邀请，太神奇了！"
                    </p>
                    <div className="flex items-center">
                      <img
                        src="https://placehold.co/48x48/cccccc/ffffff?text=小明"
                        alt="用户头像 小明"
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div>
                        <p className="font-bold text-gray-800">小明</p>
                        <p className="text-sm text-gray-500">计算机科学专业</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                    <p className="text-gray-600 mb-6">
                      "文科生找工作太难了！'冲鸭'帮我定位了几家快速扩张的新消费品牌，并指导我如何展示策划能力，最终成功入职！"
                    </p>
                    <div className="flex items-center">
                      <img
                        src="https://placehold.co/48x48/cccccc/ffffff?text=小红"
                        alt="用户头像 小红"
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div>
                        <p className="font-bold text-gray-800">小红</p>
                        <p className="text-sm text-gray-500">市场营销专业</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 md:col-span-2 lg:col-span-1">
                    <p className="text-gray-600 mb-6">
                      "以前总觉得毛遂自荐很掉价，用了这个才发现，精准的主动出击比海投有效100倍。已经拿到了3个隐藏offer。"
                    </p>
                    <div className="flex items-center">
                      <img
                        src="https://placehold.co/48x48/cccccc/ffffff?text=李哲"
                        alt="用户头像 李哲"
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div>
                        <p className="font-bold text-gray-800">李哲</p>
                        <p className="text-sm text-gray-500">软件工程专业</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 关于我们 */}
            <section id="about" ref={aboutRef} className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-14">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">关于我们</h2>
                  <p className="text-gray-600">
                    我们是一支来自 AI 与职业教育一线的产品团队。相信每位应届生都值得被看见，
                    用数据与智能工具，帮助你从"投简历"升级为"捕机会"。
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <Lightbulb size={24} className="text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">创新为先</h3>
                    <p className="text-gray-600 text-sm">
                      持续打磨 AI 情报与个性化生成能力，打造面向求职者的"战术级"产品。
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <Users size={24} className="text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">以人为本</h3>
                    <p className="text-gray-600 text-sm">
                      先用户、后功能。我们与高校与校招导师深度共创，把复杂体验做简单。
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <BarChart3 size={24} className="text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">结果导向</h3>
                    <p className="text-gray-600 text-sm">
                      不止追踪投递，更关注"回复-面试-Offer"的全链路，给你可复用的策略沉淀。
                    </p>
                  </div>
                </div>

                <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6">
                  <p className="text-sm text-gray-500 mb-4">已服务与合作的机构（示意）</p>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-6 items-center">
                    <img
                      src="https://placehold.co/120x40?text=LogoA"
                      alt="合作机构 Logo A"
                      className="mx-auto opacity-70"
                    />
                    <img
                      src="https://placehold.co/120x40?text=LogoB"
                      alt="合作机构 Logo B"
                      className="mx-auto opacity-70"
                    />
                    <img
                      src="https://placehold.co/120x40?text=LogoC"
                      alt="合作机构 Logo C"
                      className="mx-auto opacity-70"
                    />
                    <img
                      src="https://placehold.co/120x40?text=LogoD"
                      alt="合作机构 Logo D"
                      className="mx-auto opacity-70"
                    />
                    <img
                      src="https://placehold.co/120x40?text=LogoE"
                      alt="合作机构 Logo E"
                      className="mx-auto opacity-70"
                    />
                    <img
                      src="https://placehold.co/120x40?text=LogoF"
                      alt="合作机构 Logo F"
                      className="mx-auto opacity-70"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 绿色 CTA */}
            <section className="bg-green-600 text-white">
              <div className="container mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">你的下一个机会，不在招聘网站上。</h2>
                <p className="text-lg text-green-100 mb-10 max-w-2xl mx-auto">
                  立即加入，解锁那些专属于"猎手"的求职机会。
                </p>
                <a
                  href="#signup"
                  className="bg-white text-green-600 font-bold py-4 px-10 rounded-full text-lg transition-transform hover:scale-105 inline-block shadow-lg nav-link"
                  onClick={(e) => handleNavClick(e, "#signup")}
                >
                  立即免费注册，开启狙击
                </a>
              </div>
            </section>
          </div>
        )}

        {/* 1) 机会雷达 */}
        {currentPage === "bounty" && (
          <div id="page-bounty" className="page-content">
            <section className="py-12 bg-white">
              <div className="container mx-auto px-6">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800">机会雷达</h2>
                  {!user && <p className="text-sm text-gray-500">登录后可发送破冰邮件</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {allOpportunities.map((opp) => (
                    <div key={opp.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                      <h3 className="text-xl font-bold text-gray-800">{opp.company}</h3>
                      <p className="text-gray-500 mt-1">
                        {opp.title} · {opp.city || "城市不限"}
                      </p>
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {opp.tags.map((t) => (
                          <span key={t} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-6 flex justify-between items-center">
                        <p className="text-sm text-gray-500">{opp.reason}</p>
                        <button
                          className="bg-green-500 text-white font-bold py-2 px-4 rounded-full cta-button"
                          onClick={() => onGoForge(opp)}
                        >
                          发送破冰邮件
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 2) 破冰工坊 */}
        {currentPage === "forge" && (
          <div id="page-forge" className="page-content">
            <section className="py-12">
              <div className="container mx-auto px-6 max-w-3xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">破冰工坊</h2>
                {connOk === true && <p className="text-sm text-green-600 mb-4">已成功链接云端数据（Supabase）</p>}
                {connOk === false && (
                  <p className="text-sm text-red-600 mb-4">云端连接失败：{connErr || "未知错误"}（本地演示）</p>
                )}

                {/* 演示模式提示 */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-blue-600" />
                    <p className="text-blue-700 text-sm">
                      <strong>演示模式：</strong>
                      当前未配置真实邮件服务，发送的邮件为模拟发送。要启用真实邮件发送，请配置 RESEND_API_KEY 环境变量。
                    </p>
                  </div>
                </div>

                {!user ? (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                    <p className="text-gray-700">请先登录后生成邮件</p>
                    <div className="mt-4">
                      <a
                        href="#login"
                        className="px-6 py-2 rounded-full border border-gray-300 hover:bg-gray-100 nav-link"
                        onClick={(e) => handleNavClick(e, "#login")}
                      >
                        去登录
                      </a>
                    </div>
                  </div>
                ) : !selectedOpp ? (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                    <p className="text-gray-700">请先在"机会雷达"中选择一个机会</p>
                    <div className="mt-4">
                      <a
                        href="#bounty"
                        className="px-6 py-2 rounded-full bg-green-500 text-white cta-button nav-link"
                        onClick={(e) => handleNavClick(e, "#bounty")}
                      >
                        前往选择
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500">
                        根据你的简历与目标公司「<b>{selectedOpp.company}</b>」生成邮件。
                      </p>
                      <button
                        onClick={onRegenerateEmail}
                        disabled={aiGenerating}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-60 transition-colors"
                      >
                        {aiGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            AI生成中...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            重新生成
                          </>
                        )}
                      </button>
                    </div>

                    {aiGenerateError && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-700 text-sm">⚠️ {aiGenerateError}</p>
                      </div>
                    )}

                    {aiGenerating && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-blue-700 text-sm">AI正在为你量身定制破冰邮件，请稍候...</p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          收件人邮箱 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="hr@company.com 或 cto@company.com"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                          disabled={aiGenerating}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">💡 建议发送给HR、技术负责人或创始人邮箱</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">你的邮箱（可选）</label>
                        <input
                          type="email"
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          placeholder="your.email@gmail.com"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                          disabled={aiGenerating}
                        />
                        <p className="text-xs text-gray-500 mt-1">用于接收回复，不填写将使用系统默认邮箱</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">主题</label>
                        <input
                          value={mailSubject}
                          onChange={(e) => setMailSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                          disabled={aiGenerating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">正文</label>
                        <textarea
                          value={mailBody}
                          onChange={(e) => setMailBody(e.target.value)}
                          rows={12}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none font-mono text-sm"
                          disabled={aiGenerating}
                        />
                      </div>

                      {!resumeText && (
                        <p className="text-xs text-amber-600">
                          💡 未检测到你的简历文本，建议先到"个人主页"上传简历以获得更个性化的AI生成内容。
                        </p>
                      )}

                      <div className="flex justify-end gap-3">
                        <a
                          href="#bounty"
                          onClick={(e) => handleNavClick(e, "#bounty")}
                          className="px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-100 nav-link"
                        >
                          取消
                        </a>
                        <button
                          onClick={onConfirmSend}
                          disabled={sending || aiGenerating || !mailSubject.trim() || !mailBody.trim()}
                          className="px-5 py-2 rounded-full bg-green-500 text-white cta-button disabled:opacity-60"
                        >
                          {sending ? "发送中..." : "确认发送"}
                        </button>
                      </div>
                      {sendMsg && (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-line">{sendMsg}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Rest of the pages remain the same... */}
        {/* I'll continue with the remaining pages to complete the component */}

        {/* 网页爬虫（管理员页面） */}
        {currentPage === "scraper" && (
          <div id="page-scraper" className="page-content">
            <section className="py-12 bg-white">
              <div className="container mx-auto px-6 max-w-4xl">
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">网页爬虫工具</h2>
                  <p className="text-sm text-green-600">管理员专用 - 用于收集机会情报数据</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">目标网页URL</label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          value={crawlUrl}
                          onChange={(e) => setCrawlUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        />
                        <button
                          onClick={handleCrawl}
                          disabled={crawling}
                          className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg cta-button disabled:opacity-60"
                        >
                          {crawling ? "爬取中..." : "开始爬取"}
                        </button>
                      </div>
                    </div>

                    {crawlError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{crawlError}</p>
                      </div>
                    )}

                    {crawlResult && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3">爬取结果</h3>
                        <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-auto">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{crawlResult}</pre>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => navigator.clipboard.writeText(crawlResult)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            复制结果
                          </button>
                          <button
                            onClick={() => setCrawlResult(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            清空结果
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 使用说明 */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">使用说明</h3>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li>• 输入完整的网页URL（包含 http:// 或 https://）</li>
                    <li>• 支持爬取大部分公开网页的文本内容</li>
                    <li>• 结果会自动截取前5000字符以便查看</li>
                    <li>• 可以复制结果用于后续的机会分析</li>
                    <li>• 请遵守目标网站的robots.txt规则</li>
                  </ul>
                </div>

                {/* 快捷链接 */}
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">常用数据源</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "36氪", url: "https://36kr.com", desc: "创投资讯" },
                      { name: "虎嗅", url: "https://huxiu.com", desc: "商业资讯" },
                      { name: "IT桔子", url: "https://itjuzi.com", desc: "投融资数据" },
                      { name: "拉勾网", url: "https://lagou.com", desc: "招聘信息" },
                      { name: "Boss直聘", url: "https://zhipin.com", desc: "招聘信息" },
                      { name: "猎聘网", url: "https://liepin.com", desc: "高端招聘" },
                    ].map((source) => (
                      <div
                        key={source.name}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-300 transition-colors cursor-pointer"
                        onClick={() => setCrawlUrl(source.url)}
                      >
                        <h4 className="font-bold text-gray-800">{source.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{source.desc}</p>
                        <p className="text-xs text-green-600 mt-2">{source.url}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 机会管理（管理员页面） */}
        {currentPage === "opportunity-manager" && (
          <div id="page-opportunity-manager" className="page-content">
            <section className="py-12 bg-white">
              <div className="container mx-auto px-6 max-w-6xl">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">机会管理</h2>
                    <p className="text-sm text-green-600">管理员专用 - 添加和管理求职机会</p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg cta-button"
                  >
                    添加新机会
                  </button>
                </div>

                {/* 添加/编辑表单 */}
                {(showAddForm || editingOpp) && (
                  <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{editingOpp ? "编辑机会" : "添加新机会"}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          公司名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={oppForm.company}
                          onChange={(e) => setOppForm({ ...oppForm, company: e.target.value })}
                          placeholder="奇点无限科技"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          职位标题 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={oppForm.title}
                          onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })}
                          placeholder="NLP算法工程师"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                        <input
                          type="text"
                          value={oppForm.city}
                          onChange={(e) => setOppForm({ ...oppForm, city: e.target.value })}
                          placeholder="北京"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                        <input
                          type="text"
                          value={oppForm.tags}
                          onChange={(e) => setOppForm({ ...oppForm, tags: e.target.value })}
                          placeholder="A轮融资, NLP, 北京"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">用逗号分隔多个标签</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">机会原因</label>
                        <textarea
                          value={oppForm.reason}
                          onChange={(e) => setOppForm({ ...oppForm, reason: e.target.value })}
                          placeholder="资金到位+产品迭代加速，对NLP岗位需求上升"
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowAddForm(false)
                          setEditingOpp(null)
                          setOppForm({ company: "", title: "", city: "", tags: "", reason: "" })
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={editingOpp ? handleUpdateOpportunity : handleAddOpportunity}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg cta-button"
                      >
                        {editingOpp ? "更新" : "添加"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 机会列表 */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">管理员添加的机会 ({adminOpportunities.length})</h3>
                  </div>
                  {adminOpportunities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>暂无添加的机会，点击上方按钮添加第一个机会</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {adminOpportunities.map((opp) => (
                        <div key={opp.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-800">{opp.company}</h4>
                              <p className="text-gray-600 mt-1">
                                {opp.title} {opp.city && `· ${opp.city}`}
                              </p>
                              <div className="mt-2 flex gap-2 flex-wrap">
                                {opp.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              {opp.reason && <p className="text-sm text-gray-500 mt-2">{opp.reason}</p>}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditOpportunity(opp)}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteOpportunity(opp.id)}
                                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 默认机会预览 */}
                <div className="mt-8 bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">系统默认机会 (只读)</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {todayOpportunities.map((opp) => (
                      <div key={opp.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-bold text-gray-800">{opp.company}</h4>
                        <p className="text-gray-600 text-sm mt-1">
                          {opp.title} {opp.city && `· ${opp.city}`}
                        </p>
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {opp.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 定价页面 */}
        {currentPage === "pricing" && (
          <div id="page-pricing" className="page-content">
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">选择适合你的计划</h2>
                  <p className="text-gray-600">从免费体验到专业服务，总有一款适合你的求职需求。</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {/* 免费版 */}
                  <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">免费体验</h3>
                      <div className="text-3xl font-bold text-gray-800 mb-2">
                        ¥0<span className="text-lg font-normal text-gray-500">/月</span>
                      </div>
                      <p className="text-gray-500">适合初次尝试的求职者</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        每日3个机会推荐
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        基础邮件模板
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        简历存储（1份）
                      </li>
                      <li className="flex items-center text-gray-500">
                        <span className="text-gray-300 mr-2">✗</span>
                        AI个性化生成
                      </li>
                      <li className="flex items-center text-gray-500">
                        <span className="text-gray-300 mr-2">✗</span>
                        高级筛选
                      </li>
                    </ul>
                    <button
                      onClick={() => showPage("#signup")}
                      className="w-full py-3 px-6 border border-gray-300 rounded-full font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      免费开始
                    </button>
                  </div>

                  {/* 专业版 */}
                  <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-200 relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">推荐</span>
                    </div>
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">专业版</h3>
                      <div className="text-3xl font-bold text-gray-800 mb-2">
                        ¥99<span className="text-lg font-normal text-gray-500">/月</span>
                      </div>
                      <p className="text-gray-500">适合认真求职的应届生</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        每日20个精准机会
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        AI个性化邮件生成
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        简历存储（无限）
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        高级筛选与标签
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        邮件发送追踪
                      </li>
                    </ul>
                    <button
                      onClick={() => alert("专业版购买功能开发中")}
                      className="w-full py-3 px-6 bg-green-500 text-white rounded-full font-bold cta-button"
                    >
                      立即升级
                    </button>
                  </div>

                  {/* 企业版 */}
                  <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">企业版</h3>
                      <div className="text-3xl font-bold text-gray-800 mb-2">
                        ¥299<span className="text-lg font-normal text-gray-500">/月</span>
                      </div>
                      <p className="text-gray-500">适合求职机构和团队</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        无限机会推荐
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        团队协作功能
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        数据分析报告
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        专属客服支持
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-green-500 mr-2">✓</span>
                        API接口访问
                      </li>
                    </ul>
                    <button
                      onClick={() => alert("企业版咨询功能开发中")}
                      className="w-full py-3 px-6 border border-gray-300 rounded-full font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      联系销售
                    </button>
                  </div>
                </div>

                {/* FAQ */}
                <div className="mt-20 max-w-3xl mx-auto">
                  <h3 className="text-2xl font-bold text-gray-800 text-center mb-12">常见问题</h3>
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-bold text-gray-800 mb-2">免费版有什么限制？</h4>
                      <p className="text-gray-600">
                        免费版每日提供3个机会推荐，使用基础邮件模板，可存储1份简历。升级后可享受AI个性化生成和更多高级功能。
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-bold text-gray-800 mb-2">如何取消订阅？</h4>
                      <p className="text-gray-600">
                        你可以随时在个人设置中取消订阅，取消后将在当前计费周期结束时生效，不会立即停止服务。
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-bold text-gray-800 mb-2">支持哪些支付方式？</h4>
                      <p className="text-gray-600">我们支持微信支付、支付宝、银行卡等多种支付方式，安全便捷。</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 博客页面 */}
        {currentPage === "blog" && (
          <div id="page-blog" className="page-content">
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">求职干货</h2>
                  <p className="text-gray-600">从简历优化到面试技巧，助你在求职路上少走弯路。</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* 文章1 */}
                  <article className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                    <img
                      src="https://placehold.co/400x200/34d399/ffffff?text=简历优化"
                      alt="简历优化指南"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span>2024年1月15日</span>
                        <span className="mx-2">·</span>
                        <span>简历技巧</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">应届生简历的7个致命错误</h3>
                      <p className="text-gray-600 mb-4">
                        90%的应届生简历都有这些问题，导致HR看都不看就pass。本文教你如何避开这些坑...
                      </p>
                      <button
                        onClick={() => alert("文章详情页面开发中")}
                        className="text-green-600 font-bold hover:underline"
                      >
                        阅读全文 →
                      </button>
                    </div>
                  </article>

                  {/* 文章2 */}
                  <article className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                    <img
                      src="https://placehold.co/400x200/fbbf24/ffffff?text=面试技巧"
                      alt="面试技巧"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span>2024年1月12日</span>
                        <span className="mx-2">·</span>
                        <span>面试准备</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">技术面试中的STAR法则</h3>
                      <p className="text-gray-600 mb-4">
                        如何用STAR法则回答行为面试问题，让你的回答更有说服力，给面试官留下深刻印象...
                      </p>
                      <button
                        onClick={() => alert("文章详情页面开发中")}
                        className="text-green-600 font-bold hover:underline"
                      >
                        阅读全文 →
                      </button>
                    </div>
                  </article>

                  {/* 文章3 */}
                  <article className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                    <img
                      src="https://placehold.co/400x200/8b5cf6/ffffff?text=求职策略"
                      alt="求职策略"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span>2024年1月10日</span>
                        <span className="mx-2">·</span>
                        <span>求职策略</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">为什么主动出击比海投更有效？</h3>
                      <p className="text-gray-600 mb-4">
                        数据显示，主动联系HR的成功率是海投的10倍。本文分析原因并教你如何正确主动出击...
                      </p>
                      <button
                        onClick={() => alert("文章详情页面开发中")}
                        className="text-green-600 font-bold hover:underline"
                      >
                        阅读全文 →
                      </button>
                    </div>
                  </article>

                  {/* 文章4 */}
                  <article className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                    <img
                      src="https://placehold.co/400x200/ef4444/ffffff?text=行业分析"
                      alt="行业分析"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span>2024年1月8日</span>
                        <span className="mx-2">·</span>
                        <span>行业洞察</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">2024年AI行业求职指南</h3>
                      <p className="text-gray-600 mb-4">
                        AI行业哪些岗位最热门？薪资水平如何？需要什么技能？一文带你了解AI行业求职全貌...
                      </p>
                      <button
                        onClick={() => alert("文章详情页面开发中")}
                        className="text-green-600 font-bold hover:underline"
                      >
                        阅读全文 →
                      </button>
                    </div>
                  </article>

                  {/* 文章5 */}
                  <article className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                    <img
                      src="https://placehold.co/400x200/06b6d4/ffffff?text=薪资谈判"
                      alt="薪资谈判"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span>2024年1月5日</span>
                        <span className="mx-2">·</span>
                        <span>薪资谈判</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">应届生如何谈薪资？</h3>
                      <p className="text-gray-600 mb-4">
                        没有经验的应届生也能谈出好薪资！掌握这些技巧，让你的起薪比同龄人高20%...
                      </p>
                      <button
                        onClick={() => alert("文章详情页面开发中")}
                        className="text-green-600 font-bold hover:underline"
                      >
                        阅读全文 →
                      </button>
                    </div>
                  </article>

                  {/* 文章6 */}
                  <article className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                    <img
                      src="https://placehold.co/400x200/f59e0b/ffffff?text=职业规划"
                      alt="职业规划"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span>2024年1月3日</span>
                        <span className="mx-2">·</span>
                        <span>职业规划</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">第一份工作如何选择？</h3>
                      <p className="text-gray-600 mb-4">
                        大公司还是小公司？稳定还是挑战？第一份工作的选择将影响你的整个职业生涯...
                      </p>
                      <button
                        onClick={() => alert("文章详情页面开发中")}
                        className="text-green-600 font-bold hover:underline"
                      >
                        阅读全文 →
                      </button>
                    </div>
                  </article>
                </div>

                {/* 订阅区域 */}
                <div className="mt-20 bg-green-50 rounded-2xl p-12 text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">订阅求职干货</h3>
                  <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                    每周收到最新的求职技巧、行业洞察和成功案例，让你在求职路上始终保持领先。
                  </p>
                  <form
                    className="max-w-md mx-auto flex gap-4"
                    onSubmit={onSubmitAlert("订阅成功！稍后将收到确认邮件（模拟提交）")}
                  >
                    <input
                      type="email"
                      placeholder="输入你的邮箱"
                      className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-green-500 text-white font-bold py-3 px-6 rounded-full cta-button whitespace-nowrap"
                    >
                      订阅
                    </button>
                  </form>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 登录页面 */}
        {currentPage === "login" && (
          <div id="page-login" className="page-content">
            <section className="py-20 bg-white min-h-screen flex items-center">
              <div className="container mx-auto px-6">
                <div className="max-w-md mx-auto bg-gray-50 rounded-2xl shadow-xl p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎回来</h2>
                    <p className="text-gray-600">登录你的简历冲鸭账户</p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-2">
                        用户名
                      </label>
                      <input
                        type="text"
                        id="login-username"
                        name="login-username"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none transition-shadow"
                        placeholder="输入你的用户名"
                      />
                    </div>

                    <div>
                      <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                        密码
                      </label>
                      <input
                        type="password"
                        id="login-password"
                        name="login-password"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none transition-shadow"
                        placeholder="输入你的密码"
                      />
                    </div>

                    {loginErr && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{loginErr}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg cta-button disabled:opacity-60"
                    >
                      {authLoading ? "登录中..." : "登录"}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-gray-600">
                      还没有账户？{" "}
                      <a
                        href="#signup"
                        className="text-green-600 font-bold hover:underline nav-link"
                        onClick={(e) => handleNavClick(e, "#signup")}
                      >
                        立即注册
                      </a>
                    </p>
                  </div>

                  {/* 演示账户提示 */}
                  <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-800 mb-2">演示账户</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>
                        <strong>管理员：</strong>offergungun / careericebreaker
                      </p>
                      <p>
                        <strong>普通用户：</strong>可以注册任意用户名和密码
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 注册页面 */}
        {currentPage === "signup" && (
          <div id="page-signup" className="page-content">
            <section className="py-20 bg-white min-h-screen flex items-center">
              <div className="container mx-auto px-6">
                <div className="max-w-md mx-auto bg-gray-50 rounded-2xl shadow-xl p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">加入简历冲鸭</h2>
                    <p className="text-gray-600">开启你的主动求职之旅</p>
                  </div>

                  <form onSubmit={handleSignupSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-2">
                        用户名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="signup-name"
                        name="signup-name"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none transition-shadow"
                        placeholder="输入你的用户名"
                      />
                    </div>

                    <div>
                      <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">
                        密码 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        id="signup-password"
                        name="signup-password"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none transition-shadow"
                        placeholder="设置你的密码"
                      />
                    </div>

                    {signupErr && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{signupErr}</p>
                      </div>
                    )}

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-700 text-sm">✨ 注册即可免费体验机会雷达和破冰工坊功能</p>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg cta-button disabled:opacity-60"
                    >
                      {authLoading ? "注册中..." : "免费注册"}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-gray-600">
                      已有账户？{" "}
                      <a
                        href="#login"
                        className="text-green-600 font-bold hover:underline nav-link"
                        onClick={(e) => handleNavClick(e, "#login")}
                      >
                        立即登录
                      </a>
                    </p>
                  </div>

                  {/* 服务条款 */}
                  <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                      注册即表示你同意我们的{" "}
                      <a
                        href="#terms"
                        className="text-green-600 hover:underline nav-link"
                        onClick={(e) => handleNavClick(e, "#terms")}
                      >
                        服务条款
                      </a>{" "}
                      和隐私政策
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 服务条款页面 */}
        {currentPage === "terms" && (
          <div id="page-terms" className="page-content">
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6 max-w-4xl">
                <div className="mb-12">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">服务条款</h1>
                  <p className="text-gray-600">最后更新：2024年1月1日</p>
                </div>

                <div className="prose prose-gray max-w-none">
                  <div className="space-y-8">
                    <section>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">1. 服务说明</h2>
                      <p className="text-gray-600 leading-relaxed">
                        简历冲鸭（以下简称"我们"或"本平台"）是一个专为求职者提供智能求职服务的平台。我们通过AI技术为用户提供机会发现、邮件生成、简历管理等服务。
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">2. 用户责任</h2>
                      <ul className="text-gray-600 leading-relaxed space-y-2">
                        <li>• 用户应确保提供的信息真实、准确、完整</li>
                        <li>• 用户不得利用本平台进行任何违法违规活动</li>
                        <li>• 用户应妥善保管账户信息，对账户下的所有活动负责</li>
                        <li>• 用户不得恶意使用平台功能，如频繁发送垃圾邮件等</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">3. 平台责任</h2>
                      <ul className="text-gray-600 leading-relaxed space-y-2">
                        <li>• 我们努力确保平台稳定运行，但不保证服务不会中断</li>
                        <li>• 我们提供的机会信息仅供参考，不保证其准确性和时效性</li>
                        <li>• 我们不对用户使用平台服务产生的结果承担责任</li>
                        <li>• 我们会保护用户隐私，但不对第三方泄露承担责任</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">4. 隐私保护</h2>
                      <p className="text-gray-600 leading-relaxed">
                        我们重视用户隐私保护，会采取合理措施保护用户个人信息安全。用户简历等敏感信息仅用于提供服务，不会未经授权向第三方披露。
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">5. 付费服务</h2>
                      <ul className="text-gray-600 leading-relaxed space-y-2">
                        <li>• 部分高级功能需要付费使用</li>
                        <li>• 付费后如需退款，请在7天内联系客服</li>
                        <li>• 我们保留调整价格的权利，但会提前通知用户</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">6. 知识产权</h2>
                      <p className="text-gray-600 leading-relaxed">
                        本平台的所有内容，包括但不限于文字、图片、代码、设计等，均受知识产权法保护。用户不得未经授权复制、传播或商业使用。
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">7. 服务变更与终止</h2>
                      <ul className="text-gray-600 leading-relaxed space-y-2">
                        <li>• 我们保留随时修改或终止服务的权利</li>
                        <li>• 重大变更会提前30天通知用户</li>
                        <li>• 用户可随时停止使用服务并注销账户</li>
                      </ul>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">8. 争议解决</h2>
                      <p className="text-gray-600 leading-relaxed">
                        因使用本服务产生的争议，双方应友好协商解决。协商不成的，提交至平台所在地人民法院解决。
                      </p>
                    </section>

                    <section>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">9. 联系我们</h2>
                      <p className="text-gray-600 leading-relaxed">
                        如对本服务条款有任何疑问，请通过以下方式联系我们：
                      </p>
                      <ul className="text-gray-600 leading-relaxed space-y-1 mt-2">
                        <li>• 邮箱：hello@example.com</li>
                        <li>• 客服热线：400-123-4567</li>
                        <li>• 工作时间：周一至周五 9:00-18:00</li>
                      </ul>
                    </section>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <a
                    href="#home"
                    className="inline-block bg-green-500 text-white font-bold py-3 px-8 rounded-full cta-button nav-link"
                    onClick={(e) => handleNavClick(e, "#home")}
                  >
                    返回首页
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 个人资料页面 */}
        {currentPage === "profile" && (
          <div id="page-profile" className="page-content">
            <section className="py-12 bg-white">
              <div className="container mx-auto px-6 max-w-4xl">
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">个人资料</h2>
                  {connOk === true && <p className="text-sm text-green-600">已成功连接云端数据（Supabase）</p>}
                  {connOk === false && (
                    <p className="text-sm text-red-600">云端连接失败：{connErr || "未知错误"}（使用本地存储）</p>
                  )}
                </div>

                {!user ? (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                    <p className="text-gray-700 mb-4">请先登录查看个人资料</p>
                    <a
                      href="#login"
                      className="inline-block px-6 py-2 bg-green-500 text-white rounded-full cta-button nav-link"
                      onClick={(e) => handleNavClick(e, "#login")}
                    >
                      去登录
                    </a>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* 用户信息卡片 */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold">
                          {avatarInitial}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{user.username}</h3>
                          <p className="text-gray-500">
                            注册时间：{user.created_at ? new Date(user.created_at).toLocaleDateString("zh-CN") : "未知"}
                          </p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-green-600">{resumes.length}</div>
                          <div className="text-sm text-gray-500">简历数量</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-600">0</div>
                          <div className="text-sm text-gray-500">发送邮件</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-purple-600">0</div>
                          <div className="text-sm text-gray-500">收到回复</div>
                        </div>
                      </div>
                    </div>

                    {/* 简历管理 */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800">简历管理</h3>
                        <div className="flex gap-3">
                          <label className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                            <input
                              type="file"
                              accept=".txt,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) onResumeFileChosen(file)
                              }}
                              className="hidden"
                              disabled={fileUploading}
                            />
                            {fileUploading ? "上传中..." : "上传简历"}
                          </label>
                          <button
                            onClick={() => setShowResumeForm(true)}
                            className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg cta-button"
                          >
                            新建简历
                          </button>
                        </div>
                      </div>

                      {/* 文件上传状态 */}
                      {fileUploadError && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-600 text-sm whitespace-pre-line">{fileUploadError}</p>
                        </div>
                      )}

                      {fileUploadSuccess && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-600 text-sm">{fileUploadSuccess}</p>
                        </div>
                      )}

                      {/* 简历表单 */}
                      {showResumeForm && (
                        <div className="mb-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <h4 className="text-lg font-bold text-gray-800 mb-4">
                            {editingResume ? "编辑简历" : "新建简历"}
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                简历标题 <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={resumeForm.title}
                                onChange={(e) => setResumeForm({ ...resumeForm, title: e.target.value })}
                                placeholder="例如：前端开发工程师简历"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                简历内容 <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={resumeForm.content}
                                onChange={(e) => setResumeForm({ ...resumeForm, content: e.target.value })}
                                placeholder="请输入你的简历内容..."
                                rows={12}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none font-mono text-sm"
                              />
                            </div>
                            {resumeError && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-600 text-sm">{resumeError}</p>
                              </div>
                            )}
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={cancelResumeForm}
                                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                              >
                                取消
                              </button>
                              <button
                                onClick={editingResume ? handleUpdateResume : handleCreateResume}
                                disabled={resumeLoading}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg cta-button disabled:opacity-60"
                              >
                                {resumeLoading ? "保存中..." : editingResume ? "更新" : "创建"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 简历列表 */}
                      {resumes.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <p className="mb-4">还没有简历，快来添加第一份简历吧！</p>
                          <p className="text-sm">支持上传 .txt 和 .docx 格式文件</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {resumes.map((resume) => (
                            <div
                              key={resume.id}
                              className={`border rounded-lg p-4 transition-colors ${
                                selectedResumeId === resume.id
                                  ? "border-green-300 bg-green-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-bold text-gray-800">{resume.title}</h4>
                                    {selectedResumeId === resume.id && (
                                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                        当前使用
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500 mb-2">
                                    创建时间：{new Date(resume.created_at).toLocaleDateString("zh-CN")}
                                    {resume.updated_at !== resume.created_at && (
                                      <span className="ml-2">
                                        更新时间：{new Date(resume.updated_at).toLocaleDateString("zh-CN")}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {resume.content.slice(0, 100)}
                                    {resume.content.length > 100 && "..."}
                                  </p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={() => handleSelectResume(resume.id)}
                                    className={`px-3 py-1 text-sm rounded transition-colors ${
                                      selectedResumeId === resume.id
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                                  >
                                    {selectedResumeId === resume.id ? "已选择" : "选择"}
                                  </button>
                                  <button
                                    onClick={() => handleEditResume(resume)}
                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                  >
                                    编辑
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResume(resume.id)}
                                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 使用说明 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-blue-800 mb-3">使用说明</h3>
                      <ul className="text-sm text-blue-700 space-y-2">
                        <li>• 支持上传 .txt 和 .docx 格式的简历文件</li>
                        <li>• 可以创建多份简历，适用于不同类型的职位申请</li>
                        <li>• 选择的简历将用于破冰工坊的AI邮件生成</li>
                        <li>• 简历内容会安全存储，仅用于为你生成个性化求职邮件</li>
                        <li>• 建议定期更新简历内容，保持信息的时效性</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">简历冲鸭</h4>
              <p className="text-gray-400 text-sm">别再海投，我们教你狙击。</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">产品</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#home"
                    data-scroll-to="features"
                    className="hover:text-white nav-link"
                    onClick={(e) => handleNavClick(e, "#home")}
                  >
                    产品功能
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white nav-link"
                    onClick={(e) => handleNavClick(e, "#pricing")}
                  >
                    定价
                  </a>
                </li>
                <li>
                  <a href="#blog" className="hover:text-white nav-link" onClick={(e) => handleNavClick(e, "#blog")}>
                    求职干货
                  </a>
                </li>
                <li>
                  <a
                    href="#home"
                    data-scroll-to="about"
                    className="hover:text-white nav-link"
                    onClick={(e) => handleNavClick(e, "#home")}
                  >
                    关于我们
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">联系我们</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="mailto:hello@example.com" className="hover:text-white">
                    hello@example.com
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    加入内测群
                  </a>
                </li>
                <li>
                  <a href="#terms" className="hover:text-white nav-link" onClick={(e) => handleNavClick(e, "#terms")}>
                    服务条款
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} 简历冲鸭. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
