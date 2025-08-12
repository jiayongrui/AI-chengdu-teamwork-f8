"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Noto_Sans_SC } from "next/font/google"
import {
  List,
  Files,
  TreasureChest,
  Door,
  PresentationChart,
  Lightbulb,
  UsersThree,
  CheckCircle,
  Plus,
  Pencil,
  Trash,
  FloppyDisk,
  X,
} from "@phosphor-icons/react"

import { getSupabaseClient } from "@/lib/supabase-client"
import { signIn, signUp, getLocalUser, setLocalUser } from "@/lib/auth"
import type { User } from "@/types/user"
import type { Opportunity } from "@/types/opportunity"
import { todayOpportunities } from "@/lib/opportunities"
import { fetchUserResumeText, updateUserResumeText } from "@/lib/user-profile"
import { generateIcebreakerEmail } from "@/lib/email-template"
import { logAndAdvanceTask } from "@/lib/email-send"

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

  // 网页爬虫状态（管理员功能）
  const [isAdmin, setIsAdmin] = useState(false)
  const [crawlUrl, setCrawlUrl] = useState("")
  const [crawlResult, setCrawlResult] = useState<string | null>(null)
  const [crawling, setCrawling] = useState(false)
  const [crawlError, setCrawlError] = useState<string | null>(null)

  // 机会管理状态（管理员功能）
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
          const txt = await fetchUserResumeText(user.id)
          setResumeText(txt)
        } catch (e: any) {
          setConnOk(false)
          setConnErr(e?.message ?? "连接 Supabase 失败")
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
    const draft = generateIcebreakerEmail({ user, resumeText, opp })
    setMailSubject(draft.subject)
    setMailBody(draft.body)
    showPage("#forge")
  }

  // 破冰工坊：确认发送
  const onConfirmSend = async () => {
    if (!user || !selectedOpp) return
    setSending(true)
    setSendMsg(null)
    try {
      await logAndAdvanceTask({ userId: user.id, opp: selectedOpp, subject: mailSubject, body: mailBody })
      setSendMsg("已发送并记录到系统")
      setTimeout(() => showPage("#bounty"), 600)
    } catch (e: any) {
      setSendMsg(`发送失败：${e?.message ?? "未知错误"}`)
    } finally {
      setSending(false)
    }
  }

  // 简历上传
  const onResumeFileChosen = async (file: File) => {
    if (!user) return
    const ext = file.name.split(".").pop()?.toLowerCase()
    try {
      let text = ""
      if (ext === "txt" || file.type.startsWith("text/")) {
        text = await file.text()
      } else if (ext === "docx") {
        const mammoth = await import("mammoth/mammoth.browser")
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        text = result.value
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      } else {
        alert("目前仅支持 .txt 或 .docx 简历文件用于 Demo 提取文本。")
        return
      }
      await updateUserResumeText(user.id, text)
      setResumeText(text)
      alert("简历已更新（文本）")
    } catch (e: any) {
      alert(`简历上传失败：${e?.message ?? "未知错误"}`)
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
              <List size={32} />
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
                      <Files size={32} className="text-red-500" weight="bold" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">信息海洋，简历被淹没</h3>
                    <p className="text-gray-500">你的优秀，在数千份简历中被轻易忽略。</p>
                  </div>

                  <div className="text-center p-8 border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex justify-center items-center mb-6 w-16 h-16 mx-auto bg-yellow-100 rounded-full">
                      <TreasureChest size={32} className="text-yellow-500" weight="bold" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">机会黑箱，好公司难寻</h3>
                    <p className="text-gray-500">除了大厂，那些高速成长的"潜力股"在哪？</p>
                  </div>

                  <div className="text-center p-8 border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex justify-center items-center mb-6 w-16 h-16 mx-auto bg-blue-100 rounded-full">
                      <Door size={32} className="text-blue-500" weight="bold" />
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
                      <Lightbulb size={24} className="text-emerald-600" weight="bold" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">创新为先</h3>
                    <p className="text-gray-600 text-sm">
                      持续打磨 AI 情报与个性化生成能力，打造面向求职者的"战术级"产品。
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <UsersThree size={24} className="text-emerald-600" weight="bold" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">以人为本</h3>
                    <p className="text-gray-600 text-sm">
                      先用户、后功能。我们与高校与校招导师深度共创，把复杂体验做简单。
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <PresentationChart size={24} className="text-emerald-600" weight="bold" />
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
                    <p className="text-sm text-gray-500 mb-2">
                      根据你的简历与目标公司「<b>{selectedOpp.company}</b>」生成邮件草稿。
                    </p>

                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">主题</label>
                        <input
                          value={mailSubject}
                          onChange={(e) => setMailSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">正文</label>
                        <textarea
                          value={mailBody}
                          onChange={(e) => setMailBody(e.target.value)}
                          rows={12}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none font-mono text-sm"
                        />
                      </div>

                      {!resumeText && (
                        <p className="text-xs text-amber-600">
                          未检测到你的简历文本，建议先到"个人主页"上传 .txt 或 .docx 以获得更个性化内容。
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
                          disabled={sending}
                          className="px-5 py-2 rounded-full bg-green-500 text-white cta-button disabled:opacity-60"
                        >
                          {sending ? "发送中..." : "确认发送"}
                        </button>
                      </div>
                      {sendMsg && <p className="text-sm text-gray-600 mt-2">{sendMsg}</p>}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

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
                    <p className="text-sm text-green-600">管理员专用 - 管理机会雷达页面的卡片内容</p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 bg-green-500 text-white font-bold py-2 px-4 rounded-lg cta-button"
                  >
                    <Plus size={20} />
                    添加机会
                  </button>
                </div>

                {/* 添加/编辑表单 */}
                {(showAddForm || editingOpp) && (
                  <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">{editingOpp ? "编辑机会" : "添加新机会"}</h3>
                      <button
                        onClick={() => {
                          setShowAddForm(false)
                          setEditingOpp(null)
                          setOppForm({ company: "", title: "", city: "", tags: "", reason: "" })
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          公司名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={oppForm.company}
                          onChange={(e) => setOppForm({ ...oppForm, company: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                          placeholder="例如：奇点无限科技"
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
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                          placeholder="例如：NLP算法工程师"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                        <input
                          type="text"
                          value={oppForm.city}
                          onChange={(e) => setOppForm({ ...oppForm, city: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                          placeholder="例如：北京"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                        <input
                          type="text"
                          value={oppForm.tags}
                          onChange={(e) => setOppForm({ ...oppForm, tags: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                          placeholder="用逗号分隔，例如：A轮融资,NLP,北京"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">机会原因</label>
                        <textarea
                          value={oppForm.reason}
                          onChange={(e) => setOppForm({ ...oppForm, reason: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                          placeholder="例如：资金到位+产品迭代加速，对NLP岗位需求上升"
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
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg cta-button"
                      >
                        <FloppyDisk size={16} />
                        {editingOpp ? "更新" : "保存"}
                      </button>
                    </div>
                  </div>
                )}

                {/* 机会列表 */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">默认机会（系统内置）</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {todayOpportunities.map((opp) => (
                        <div key={opp.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800">{opp.company}</h4>
                              <p className="text-gray-600 text-sm mt-1">
                                {opp.title} · {opp.city || "城市不限"}
                              </p>
                              <div className="mt-2 flex gap-1 flex-wrap">
                                {opp.tags.map((tag) => (
                                  <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              {opp.reason && <p className="text-xs text-gray-500 mt-2">{opp.reason}</p>}
                            </div>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">系统内置</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      管理员添加的机会 ({adminOpportunities.length})
                    </h3>
                    {adminOpportunities.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                        <p className="text-gray-500">暂无管理员添加的机会</p>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="mt-4 text-green-600 hover:text-green-700 font-medium"
                        >
                          点击添加第一个机会 →
                        </button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {adminOpportunities.map((opp) => (
                          <div key={opp.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-800">{opp.company}</h4>
                                <p className="text-gray-600 text-sm mt-1">
                                  {opp.title} · {opp.city || "城市不限"}
                                </p>
                                <div className="mt-2 flex gap-1 flex-wrap">
                                  {opp.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                {opp.reason && <p className="text-xs text-gray-500 mt-2">{opp.reason}</p>}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEditOpportunity(opp)}
                                  className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                  title="编辑"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteOpportunity(opp.id)}
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                  title="删除"
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 使用说明 */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">使用说明</h3>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li>• 添加的机会会立即在"机会雷达"页面显示</li>
                    <li>• 公司名称和职位标题为必填项</li>
                    <li>• 标签用逗号分隔，会自动生成标签样式</li>
                    <li>• 机会原因用于解释为什么这是一个好机会</li>
                    <li>• 数据保存在浏览器本地存储中</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 定价 */}
        {currentPage === "pricing" && (
          <div id="page-pricing" className="page-content">
            <section className="py-20">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">选择适合你的计划</h2>
                  <p className="text-gray-600">从免费开始，随时升级，助力你求职之路的每一步。</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {/* Free */}
                  <div className="border border-gray-200 rounded-2xl p-8 flex flex-col bg-white">
                    <h3 className="text-2xl font-bold mb-2">尝鲜版</h3>
                    <p className="text-gray-500 mb-6">免费体验核心功能</p>
                    <p className="text-4xl font-extrabold mb-6">
                      ¥0 <span className="text-lg font-normal text-gray-500">/ 永久</span>
                    </p>
                    <ul className="space-y-4 text-gray-600 flex-grow">
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> 每周 5 个机会情报
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> 基础破冰邮件模板
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> 最多追踪 10 个目标
                      </li>
                    </ul>
                    <a
                      href="#signup"
                      className="nav-link mt-8 w-full text-center bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-full hover:bg-gray-300 transition-colors"
                      onClick={(e) => handleNavClick(e, "#signup")}
                    >
                      立即开始
                    </a>
                  </div>

                  {/* Pro */}
                  <div className="border-2 border-green-500 rounded-2xl p-8 flex flex-col relative shadow-2xl bg-white">
                    <span className="absolute top-0 -translate-y-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full left-1/2 -translate-x-1/2">
                      最受欢迎
                    </span>
                    <h3 className="text-2xl font-bold mb-2">专业版</h3>
                    <p className="text-green-600 mb-6">解锁全部潜力，成为机会猎手</p>
                    <p className="text-4xl font-extrabold mb-6">
                      ¥29 <span className="text-lg font-normal text-gray-500">/ 月</span>
                    </p>
                    <ul className="space-y-4 text-gray-600 flex-grow">
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> <b>无限</b> 机会情报
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> <b>AIGC</b>{" "}
                        生成个性化破冰邮件
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> <b>无限</b>{" "}
                        目标追踪与管理
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> 关键联系人深度分析
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> 优先技术支持
                      </li>
                    </ul>
                    <a
                      href="#signup"
                      className="nav-link mt-8 w-full text-center bg-green-500 text-white font-bold py-3 px-6 rounded-full cta-button"
                      onClick={(e) => handleNavClick(e, "#signup")}
                    >
                      选择专业版
                    </a>
                  </div>

                  {/* Enterprise */}
                  <div className="border border-gray-200 rounded-2xl p-8 flex flex-col bg-white">
                    <h3 className="text-2xl font-bold mb-2">企业版</h3>
                    <p className="text-gray-500 mb-6">为高校和求职机构定制</p>
                    <p className="text-4xl font-extrabold mb-6">联系我们</p>
                    <ul className="space-y-4 text-gray-600 flex-grow">
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> 专业版所有功能
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> 专属学生管理后台
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> 定制化求职数据报告
                      </li>
                      <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3" weight="fill" /> 专属客户成功经理
                      </li>
                    </ul>
                    <a
                      href="#signup"
                      className="nav-link mt-8 w-full text-center bg-gray-800 text-white font-bold py-3 px-6 rounded-full hover:bg-gray-900 transition-colors"
                      onClick={(e) => handleNavClick(e, "#signup")}
                    >
                      咨询详情
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Blog（求职干货） */}
        {currentPage === "blog" && (
          <div id="page-blog" className="page-content">
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">求职干货与行业洞察</h2>
                  <p className="text-gray-600">我们不仅仅提供工具，更提供策略和智慧，助你成为真正的职场精英。</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Post 1 */}
                  <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col">
                    <img
                      src="https://placehold.co/600x400/a7f3d0/1f2937?text=破冰邮件"
                      alt="文章封面 破冰邮件"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6 flex flex-col flex-grow">
                      <p className="text-sm text-gray-500 mb-2">求职技巧 · 5分钟阅读</p>
                      <h3 className="text-xl font-bold mb-4 flex-grow">如何写一封让CTO无法拒绝的"破冰"邮件？</h3>
                      <a href="#" className="text-green-600 font-bold hover:underline">
                        阅读更多 →
                      </a>
                    </div>
                  </div>

                  {/* Post 2 */}
                  <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col">
                    <img
                      src="https://placehold.co/600x400/fde68a/1f2937?text=融资信号"
                      alt="文章封面 融资信号"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6 flex flex-col flex-grow">
                      <p className="text-sm text-gray-500 mb-2">行业分析 · 8分钟阅读</p>
                      <h3 className="text-xl font-bold mb-4 flex-grow">
                        我们分析了100家A轮融资公司，它们的招聘信号是什么？
                      </h3>
                      <a href="#" className="text-green-600 font-bold hover:underline">
                        阅读更多 →
                      </a>
                    </div>
                  </div>

                  {/* Post 3 */}
                  <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col">
                    <img
                      src="https://placehold.co/600x400/bae6fd/1f2937?text=求职心态"
                      alt="文章封面 求职心态"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6 flex flex-col flex-grow">
                      <p className="text-sm text-gray-500 mb-2">心态建设 · 6分钟阅读</p>
                      <h3 className="text-xl font-bold mb-4 flex-grow">从"求职者"到"猎手"：你只需要转变一个观念</h3>
                      <a href="#" className="text-green-600 font-bold hover:underline">
                        阅读更多 →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 登录 */}
        {currentPage === "login" && (
          <div id="page-login" className="page-content">
            <section className="py-20">
              <div className="container mx-auto px-6">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">欢迎回来</h2>
                    <p className="text-gray-500 mt-2">登录以继续你的猎手之旅</p>
                  </div>
                  <form onSubmit={handleLoginSubmit}>
                    <div className="mb-6">
                      <label htmlFor="login-username" className="block text-gray-700 font-bold mb-2">
                        用户名
                      </label>
                      <input
                        type="text"
                        id="login-username"
                        name="login-username"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label htmlFor="login-password" className="block text-gray-700 font-bold mb-2">
                        密码
                      </label>
                      <input
                        type="password"
                        id="login-password"
                        name="login-password"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        required
                      />
                    </div>
                    {loginErr && <p className="text-sm text-red-600 mb-4">{loginErr}</p>}
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-full cta-button disabled:opacity-60"
                    >
                      {authLoading ? "登录中..." : "登录"}
                    </button>
                  </form>
                  <p className="text-center text-gray-500 mt-8">
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
              </div>
            </section>
          </div>
        )}

        {/* 注册 */}
        {currentPage === "signup" && (
          <div id="page-signup" className="page-content">
            <section className="py-20">
              <div className="container mx-auto px-6">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">开启你的猎手之旅</h2>
                    <p className="text-gray-500 mt-2">只需一步，即可解锁隐藏机会</p>
                  </div>
                  <form onSubmit={handleSignupSubmit}>
                    <div className="mb-6">
                      <label htmlFor="signup-name" className="block text-gray-700 font-bold mb-2">
                        昵称（作为用户名）
                      </label>
                      <input
                        type="text"
                        id="signup-name"
                        name="signup-name"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label htmlFor="signup-password" className="block text-gray-700 font-bold mb-2">
                        设置密码
                      </label>
                      <input
                        type="password"
                        id="signup-password"
                        name="signup-password"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        required
                      />
                    </div>
                    {signupErr && <p className="text-sm text-red-600 mb-4">{signupErr}</p>}
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-full cta-button disabled:opacity-60"
                    >
                      {authLoading ? "创建账户中..." : "创建账户"}
                    </button>
                  </form>
                  <p className="text-center text-gray-500 mt-8">
                    已经有账户了？{" "}
                    <a
                      href="#login"
                      className="text-green-600 font-bold hover:underline nav-link"
                      onClick={(e) => handleNavClick(e, "#login")}
                    >
                      直接登录
                    </a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 个人资料：简历上传 */}
        {currentPage === "profile" && (
          <div id="page-profile" className="page-content">
            <section className="py-16 bg-white">
              <div className="container mx-auto px-6 max-w-3xl">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800">个人资料</h2>
                  <p className="text-gray-500 mt-2">上传你的简历（.txt 或 .docx），我们将用于个性化破冰邮件</p>
                </div>

                {!user ? (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                    <p className="text-gray-700">你还未登录，请先登录或注册。</p>
                    <div className="mt-6 flex justify-center gap-4">
                      <a
                        href="#login"
                        className="px-6 py-2 rounded-full border border-gray-300 hover:bg-gray-100 nav-link"
                        onClick={(e) => handleNavClick(e, "#login")}
                      >
                        去登录
                      </a>
                      <a
                        href="#signup"
                        className="px-6 py-2 rounded-full bg-green-500 text-white cta-button nav-link"
                        onClick={(e) => handleNavClick(e, "#signup")}
                      >
                        免费注册
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-500 text-white font-bold text-lg">
                        {avatarInitial}
                      </span>
                      <div>
                        <p className="text-sm text-gray-500">用户名</p>
                        <p className="text-xl font-bold text-gray-800">{user.username}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">上传简历（.txt/.docx）</label>
                        <input
                          type="file"
                          accept=".txt,.docx"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) onResumeFileChosen(f)
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">简历文本预览（前 300 字）</p>
                        <div className="bg-gray-50 border rounded-lg p-3 text-sm max-h-40 overflow-auto">
                          {resumeText ? resumeText.slice(0, 300) + (resumeText.length > 300 ? "..." : "") : "尚未上传"}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <a
                          href="#bounty"
                          onClick={(e) => handleNavClick(e, "#bounty")}
                          className="px-5 py-2 rounded-full bg-green-500 text-white cta-button nav-link"
                        >
                          去机会雷达挑选
                        </a>
                      </div>
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
              <h4 className="font-bold mb-4">法律</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#terms" className="hover:text-white nav-link" onClick={(e) => handleNavClick(e, "#terms")}>
                    服务条款
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
            <p>{`© 2025 简历冲鸭. All Rights Reserved.`}</p>
          </div>
        </div>
      </footer>

      {/* 全局样式 */}
      <style jsx global>{`
        body {
          color: #1f2937;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-element {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .cta-button { transition: all 0.3s ease; }
        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px -10px rgba(76, 175, 80, 0.5);
        }
        .page-content { animation: fadeIn 0.5s ease-in-out; }
        .kanban-card {
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  )
}
