"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Noto_Sans_SC } from 'next/font/google'
import {
  List,
  Files,
  TreasureChest,
  Door,
  Quotes,
  RocketLaunch,
  PresentationChart,
  Lightbulb,
  UsersThree,
  ArrowRight,
  Anchor,
  MagicWand,
  CheckCircle,
} from "@phosphor-icons/react"

import { getSupabaseClient } from "@/lib/supabase-client"
import type { Task, TaskStatus } from "@/types/task"
import { demoTasksSeed, LS_KEY as LEGACY_LS_KEY } from "@/lib/demo-tasks"
import { fetchTasksForUser, signIn, signUp, updateTaskForUser, getLocalUser, setLocalUser, getLocalTasks, setLocalTasks } from "@/lib/auth"
import type { User } from "@/types/user"

const noto = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

type PageKey =
  | "home"
  | "radar"
  | "playbook"
  | "cockpit"
  | "pricing"
  | "blog"
  | "about"
  | "login"
  | "signup"
  | "terms"
  | "profile" // 新增

export default function Page() {
  const [currentPage, setCurrentPage] = useState<PageKey>("home")
  const [mobileOpen, setMobileOpen] = useState(false)

  // Home 内部锚点
  const featuresRef = useRef<HTMLElement | null>(null)
  const testimonialsRef = useRef<HTMLElement | null>(null)

  // Auth 状态
  const [user, setUser] = useState<User | null>(null)
  const supabase = getSupabaseClient()
  const [connOk, setConnOk] = useState<boolean | null>(null)
  const [connErr, setConnErr] = useState<string | null>(null)

  // Tasks 状态（登录后按用户加载）
  const [tasks, setTasks] = useState<Task[]>([])

  // 登录与注册表单状态
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [signupErr, setSignupErr] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  const validPages: Record<string, PageKey> = useMemo(
    () => ({
      home: "home",
      radar: "radar",
      playbook: "playbook",
      cockpit: "cockpit",
      pricing: "pricing",
      blog: "blog",
      about: "about",
      login: "login",
      signup: "signup",
      terms: "terms",
      profile: "profile", // 新增
      features: "home",
      testimonials: "home",
    }),
    []
  )

  const smoothScrollInsideHome = useCallback((id?: string | null) => {
    if (!id) return
    if (id === "features" && featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    if (id === "testimonials" && testimonialsRef.current) {
      testimonialsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
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
      if (scrollToId) {
        setTimeout(() => smoothScrollInsideHome(scrollToId), 100)
      } else {
        window.scrollTo({ top: 0 })
      }
    },
    [smoothScrollInsideHome, validPages]
  )

  // 初始化：根据 hash 加载页面；读取本地用户
  useEffect(() => {
    const initial = window.location.hash || "#home"
    showPage(initial)
    const u = getLocalUser()
    if (u) setUser(u)
  }, [showPage])

  // 支持浏览器前进/后退（hashchange）
  useEffect(() => {
    const handler = () => {
      const h = window.location.hash || "#home"
      showPage(h)
    }
    window.addEventListener("hashchange", handler)
    return () => window.removeEventListener("hashchange", handler)
  }, [showPage])

  // 淡入动画
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
      { threshold: 0.1 }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [currentPage])

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    href: string
  ) => {
    e.preventDefault()
    const scrollToId = e.currentTarget.getAttribute("data-scroll-to")
    showPage(href, scrollToId)
    if (mobileOpen) setMobileOpen(false)
  }

  // 连接检测（在 Cockpit 下进行）
  const checkConnection = useCallback(async () => {
    if (!supabase) throw new Error("缺少环境变量 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
    // 简单探测：查询一个轻量表（users 计数）
    const { error } = await supabase.from("users").select("id", { count: "exact", head: true })
    if (error) throw error
  }, [supabase])

  // 加载任务（优先云端，失败使用本地）
  const loadTasksForCurrentUser = useCallback(async () => {
    if (!user) return
    try {
      await checkConnection()
      setConnOk(true)
      setConnErr(null)
      const rows = await fetchTasksForUser(user.id)
      if (rows.length === 0) {
        // 无任务时用 demo 初始化（防御），插入到远端
        const col: Task[] = demoTasksSeed.map((t, idx) => ({
          id: `local-seed-${idx + 1}`, // 仅用于 UI；远端插入后会有 uuid
          title: t.title,
          status: t.status as TaskStatus,
          ord: t.ord,
          note: t.note ?? null,
          created_at: new Date().toISOString(),
        }))
        setTasks(col)
      } else {
        setTasks(rows)
      }
    } catch (err: any) {
      // 连接失败：local fallback（按用户隔离）
      setConnOk(false)
      setConnErr(err?.message ?? "连接 Supabase 失败")
      const local = getLocalTasks(user.id)
      if (local.length > 0) {
        setTasks(local)
      } else {
        const seeded: Task[] = demoTasksSeed.map((t, idx) => ({
          id: `local-${idx + 1}`,
          title: t.title,
          status: t.status as TaskStatus,
          ord: t.ord,
          note: t.note ?? null,
          created_at: new Date().toISOString(),
        }))
        setTasks(seeded)
        setLocalTasks(user.id, seeded)
      }
    }
  }, [user, checkConnection])

  // 切到 Cockpit 或登录状态变更时加载
  useEffect(() => {
    if (currentPage !== "cockpit") return
    if (!user) {
      // 若之前遗留了旧版全局 demo，本地清理避免干扰
      try { localStorage.removeItem(LEGACY_LS_KEY) } catch {}
      setTasks([])
      // 仍检查连接以显示状态
      ;(async () => {
        try {
          await checkConnection()
          setConnOk(true)
          setConnErr(null)
        } catch (e: any) {
          setConnOk(false)
          setConnErr(e?.message ?? "连接 Supabase 失败")
        }
      })()
      return
    }
    loadTasksForCurrentUser()
  }, [currentPage, user, loadTasksForCurrentUser, checkConnection])

  // 登录提交
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthLoading(true)
    setLoginErr(null)
    const form = new FormData(e.currentTarget)
    const username = String(form.get("login-username") ?? "").trim()
    const password = String(form.get("login-password") ?? "")
    try {
      const u = await signIn(username, password)
      setUser(u)
      setLocalUser(u)
      showPage("#cockpit")
    } catch (err: any) {
      setLoginErr(err?.message ?? "登录失败")
    } finally {
      setAuthLoading(false)
    }
  }

  // 注册提交
  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthLoading(true)
    setSignupErr(null)
    const form = new FormData(e.currentTarget)
    const username = String(form.get("signup-name") ?? "").trim()
    const email = String(form.get("signup-email") ?? "").trim() // 仅展示，不入库
    const password = String(form.get("signup-password") ?? "")
    if (!username || !password) {
      setSignupErr("请输入昵称（作为用户名）与密码")
      setAuthLoading(false)
      return
    }
    try {
      const u = await signUp(username, password)
      setUser(u)
      setLocalUser(u)
      showPage("#cockpit")
    } catch (err: any) {
      setSignupErr(err?.message ?? "注册失败")
    } finally {
      setAuthLoading(false)
    }
  }

  // 任务交互：切换到下一状态并保存
  const nextStatusOf = (s: TaskStatus): TaskStatus => {
    const order: TaskStatus[] = ["pool", "sent", "replied", "interview"]
    const i = order.indexOf(s)
    return order[(i + 1) % order.length]
  }

  const handleTaskClick = async (task: Task) => {
    if (!user) return
    const newStatus = nextStatusOf(task.status)
    const colTasks = tasks.filter((t) => t.status === newStatus)
    const newOrd = (colTasks[colTasks.length - 1]?.ord ?? 0) + 1

    const prev = tasks
    const optimistic = prev.map((t) => (t.id === task.id ? { ...t, status: newStatus, ord: newOrd } : t))
    setTasks(optimistic)

    if (connOk) {
      try {
        await updateTaskForUser(task.id, { status: newStatus, ord: newOrd })
      } catch (e: any) {
        setTasks(prev)
        setConnErr(`保存失败：${e?.message ?? "未知错误"}`)
      }
    } else {
      setLocalTasks(user.id, optimistic)
    }
  }

  // 渲染辅助
  const renderKanbanColumn = (title: string, status: TaskStatus, bgClass: string) => {
    const column = [...tasks.filter((t) => t.status === status)].sort((a, b) => a.ord - b.ord)
    return (
      <div className="flex flex-col">
        <h4 className="font-bold p-2 text-center text-gray-700">{title}</h4>
        <div className={`space-y-3 p-2 rounded-lg ${bgClass} flex-grow`}>
          {column.map((t) => (
            <div
              key={t.id}
              className="bg-white p-3 rounded-md kanban-card cursor-pointer"
              onClick={() => handleTaskClick(t)}
              role="button"
              aria-label={`任务：${t.title}（点击切换状态）`}
              title="点击切换到下一列并保存"
            >
              {t.title}
              {t.note ? <p className="text-xs text-red-500 mt-1">{t.note}</p> : null}
            </div>
          ))}
          {column.length === 0 && (
            <div className="text-xs text-gray-500 px-2 py-1">暂无任务</div>
          )}
        </div>
      </div>
    )
  }

  // 表单提交（用于首页订阅模拟）
  const onSubmitAlert = (msg: string) => (e: React.FormEvent) => {
    e.preventDefault()
    alert(msg)
  }

  const avatarInitial = (user?.username?.[0] || "U").toUpperCase()

  const handleLogout = () => {
    try {
      setLocalUser(null)
    } catch {}
    setUser(null)
    setTasks([])
    showPage("#home")
  }

  useEffect(() => {
    if (currentPage !== "cockpit") return
    if (!user) {
      // 若之前遗留了旧版全局 demo，本地清理避免干扰
      try { localStorage.removeItem(LEGACY_LS_KEY) } catch {}
      setTasks([])
      // 仍检查连接以显示状态
      ;(async () => {
        try {
          await checkConnection()
          setConnOk(true)
          setConnErr(null)
        } catch (e: any) {
          setConnOk(false)
          setConnErr(e?.message ?? "连接 Supabase 失败")
        }
      })()
      return
    }
    loadTasksForCurrentUser()
  }, [currentPage, user, loadTasksForCurrentUser, checkConnection])

  useEffect(() => {
    if (currentPage !== "profile") return
    if (!user) return
    // 如果还没有任务数据，尝试加载（与 Cockpit 同步）
    if (tasks.length === 0) {
      ;(async () => {
        try {
          // 复用连接检查 & 加载逻辑
          if (checkConnection) {
            await checkConnection()
            setConnOk(true)
            setConnErr(null)
          }
          const rows = await fetchTasksForUser(user.id)
          if (rows.length > 0) setTasks(rows)
        } catch (e: any) {
          setConnOk(false)
          setConnErr(e?.message ?? "连接 Supabase 失败")
        }
      })()
    }
  }, [currentPage, user, tasks.length, checkConnection])

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
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#home"
              data-scroll-to="features"
              className="text-gray-600 hover:text-green-500 transition-colors nav-link"
              onClick={(e) => handleNavClick(e, "#home")}
            >
              产品功能
            </a>
            <a
              href="#pricing"
              className="text-gray-600 hover:text-green-500 transition-colors nav-link"
              onClick={(e) => handleNavClick(e, "#pricing")}
            >
              定价
            </a>
            <a
              href="#blog"
              className="text-gray-600 hover:text-green-500 transition-colors nav-link"
              onClick={(e) => handleNavClick(e, "#blog")}
            >
              求职干货
            </a>
            <a
              href="#about"
              className="text-gray-600 hover:text-green-500 transition-colors nav-link"
              onClick={(e) => handleNavClick(e, "#about")}
            >
              关于我们
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <a
                href="#profile"
                className="nav-link flex items-center"
                onClick={(e) => handleNavClick(e, "#profile")}
                aria-label="个人主页"
                title="个人主页"
              >
                <span
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-green-500 text-white font-bold"
                >
                  {avatarInitial}
                </span>
              </a>
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
          <a
            href="#home"
            data-scroll-to="features"
            className="block py-2 text-gray-600 hover:text-green-500 nav-link"
            onClick={(e) => handleNavClick(e, "#home")}
          >
            产品功能
          </a>
          <a
            href="#pricing"
            className="block py-2 text-gray-600 hover:text-green-500 nav-link"
            onClick={(e) => handleNavClick(e, "#pricing")}
          >
            定价
          </a>
          <a
            href="#blog"
            className="block py-2 text-gray-600 hover:text-green-500 nav-link"
            onClick={(e) => handleNavClick(e, "#blog")}
          >
            求职干货
          </a>
          <a
            href="#about"
            className="block py-2 text-gray-600 hover:text-green-500 nav-link"
            onClick={(e) => handleNavClick(e, "#about")}
          >
            关于我们
          </a>
          <div className="mt-4 border-t pt-4 space-y-2">
            {user ? (
              <a
                href="#profile"
                className="block text-center text-gray-600 hover:text-green-500 nav-link"
                onClick={(e) => handleNavClick(e, "#profile")}
              >
                个人主页
              </a>
            ) : (
              <>
                <a
                  href="#login"
                  className="block text-center text-gray-600 hover:text-green-500 nav-link"
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
        {/* Home */}
        {currentPage === "home" && (
          <div id="page-home" className="page-content">
            <section className="hero-gradient py-20 md:py-32">
              <div className="container mx-auto px-6 text-center">
                <div className="max-w-3xl mx-auto">
                  <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                    别再海投，我们教你<span className="text-green-500">狙击</span>。
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 mb-10">
                    专为应届生打造的主动求职情报平台，AI为你挖掘被巨头忽略的“隐藏机会”。
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

            <section className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                    50份简历石沉大海，问题出在哪？
                  </h2>
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
                    <p className="text-gray-500">除了大厂，那些高速成长的“潜力股”在哪？</p>
                  </div>

                  <div className="text-center p-8 border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex justify-center items-center mb-6 w-16 h-16 mx-auto bg-blue-100 rounded-full">
                      <Door size={32} className="text-blue-500" weight="bold" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">主动出击，不知如何开口</h3>
                    <p className="text-gray-500">找到邮箱却写不出第一句话，害怕成为“骚扰邮件”。</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="features" ref={featuresRef} className="py-20">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">从“求职者”到“机会猎手”</h2>
                  <p className="text-gray-600">“简历冲鸭”如何将你武装到牙齿，精准捕捉每一个机会。</p>
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
                        7x24小时扫描融资新闻、行业峰会、项目发布，为你预测“即将”出现的招聘需求。不再错过任何一个潜力机会。
                      </p>
                      <a
                        href="#radar"
                        className="nav-link font-bold text-green-600 hover:underline"
                        onClick={(e) => handleNavClick(e, "#radar")}
                      >
                        了解雷达如何工作 →
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
                        href="#playbook"
                        className="nav-link font-bold text-yellow-600 hover:underline"
                        onClick={(e) => handleNavClick(e, "#playbook")}
                      >
                        查看AI如何生成策略 →
                      </a>
                    </div>
                  </div>

                  {/* item 03 */}
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="md:w-1/2 p-8 bg-white rounded-2xl shadow-lg">
                      <img
                        src="https://placehold.co/600x400/60a5fa/ffffff?text=行动指挥室UI"
                        alt="行动指挥室UI界面"
                        className="rounded-lg w-full"
                      />
                    </div>
                    <div className="md:w-1/2">
                      <span className="text-blue-500 font-bold">03</span>
                      <h3 className="text-2xl font-bold mt-2 mb-4">一站式行动管理</h3>
                      <p className="text-gray-600 mb-6">
                        管理你的每一次“狙击”，追踪状态，复盘数据，让求职像打游戏一样有反馈，持续优化策略。
                      </p>
                      <a
                        href="#cockpit"
                        className="nav-link font-bold text-blue-600 hover:underline"
                        onClick={(e) => handleNavClick(e, "#cockpit")}
                      >
                        探索你的指挥室 →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section id="testimonials" ref={testimonialsRef} className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">他们已经成功“破冰”</h2>
                  <p className="text-gray-600">听听第一批“猎手”怎么说。</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                    <p className="text-gray-600 mb-6">
                      “通过‘冲鸭’发现一家刚融资的AI公司，用它生成的邮件联系了CTO，三天后就收到了面试邀请，太神奇了！”
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
                      “文科生找工作太难了！‘冲鸭’帮我定位了几家快速扩张的新消费品牌，并指导我如何展示策划能力，最终成功入职！”
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
                      “以前总觉得毛遂自荐很掉价，用了这个才发现，精准的主动出击比海投有效100倍。已经拿到了3个隐藏offer。”
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

            <section className="bg-green-600 text-white">
              <div className="container mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">你的下一个机会，不在招聘网站上。</h2>
                <p className="text-lg text-green-100 mb-10 max-w-2xl mx-auto">
                  立即加入，解锁那些专属于“猎手”的求职机会。
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

        {/* Radar */}
        {currentPage === "radar" && (
          <div id="page-radar" className="page-content">
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-12">
                    <a
                      href="#home"
                      data-scroll-to="features"
                      className="nav-link text-gray-500 hover:text-green-600 transition-colors"
                      onClick={(e) => handleNavClick(e, "#home")}
                    >
                      ← 返回产品功能
                    </a>
                  </div>

                  <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">AI驱动的机会雷达</h2>
                    <p className="text-lg text-gray-600">
                      我们的情报引擎，为你揭示隐藏在海量信息下的真实机会。
                    </p>
                  </div>

                  {/* 信号源 */}
                  <div className="mb-20">
                    <h3 className="text-2xl font-bold text-center mb-10">第一步：捕捉全网的增长信号</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <RocketLaunch size={40} className="text-green-500 mb-4 inline-block" weight="bold" />
                        <h4 className="font-bold text-lg mb-2">资金动向</h4>
                        <p className="text-sm text-gray-500">监控融资新闻，刚拿到钱的公司大概率要招人。</p>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <PresentationChart size={40} className="text-blue-500 mb-4 inline-block" weight="bold" />
                        <h4 className="font-bold text-lg mb-2">行业动态</h4>
                        <p className="text-sm text-gray-500">抓取峰会赞助商，积极分享的公司正在扩张。</p>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <Lightbulb size={40} className="text-yellow-500 mb-4 inline-block" weight="bold" />
                        <h4 className="font-bold text-lg mb-2">产品发布</h4>
                        <p className="text-sm text-gray-500">新项目上线，需要人来维护和迭代。</p>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <UsersThree size={40} className="text-purple-500 mb-4 inline-block" weight="bold" />
                        <h4 className="font-bold text-lg mb-2">人才流动</h4>
                        <p className="text-sm text-gray-500">分析人才洼地，发现新兴的热门公司。</p>
                      </div>
                    </div>
                  </div>

                  {/* AI处理 */}
                  <div className="mb-20 text-center">
                    <h3 className="text-2xl font-bold text-center mb-10">第二步：AI大脑进行深度处理</h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                      <div className="p-4 bg-white rounded-lg shadow-md">信息抽取</div>
                      <ArrowRight size={24} className="text-gray-400" />
                      <div className="p-4 bg-white rounded-lg shadow-md">需求预测</div>
                      <ArrowRight size={24} className="text-gray-400" />
                      <div className="p-4 bg-white rounded-lg shadow-md">关键人链接</div>
                    </div>
                  </div>

                  {/* 呈现方式 */}
                  <div>
                    <h3 className="text-2xl font-bold text-center mb-10">第三步：每日推送高价值机会卡片</h3>
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto">
                      <div className="flex items-start gap-6">
                        <img
                          src="https://placehold.co/80x80/1f2937/ffffff?text=AI"
                          alt="公司Logo"
                          className="rounded-lg w-20 h-20 flex-shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-xl mb-1">奇点无限科技</h4>
                          <p className="text-sm text-gray-500 mb-4">A轮融资 | 人工智能 | 北京</p>
                          <p className="text-gray-700 mb-4">
                            <b>机会解读：</b>该公司上周刚宣布完成5000万A轮融资，领投方为红杉资本。其官网发布了新产品“AI-Writer 2.0”，我们预测其正在大量招聘NLP算法工程师和产品经理。
                          </p>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="font-bold text-green-800">关键人物链接 ↓</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <p>
                                王总 (CTO) - <span className="text-green-600">触达成功率: 85%</span>
                              </p>
                              <a href="#" className="text-blue-600 hover:underline">
                                LinkedIn
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Playbook */}
        {currentPage === "playbook" && (
          <div id="page-playbook" className="page-content">
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="max-w-5xl mx-auto">
                  <div className="mb-12">
                    <a
                      href="#home"
                      data-scroll-to="features"
                      className="nav-link text-gray-500 hover:text-yellow-600 transition-colors"
                      onClick={(e) => handleNavClick(e, "#home")}
                    >
                      ← 返回产品功能
                    </a>
                  </div>

                  <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">AIGC生成破冰弹药</h2>
                    <p className="text-lg text-gray-600">
                      告别求职信写作困难，让AI成为你的专属沟通策略师。
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* 左：价值锚点建议 */}
                    <div className="bg-gray-50 p-8 rounded-2xl">
                      <h3 className="text-xl font-bold mb-6 flex items-center">
                        <Anchor size={22} className="text-yellow-500 mr-3" weight="bold" />
                        AI的“价值锚点”建议
                      </h3>
                      <p className="text-gray-600 mb-4">
                        根据你的简历和目标公司“奇点无限”，我们建议你在邮件中突出以下几点：
                      </p>
                      <ul className="space-y-3 list-disc list-inside text-gray-700">
                        <li>你在“校园黑客松”中用Transformer模型构建聊天机器人的项目经历。</li>
                        <li>
                          你对大语言模型(LLM)伦理问题的深入思考（可结合其产品“AI-Writer”）。
                        </li>
                        <li>熟练使用Python, PyTorch, 和Hugging Face库。</li>
                      </ul>
                    </div>

                    {/* 右：个性化内容生成 */}
                    <div className="bg-white p-8 rounded-2xl shadow-2xl">
                      <h3 className="text-xl font-bold mb-6 flex items-center">
                        <MagicWand size={22} className="text-yellow-500 mr-3" weight="bold" />
                        AIGC生成个性化邮件
                      </h3>
                      <p className="text-gray-600 mb-4">选择一个场景，AI将为你生成邮件草稿：</p>
                      <div className="flex gap-2 mb-4">
                        <button className="bg-yellow-500 text-white px-3 py-1 text-sm rounded-full">融资场景</button>
                        <button className="bg-gray-200 text-gray-700 px-3 py-1 text-sm rounded-full">峰会场景</button>
                      </div>
                      <div className="bg-gray-800 text-white p-6 rounded-lg font-mono text-sm leading-relaxed">
                        <p>
                          <span className="text-gray-400">主题：</span>{" "}
                          <span className="text-yellow-300">祝贺完成A轮融资 - 一位对NLP充满热情的求职者</span>
                        </p>
                        <br />
                        <p>尊敬的王总，</p>
                        <p>您好！</p>
                        <br />
                        <p>
                          我从36氪上了解到贵公司“奇点无限”刚刚完成了5000万的A轮融资，并发布了令人印象深刻的“AI-Writer 2.0”，由衷地祝贺！
                        </p>
                        <br />
                        <p>
                          贵公司在NLP领域的探索，特别是对AIGC应用的专注，与我个人的技术热情和项目经验高度契合。我曾在校园黑客松中，独立使用Transformer模型构建了一个...{" "}
                          <span className="text-gray-400">[此处插入价值锚点1]</span>
                        </p>
                        <br />
                        <p>附件是我的简历，期待有机会能为“奇点无限”的下一个里程碑贡献力量！</p>
                        <br />
                        <p>祝好，</p>
                        <p>[你的名字]</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Cockpit */}
        {currentPage === "cockpit" && (
          <div id="page-cockpit" className="page-content">
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                  <div className="mb-12">
                    <a
                      href="#home"
                      data-scroll-to="features"
                      className="nav-link text-gray-500 hover:text-blue-600 transition-colors"
                      onClick={(e) => handleNavClick(e, "#home")}
                    >
                      ← 返回产品功能
                    </a>
                  </div>

                  <div className="text-center mb-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">一站式行动指挥室</h2>
                    <p className="text-lg text-gray-600">
                      将混乱的求职过程，变为清晰、高效、可复盘的行动项目。
                    </p>
                    {/* 连接状态提示 */}
                    {connOk === true && (
                      <p className="mt-3 text-sm text-green-600">已成功链接云端数据（Supabase）</p>
                    )}
                    {connOk === false && (
                      <p className="mt-3 text-sm text-red-600">
                        云端连接失败：{connErr || "未知错误"}（已使用本地存储演示）
                      </p>
                    )}
                    {/* 登录状态提示 */}
                    {!user && (
                      <p className="mt-2 text-sm text-gray-500">
                        当前未登录，请先
                        {" "}
                        <a href="#login" className="text-blue-600 hover:underline nav-link" onClick={(e) => handleNavClick(e, "#login")}>
                          登录
                        </a>
                        {" "}
                        或
                        {" "}
                        <a href="#signup" className="text-blue-600 hover:underline nav-link" onClick={(e) => handleNavClick(e, "#signup")}>
                          注册
                        </a>
                        。
                      </p>
                    )}
                  </div>

                  {/* 任务管理看板（未登录时不展示） */}
                  {user ? (
                    <div className="mb-20">
                      <h3 className="text-2xl font-bold text-center mb-10">
                        任务管理：像玩游戏一样追踪你的“狙击”
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-2xl">
                        {renderKanbanColumn("机会池 (5)", "pool", "bg-gray-200")}
                        {renderKanbanColumn("已发送 (3)", "sent", "bg-blue-100")}
                        {renderKanbanColumn("已回复 (1)", "replied", "bg-yellow-100")}
                        {renderKanbanColumn("面试/Offer (1)", "interview", "bg-green-100")}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-20">
                      <div className="max-w-2xl mx-auto bg-gray-50 border border-gray-200 p-8 rounded-2xl text-center">
                        <p className="text-gray-700">登录后即可查看与你账号关联的任务与完成情况。</p>
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
                    </div>
                  )}

                  {/* 数据看板（保持原样，仅展示静态示意） */}
                  <div>
                    <h3 className="text-2xl font-bold text-center mb-10">
                      数据看板：用数据复盘和优化你的策略
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h4 className="font-bold mb-4">求职漏斗</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <p>狙击次数</p>
                            <p>10</p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "100%" }} />
                          </div>

                          <div className="flex justify-between items-center">
                            <p>回复率</p>
                            <p>40%</p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "40%" }} />
                          </div>

                          <div className="flex justify-between items-center">
                            <p>面试转化率</p>
                            <p>20%</p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "20%" }} />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h4 className="font-bold mb-4">机会来源分析</h4>
                        <img
                          src="https://placehold.co/600x300/f3f4f6/ffffff?text=来源分析饼图"
                          alt="机会来源分析图"
                          className="w-full rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Pricing */}
        {currentPage === "pricing" && (
          <div id="page-pricing" className="page-content">
            <section className="py-20">
              <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">选择适合你的计划</h2>
                  <p className="text-gray-600">我们提供灵活的方案，助力你求职之路的每一步。从免费开始，随时升级。</p>
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
                      href="#about"
                      className="nav-link mt-8 w-full text-center bg-gray-800 text-white font-bold py-3 px-6 rounded-full hover:bg-gray-900 transition-colors"
                      onClick={(e) => handleNavClick(e, "#about")}
                    >
                      咨询详情
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Blog */}
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
                      <h3 className="text-xl font-bold mb-4 flex-grow">如何写一封让CTO无法拒绝的“破冰”邮件？</h3>
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
                      <h3 className="text-xl font-bold mb-4 flex-grow">从“求职者”到“猎手”：你只需要转变一个观念</h3>
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

        {/* About */}
        {currentPage === "about" && (
          <div id="page-about" className="page-content">
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">关于我们</h2>
                    <p className="text-lg text-gray-600">一群相信“主动出击”的理想主义者</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-8 md:p-12 text-center shadow-inner">
                    <Quotes size={48} className="text-green-400 mb-6 inline-block" weight="bold" />
                    <p className="text-xl md:text-2xl leading-relaxed text-gray-700">
                      我们致力于用技术打破求职信息壁垒，赋能每一个不愿平庸、渴望通过自身努力创造机会的你。我们相信，最好的机会不是等来的，而是被创造出来的。“简历冲鸭”就是你创造机会的第一个伙伴。
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Login */}
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
                    <div className="text-right mb-6">
                      <a href="#" className="text-sm text-green-600 hover:underline">
                        忘记密码?
                      </a>
                    </div>
                    <button type="submit" disabled={authLoading} className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-full cta-button disabled:opacity-60">
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

        {/* Signup */}
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
                      <label htmlFor="signup-email" className="block text-gray-700 font-bold mb-2">
                        邮箱地址（演示用）
                      </label>
                      <input
                        type="email"
                        id="signup-email"
                        name="signup-email"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
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
                    <div className="mb-6">
                      <label className="flex items-center text-gray-600">
                        <input type="checkbox" className="form-checkbox h-5 w-5 text-green-600" defaultChecked />
                        <span className="ml-2">
                          我已阅读并同意
                          <a
                            href="#terms"
                            className="text-green-600 hover:underline nav-link"
                            onClick={(e) => handleNavClick(e, "#terms")}
                          >
                            服务条款
                          </a>
                        </span>
                      </label>
                    </div>
                    {signupErr && <p className="text-sm text-red-600 mb-4">{signupErr}</p>}
                    <button type="submit" disabled={authLoading} className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-full cta-button disabled:opacity-60">
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

        {/* Terms */}
        {currentPage === "terms" && (
          <div id="page-terms" className="page-content">
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6 max-w-3xl">
                <h2 className="text-3xl font-bold mb-8 text-center">服务条款</h2>
                <div className="prose lg:prose-xl max-w-none text-gray-700">
                  <p>欢迎使用“简历冲鸭”！本服务条款是您与我们之间关于使用本服务的协议。请仔细阅读。</p>
                  <h3>1. 服务内容</h3>
                  <p>
                    我们提供一个主动求职情报平台，通过AI技术帮助用户发现潜在的就业机会并提供沟通策略支持。所有功能和服务均受本条款约束。
                  </p>
                  <p>...</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Profile */}
        {currentPage === "profile" && (
          <div id="page-profile" className="page-content">
            <section className="py-20 bg-white">
              <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">个人主页</h2>
                    <p className="text-gray-500 mt-2">查看你的账户信息与任务概览</p>
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

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">机会池</p>
                          <p className="text-2xl font-bold">
                            {tasks.filter(t => t.status === "pool").length}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">已发送</p>
                          <p className="text-2xl font-bold">
                            {tasks.filter(t => t.status === "sent").length}
                          </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">已回复</p>
                          <p className="text-2xl font-bold">
                            {tasks.filter(t => t.status === "replied").length}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">面试/Offer</p>
                          <p className="text-2xl font-bold">
                            {tasks.filter(t => t.status === "interview").length}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                          {connOk === true ? "云端已连接" : connOk === false ? "云端未连接（可能使用本地数据）" : ""}
                        </p>
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-100"
                          aria-label="退出登录"
                        >
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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
                    功能
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
                  <a
                    href="#home"
                    data-scroll-to="testimonials"
                    className="hover:text-white nav-link"
                    onClick={(e) => handleNavClick(e, "#home")}
                  >
                    成功案例
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">公司</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#about"
                    className="hover:text-white nav-link"
                    onClick={(e) => handleNavClick(e, "#about")}
                  >
                    关于我们
                  </a>
                </li>
                <li>
                  <a
                    href="#blog"
                    className="hover:text-white nav-link"
                    onClick={(e) => handleNavClick(e, "#blog")}
                  >
                    博客
                  </a>
                </li>
                <li>
                  <a
                    href="#about"
                    className="hover:text-white nav-link"
                    onClick={(e) => handleNavClick(e, "#about")}
                  >
                    联系我们
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">法律</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    隐私政策
                  </a>
                </li>
                <li>
                  <a
                    href="#terms"
                    className="hover:text-white nav-link"
                    onClick={(e) => handleNavClick(e, "#terms")}
                  >
                    服务条款
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
            <p>{`© 2025 简历冲鸭. All Rights Reserved. (为一个求职项目创建)`}</p>
          </div>
        </div>
      </footer>

      {/* 全局样式（迁移自你的 <style>） */}
      <style jsx global>{`
        body {
          color: #1f2937;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in-element {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .cta-button {
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px -10px rgba(76, 175, 80, 0.5);
        }
        .page-content {
          animation: fadeIn 0.5s ease-in-out;
        }
        .kanban-card {
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  )
}
