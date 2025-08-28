"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Noto_Sans_SC } from "next/font/google"
import { Menu, FileText, Gem, DoorOpen, BarChart3, Lightbulb, Users, Info, RefreshCw, Calculator } from "lucide-react"

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

import type { OpportunityEnhanced } from "@/types/opportunity-enhanced"
import { OpportunityCardEnhanced } from "@/components/opportunity-card-enhanced"
import { OpportunityFilters } from "@/components/opportunity-filters"
import {
  fetchEnhancedOpportunities,
  searchEnhancedOpportunities,
  getLocalEnhancedOpportunities,
  getOpportunityStatistics,
} from "@/lib/opportunities-enhanced-api"

// 配置字体，禁用预加载以避免警告
const noto = Noto_Sans_SC({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700"],
  preload: false, // 禁用预加载以避免警告
  display: 'swap' // 使用 swap 显示策略
})

type PageKey =
  | "home"
  | "bounty" // 机会雷达
  | "forge" // 破冰工坊
  | "resume-optimizer" // 简历优化
  | "scraper" // 网页爬虫（管理员）
  | "opportunity-manager" // 机会管理（管理员）
  | "pricing" // 定价
  | "blog"
  | "login"
  | "signup"
  | "terms"
  | "profile"
  | "personal-filter" // 个人筛选页

const ADMIN_OPPORTUNITIES_KEY = "admin-opportunities"

// 城市数据列表
const CITIES_DATA = [
  // 直辖市
  { name: '北京', pinyin: 'beijing', short: 'bj' },
  { name: '上海', pinyin: 'shanghai', short: 'sh' },
  { name: '天津', pinyin: 'tianjin', short: 'tj' },
  { name: '重庆', pinyin: 'chongqing', short: 'cq' },
  
  // 省会城市
  { name: '广州', pinyin: 'guangzhou', short: 'gz' },
  { name: '深圳', pinyin: 'shenzhen', short: 'sz' },
  { name: '杭州', pinyin: 'hangzhou', short: 'hz' },
  { name: '南京', pinyin: 'nanjing', short: 'nj' },
  { name: '武汉', pinyin: 'wuhan', short: 'wh' },
  { name: '成都', pinyin: 'chengdu', short: 'cd' },
  { name: '西安', pinyin: 'xian', short: 'xa' },
  { name: '郑州', pinyin: 'zhengzhou', short: 'zz' },
  { name: '济南', pinyin: 'jinan', short: 'jn' },
  { name: '青岛', pinyin: 'qingdao', short: 'qd' },
  { name: '大连', pinyin: 'dalian', short: 'dl' },
  { name: '沈阳', pinyin: 'shenyang', short: 'sy' },
  { name: '长春', pinyin: 'changchun', short: 'cc' },
  { name: '哈尔滨', pinyin: 'haerbin', short: 'heb' },
  { name: '石家庄', pinyin: 'shijiazhuang', short: 'sjz' },
  { name: '太原', pinyin: 'taiyuan', short: 'ty' },
  { name: '呼和浩特', pinyin: 'huhehaote', short: 'hhht' },
  { name: '长沙', pinyin: 'changsha', short: 'cs' },
  { name: '南昌', pinyin: 'nanchang', short: 'nc' },
  { name: '合肥', pinyin: 'hefei', short: 'hf' },
  { name: '福州', pinyin: 'fuzhou', short: 'fz' },
  { name: '厦门', pinyin: 'xiamen', short: 'xm' },
  { name: '南宁', pinyin: 'nanning', short: 'nn' },
  { name: '海口', pinyin: 'haikou', short: 'hk' },
  { name: '昆明', pinyin: 'kunming', short: 'km' },
  { name: '贵阳', pinyin: 'guiyang', short: 'gy' },
  { name: '拉萨', pinyin: 'lasa', short: 'ls' },
  { name: '兰州', pinyin: 'lanzhou', short: 'lz' },
  { name: '西宁', pinyin: 'xining', short: 'xn' },
  { name: '银川', pinyin: 'yinchuan', short: 'yc' },
  { name: '乌鲁木齐', pinyin: 'wulumuqi', short: 'wlmq' },
  
  // 其他重要城市
  { name: '苏州', pinyin: 'suzhou', short: 'sz' },
  { name: '无锡', pinyin: 'wuxi', short: 'wx' },
  { name: '宁波', pinyin: 'ningbo', short: 'nb' },
  { name: '温州', pinyin: 'wenzhou', short: 'wz' },
  { name: '佛山', pinyin: 'foshan', short: 'fs' },
  { name: '东莞', pinyin: 'dongguan', short: 'dg' },
  { name: '珠海', pinyin: 'zhuhai', short: 'zh' },
  { name: '中山', pinyin: 'zhongshan', short: 'zs' },
  { name: '惠州', pinyin: 'huizhou', short: 'huiz' },
  { name: '常州', pinyin: 'changzhou', short: 'cz' },
  { name: '徐州', pinyin: 'xuzhou', short: 'xz' },
  { name: '扬州', pinyin: 'yangzhou', short: 'yz' },
  { name: '泰州', pinyin: 'taizhou', short: 'tz' },
  { name: '嘉兴', pinyin: 'jiaxing', short: 'jx' },
  { name: '金华', pinyin: 'jinhua', short: 'jh' },
  { name: '绍兴', pinyin: 'shaoxing', short: 'sx' },
  { name: '台州', pinyin: 'taizhou', short: 'tzh' },
  { name: '烟台', pinyin: 'yantai', short: 'yt' },
  { name: '潍坊', pinyin: 'weifang', short: 'wf' },
  { name: '临沂', pinyin: 'linyi', short: 'ly' },
  { name: '淄博', pinyin: 'zibo', short: 'zb' },
  { name: '威海', pinyin: 'weihai', short: 'wh' },
  { name: '全国', pinyin: 'quanguo', short: 'qg' }
]

export default function Page() {
  const [currentPage, setCurrentPage] = useState<PageKey>("home")
  const [previousPage, setPreviousPage] = useState<PageKey>("home")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

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
  
  // 定位筛选完成状态
  const [hasCompletedFilter, setHasCompletedFilter] = useState<boolean>(false)
  const [originalDestination, setOriginalDestination] = useState<string>('#bounty')

  // 破冰工坊上下文
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [resumeText, setResumeText] = useState<string | null>(null)
  
  // 邮件生成相关状态
  const [mailSubject, setMailSubject] = useState("")
  const [mailBody, setMailBody] = useState("")
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState<string | null>(null)
  
  // 简历优化相关状态
  const [resumeOptimizationReport, setResumeOptimizationReport] = useState<any>(null)
  const [resumeReportTitle, setResumeReportTitle] = useState("")
  const [resumeReportContent, setResumeReportContent] = useState("")

  // 格式化简历优化报告为可读文本
  const formatResumeOptimizationReport = (report: any) => {
    if (!report) return "报告数据无效"
    
    let formattedText = "# 简历优化报告\n\n"
    
    // 1. 量化评估诊断
    if (report.quantitativeAssessment) {
      formattedText += "## 📊 量化评估诊断\n\n"
      formattedText += `**总体评分：** ${report.quantitativeAssessment.totalScore || '待评估'}/100\n\n`
      
      if (report.quantitativeAssessment.dimensionScores) {
        formattedText += "**各维度得分：**\n"
        Object.entries(report.quantitativeAssessment.dimensionScores).forEach(([dimension, scoreData]: [string, any]) => {
          formattedText += `- **${dimension}：** ${scoreData.score}/${scoreData.maxScore} - ${scoreData.reason}\n`
        })
        formattedText += "\n"
      }
    }
    
    // 2. 分维度优化建议
    if (report.dimensionalOptimization) {
      formattedText += "## 🎯 分维度优化建议\n\n"
      Object.entries(report.dimensionalOptimization).forEach(([dimension, advice]: [string, any]) => {
        formattedText += `### ${dimension}\n`
        
        // 处理数组格式的建议
        if (Array.isArray(advice)) {
          formattedText += `**优化建议：**\n`
          advice.forEach((suggestion: string) => {
            formattedText += `- ${suggestion}\n`
          })
        }
        // 处理对象格式的建议（兼容旧格式）
        else if (typeof advice === 'object' && advice !== null) {
          if (advice.currentStatus) {
            formattedText += `**现状分析：** ${advice.currentStatus}\n`
          }
          if (advice.suggestions && advice.suggestions.length > 0) {
            formattedText += `**优化建议：**\n`
            advice.suggestions.forEach((suggestion: string) => {
              formattedText += `- ${suggestion}\n`
            })
          }
          if (advice.priority) {
            formattedText += `**优先级：** ${advice.priority}\n`
          }
        }
        // 处理字符串格式的建议
        else if (typeof advice === 'string') {
          formattedText += `**优化建议：** ${advice}\n`
        }
        
        formattedText += "\n"
      })
    }
    
    // 3. 核心描述改写
    if (report.coreDescriptionRewrite && report.coreDescriptionRewrite.length > 0) {
      formattedText += "## ✏️ 核心描述改写（STAR法则）\n\n"
      report.coreDescriptionRewrite.forEach((rewrite: any, index: number) => {
        formattedText += `### 改写示例 ${index + 1}\n`
        if (rewrite.type) {
          formattedText += `**类型：** ${rewrite.type}\n\n`
        }
        formattedText += `**优化前：**\n${rewrite.original || rewrite.before}\n\n`
        formattedText += `**优化后：**\n${rewrite.optimized || rewrite.after}\n\n`
        if (rewrite.improvements && rewrite.improvements.length > 0) {
          formattedText += `**改进要点：**\n`
          rewrite.improvements.forEach((improvement: string) => {
            formattedText += `- ${improvement}\n`
          })
        }
        formattedText += "\n"
      })
    }
    
    // 4. 机会点挖掘
    if (report.opportunityMining) {
      formattedText += "## 🔍 机会点挖掘\n\n"
      if (report.opportunityMining.missingElements && report.opportunityMining.missingElements.length > 0) {
        formattedText += `**缺失的关键信息：**\n`
        report.opportunityMining.missingElements.forEach((element: string) => {
          formattedText += `- ${element}\n`
        })
        formattedText += "\n"
      }
      if (report.opportunityMining.actionableSteps && report.opportunityMining.actionableSteps.length > 0) {
        formattedText += `**可执行的行动步骤：**\n`
        report.opportunityMining.actionableSteps.forEach((step: string) => {
          formattedText += `- ${step}\n`
        })
        formattedText += "\n"
      }
      if (report.opportunityMining.gameChangers && report.opportunityMining.gameChangers.length > 0) {
        formattedText += `**决定性加分项：**\n`
        report.opportunityMining.gameChangers.forEach((gameChanger: string) => {
          formattedText += `- ${gameChanger}\n`
        })
        formattedText += "\n"
      }
      // 兼容旧格式
      if (report.opportunityMining.bonusOpportunities && report.opportunityMining.bonusOpportunities.length > 0) {
        formattedText += `**加分项建议：**\n`
        report.opportunityMining.bonusOpportunities.forEach((opportunity: string) => {
          formattedText += `- ${opportunity}\n`
        })
        formattedText += "\n"
      }
      if (report.opportunityMining.nextSteps && report.opportunityMining.nextSteps.length > 0) {
        formattedText += `**下一步行动：**\n`
        report.opportunityMining.nextSteps.forEach((step: string) => {
          formattedText += `- ${step}\n`
        })
      }
    }
    
    return formattedText
  }
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

  // 新的机会管理页面状态
  const [showOpportunityForm, setShowOpportunityForm] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)
  const [opportunityForm, setOpportunityForm] = useState({
    company: "",
    position: "",
    location: "",
    salary: "",
    description: "",
    requirements: "",
    contact: "",
    url: "",
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

  // 增强机会雷达状态
  const [enhancedOpportunities, setEnhancedOpportunities] = useState<OpportunityEnhanced[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<OpportunityEnhanced[]>([])
  const [opportunityFilters, setOpportunityFilters] = useState<any>({})
  const [loadingOpportunities, setLoadingOpportunities] = useState(false)
  const [opportunityStats, setOpportunityStats] = useState<any>({
    total_opportunities: 0,
    active_opportunities: 0,
    high_priority_opportunities: 0,
    expiring_soon: 0,
    unique_companies: 0,
  })

  // 评分功能状态
  const [scoringOpportunities, setScoringOpportunities] = useState(false)
  const [opportunityScores, setOpportunityScores] = useState<Record<string, number>>({})
  const [scoringError, setScoringError] = useState<string | null>(null)
  const [resumeScore, setResumeScore] = useState<number | null>(null) // 简历总分

  // 性能优化相关状态
  const [displayedOpportunities, setDisplayedOpportunities] = useState<OpportunityEnhanced[]>([])
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [itemsPerPage] = useState(12) // 每页显示12个机会
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // 个人筛选页面状态
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedCompanyType, setSelectedCompanyType] = useState<string>('')
  const [selectedSubOptions, setSelectedSubOptions] = useState<string[]>([])
  const [showSubOptions, setShowSubOptions] = useState<boolean>(false)
  const [selectedEducation, setSelectedEducation] = useState<string>('')
  const [citySearchTerm, setCitySearchTerm] = useState<string>('')
  const [activeFilterSection, setActiveFilterSection] = useState<string>('city')
  const [personalTags, setPersonalTags] = useState<Array<{type: string, value: string}>>([])  

  // 寻找机会按钮拖拽状态
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hasBeenDragged, setHasBeenDragged] = useState(false)

  // 城市搜索过滤逻辑
  const filteredCities = useMemo(() => {
    if (!citySearchTerm.trim()) {
      return CITIES_DATA
    }
    
    const searchTerm = citySearchTerm.toLowerCase().trim()
    return CITIES_DATA.filter(city => 
      city.name.toLowerCase().includes(searchTerm) ||
      city.pinyin.toLowerCase().includes(searchTerm) ||
      city.short.toLowerCase().includes(searchTerm)
    )
  }, [citySearchTerm])

  // 合并的机会列表（默认 + 管理员添加的）
  const allOpportunities = useMemo(() => {
    return [...todayOpportunities, ...adminOpportunities]
  }, [adminOpportunities])

  // 拖拽事件处理函数
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    // 不需要记录偏移量，直接让按钮中心跟随鼠标
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    // 按钮尺寸约为 120px 宽 × 50px 高，让按钮中心跟随鼠标
    const buttonWidth = 120
    const buttonHeight = 50
    const newX = e.clientX - buttonWidth / 2
    const newY = e.clientY - buttonHeight / 2
    
    // 限制按钮在视窗范围内
    const maxX = window.innerWidth - buttonWidth
    const maxY = window.innerHeight - buttonHeight
    
    setButtonPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
    setHasBeenDragged(true)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleButtonClick = useCallback(() => {
    // 如果刚刚拖拽过，不触发点击事件
    if (hasBeenDragged) {
      setHasBeenDragged(false)
      return
    }
    setCurrentPage("bounty")
  }, [hasBeenDragged])

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 分页逻辑：当筛选结果变化时，重置分页并更新显示的机会
  useEffect(() => {
    if (filteredOpportunities.length > 0) {
      const startIndex = 0
      const endIndex = Math.min(itemsPerPage, filteredOpportunities.length)
      setDisplayedOpportunities(filteredOpportunities.slice(startIndex, endIndex))
      setCurrentPageNum(1)
    } else {
      setDisplayedOpportunities([])
      setCurrentPageNum(1)
    }
  }, [filteredOpportunities, itemsPerPage])

  // 加载更多机会的函数
  const loadMoreOpportunities = useCallback(() => {
    if (isLoadingMore) return
    
    const startIndex = currentPageNum * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, filteredOpportunities.length)
    
    if (startIndex >= filteredOpportunities.length) return
    
    setIsLoadingMore(true)
    
    // 模拟加载延迟，提供更好的用户体验
    setTimeout(() => {
      const newOpportunities = filteredOpportunities.slice(startIndex, endIndex)
      setDisplayedOpportunities(prev => [...prev, ...newOpportunities])
      setCurrentPageNum(prev => prev + 1)
      setIsLoadingMore(false)
    }, 300)
  }, [currentPageNum, itemsPerPage, filteredOpportunities, isLoadingMore])

  // 检查是否还有更多数据可以加载
  const hasMoreOpportunities = useMemo(() => {
    return displayedOpportunities.length < filteredOpportunities.length
  }, [displayedOpportunities.length, filteredOpportunities.length])

  // 点击外部区域关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (profileDropdownOpen && !target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  const validPages: Record<string, PageKey> = useMemo(
    () => ({
      home: "home",
      bounty: "bounty",
      forge: "forge",
      "resume-optimizer": "resume-optimizer",
      scraper: "scraper",
      "opportunity-manager": "opportunity-manager",
      pricing: "pricing",
      blog: "blog",
      login: "login",
      signup: "signup",
      terms: "terms",
      profile: "profile",
      "personal-filter": "personal-filter",
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

    // 检查用户是否已完成定位筛选
    let filterCompleted = null
    try {
      filterCompleted = localStorage.getItem('personalFilterCompleted')
    } catch (error) {
      console.warn('localStorage read failed, trying sessionStorage:', error)
       try {
         filterCompleted = sessionStorage.getItem('personalFilterCompleted')
       } catch (sessionError) {
         console.warn('sessionStorage read also failed:', sessionError)
      }
    }
    setHasCompletedFilter(filterCompleted === 'true')

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

  // 点击外部区域关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (profileDropdownOpen && !target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

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
    
    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒超时
    
    try {
      const { error } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .abortSignal(controller.signal)
      
      clearTimeout(timeoutId)
      
      if (error) throw error
      console.log("✅ Supabase连接成功")
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // 更优雅的错误处理，减少控制台噪音
      if (error.name === 'AbortError') {
        console.warn("⚠️ Supabase连接超时，将使用本地数据")
        throw new Error("连接超时")
      } else if (error.message?.includes('Failed to connect')) {
        console.warn("⚠️ 网络连接问题，将使用本地数据")
        throw new Error("网络连接失败")
      } else {
        console.warn("⚠️ Supabase服务暂时不可用，将使用本地数据")
        throw error
      }
    }
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

  // 加载增强机会数据
  useEffect(() => {
    if (currentPage === "bounty") {
      loadEnhancedOpportunities()
    }
  }, [currentPage])

  // 加载管理员页面统计数据
  useEffect(() => {
    if (currentPage === "opportunity-manager") {
      loadAdminOpportunities()
      // 加载统计数据
      const loadStats = async () => {
        try {
          const stats = await getOpportunityStatistics()
          setOpportunityStats(stats)
          console.log("Admin page statistics loaded:", stats)
        } catch (error) {
          console.error("Failed to load admin page statistics:", error)
          // 使用默认统计数据
          setOpportunityStats({
            total_opportunities: 0,
            active_opportunities: 0,
            high_priority_opportunities: 0,
            expiring_soon: 0,
            unique_companies: 0,
          })
        }
      }
      loadStats()
    }
  }, [currentPage])

  // 修复后的加载增强机会函数
  const loadEnhancedOpportunities = useCallback(async () => {
    console.log("Starting to load enhanced opportunity data...")
    setLoadingOpportunities(true)

    try {
      console.log("Calling fetchEnhancedOpportunities...")
      const opportunities = await fetchEnhancedOpportunities(50) // 增加到50个，提供更多选择
      console.log("Successfully loaded opportunity data:", opportunities.length, "opportunities")

      setEnhancedOpportunities(opportunities)
      setFilteredOpportunities(opportunities)

      // 加载统计数据
      console.log("Loading statistics data...")
      const stats = await getOpportunityStatistics()
      console.log("Statistics data:", stats)
      setOpportunityStats(stats)

      console.log("Opportunity data loading completed")
    } catch (error) {
      console.error("Failed to load enhanced opportunities:", error)

      // 使用本地缓存作为降级方案
      console.log("Using local cached data")
      const localOpportunities = getLocalEnhancedOpportunities() // 移除slice限制
      setEnhancedOpportunities(localOpportunities)
      setFilteredOpportunities(localOpportunities)

      // 设置默认统计数据
      setOpportunityStats({
        total_opportunities: localOpportunities.length,
        active_opportunities: localOpportunities.length,
        high_priority_opportunities: localOpportunities.filter((opp) => opp.priority >= 8).length,
        expiring_soon: 0,
        unique_companies: new Set(localOpportunities.map((opp) => opp.company_name)).size,
      })
    } finally {
      setLoadingOpportunities(false)
      console.log("Loading state reset completed")
    }
  }, [])

  // 处理筛选变化
  const handleFiltersChange = useCallback(
    async (filters: any) => {
      console.log("Filter conditions changed:", filters)
      setOpportunityFilters(filters)
      setLoadingOpportunities(true)

      try {
        if (Object.keys(filters).length === 0) {
          // 无筛选条件，显示所有机会
          console.log("No filter conditions, loading all opportunities")
          const opportunities = await fetchEnhancedOpportunities(50) // 增加限制
          setFilteredOpportunities(opportunities)
        } else {
          // 有筛选条件，执行搜索
          console.log("Executing filtered search")
          const searchResults = await searchEnhancedOpportunities({ ...filters, limit: 30 }) // 增加搜索限制
          setFilteredOpportunities(searchResults)
        }
      } catch (error) {
        console.warn("Search failed, using local filtering:", error)
        // 本地筛选降级
        const filtered = enhancedOpportunities.filter((opp) => {
          if (
            filters.keyword &&
            !opp.company_name.toLowerCase().includes(filters.keyword.toLowerCase()) &&
            !opp.job_title.toLowerCase().includes(filters.keyword.toLowerCase())
          ) {
            return false
          }
          if (filters.location && !opp.location?.toLowerCase().includes(filters.location.toLowerCase())) {
            return false
          }
          if (filters.fundingStage && opp.funding_stage !== filters.fundingStage) {
            return false
          }
          if (filters.jobLevel && !opp.job_level?.includes(filters.jobLevel)) {
            return false
          }
          return true
        })
        setFilteredOpportunities(filtered) // 移除限制，显示所有筛选结果
      } finally {
        setLoadingOpportunities(false)
      }
    },
    [enhancedOpportunities],
  )

  // 处理申请机会
  const handleApplyOpportunity = (opportunity: OpportunityEnhanced) => {
    if (!user) {
      showPage("#login")
      return
    }

    // 转换为简化格式用于邮件生成
    const simpleOpp = {
      id: opportunity.id,
      company: opportunity.company_name,
      title: opportunity.job_title,
      city: opportunity.location,
      tags: opportunity.tags || [],
      reason: opportunity.reason,
    }

    onGoForge(simpleOpp)
  }

  // 评分功能
  const handleScoreOpportunities = useCallback(async () => {
    console.log("Score button clicked")
    console.log("User status:", user)
    console.log("Resume text:", resumeText ? "uploaded" : "not uploaded")
    console.log("Filtered opportunities count:", filteredOpportunities.length)
    
    if (!user) {
      alert("请先登录后再进行评分")
      return
    }
    
    if (!resumeText) {
      alert("需上传简历，才可评分。")
      return
    }

    setScoringOpportunities(true)
    setScoringError(null)
    setResumeScore(null)
    const newScores: Record<string, number> = {}

    try {
      // 第一步：对简历进行基础评分，获取简历总分
      console.log("Starting basic resume scoring...")
      const resumeResponse = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: resumeText,
          jobPosition: "AI产品经理", // 使用通用职位进行基础评分
          jobLocation: "不限",
          salaryRange: "面议",
          experienceRequired: "不限",
          educationRequired: "不限",
          jobDescription: "通用AI产品经理职位评估",
          companyName: "通用评估",
          companySize: "不限",
          industry: "互联网",
          benefits: "标准福利",
          tags: ["AI", "产品经理"]
        }),
      })

      if (!resumeResponse.ok) {
        throw new Error(`简历评分失败: HTTP ${resumeResponse.status}`)
      }

      const resumeScoreData = await resumeResponse.json()
      console.log("Resume basic score response:", resumeScoreData)
      const baseResumeScore = resumeScoreData.success ? (resumeScoreData.data?.total_score || 0) : 0
      setResumeScore(baseResumeScore)
      console.log("Resume total score:", baseResumeScore)

      // 第二步：对每个机会进行评分，但只显示分数小于等于简历总分的机会
      console.log("Starting opportunity scoring...")
      for (const opportunity of filteredOpportunities) {
        try {
          const response = await fetch("/api/score", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              resumeText: resumeText,
              jobPosition: opportunity.job_title,
              jobLocation: opportunity.location,
              salaryRange: (opportunity as any).salary_range || "面议",
              experienceRequired: (opportunity as any).experience_required || "不限",
              educationRequired: (opportunity as any).education_required || "不限",
              jobDescription: (opportunity as any).job_description || "暂无详细描述",
              companyName: opportunity.company_name,
              companySize: (opportunity as any).company_size || "未知",
              industry: (opportunity as any).industry || "未知",
              benefits: (opportunity as any).benefits || "未提及",
              tags: opportunity.tags || []
            }),
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const scoreData = await response.json()
          console.log(`${opportunity.company_name} score response:`, scoreData)
          const score = scoreData.success ? (scoreData.data?.total_score || 0) : 0
          
          // 保存所有机会的评分
          newScores[opportunity.id] = score
          console.log(`${opportunity.company_name}: ${score} points (resume total: ${baseResumeScore})`)
        } catch (error) {
          console.error(`Scoring failed - ${opportunity.company_name}:`, error)
          // 评分失败的机会不显示
        }
      }

      setOpportunityScores(newScores)
      console.log("Scoring completed, qualified opportunities:", newScores)
      
      if (Object.keys(newScores).length === 0) {
        setScoringError(`暂无可评分的机会（简历总分: ${baseResumeScore}分）`)
      }
    } catch (error) {
      console.error("Error in scoring process:", error)
      setScoringError("评分过程中出现错误")
    } finally {
      setScoringOpportunities(false)
    }
  }, [user, resumeText, filteredOpportunities])

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
      
      // 检查是否已完成定位筛选
      let filterCompleted = null
      try {
        filterCompleted = localStorage.getItem('personalFilterCompleted')
      } catch (error) {
        console.warn('localStorage read failed, trying sessionStorage:', error)
         try {
           filterCompleted = sessionStorage.getItem('personalFilterCompleted')
         } catch (sessionError) {
           console.warn('sessionStorage read also failed:', sessionError)
        }
      }
      if (filterCompleted === 'true') {
        // 已完成筛选，直接跳转到原目标页面
        showPage("#bounty")
      } else {
        // 未完成筛选，先进入定位筛选页
        setOriginalDestination("#bounty")
        showPage("#personal-filter")
      }
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
      
      // 注册用户默认需要完成定位筛选
      setOriginalDestination("#bounty")
      showPage("#personal-filter")
    } catch (err: any) {
      setSignupErr(err?.message ?? "注册失败")
    } finally {
      setAuthLoading(false)
    }
  }

  // 机会卡片 -> 简历优化页面
  const onGoResumeOptimizer = async (opp: Opportunity) => {
    if (!user) {
      showPage("#login")
      return
    }
    setSelectedOpp(opp)

    // 先设置空的简历优化内容，然后异步生成
    setResumeReportTitle("")
    setResumeReportContent("")
    setAiGenerateError(null)

    showPage("#resume-optimizer")

    // 异步生成简历优化报告
    setAiGenerating(true)
    try {
      const response = await fetch("/api/resume-optimization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: user,
          opportunity: opp,
          resumeText: resumeText,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // 处理简历优化报告数据
      if (data.report) {
        setResumeOptimizationReport(data.report)
        // 将报告内容格式化为可显示的文本
        const reportText = formatResumeOptimizationReport(data.report)
        setResumeReportTitle("简历优化报告")
        setResumeReportContent(reportText)
      } else if (data.rawText) {
        // 如果没有结构化报告，使用原始文本
        setResumeReportTitle("简历优化报告")
        setResumeReportContent(data.rawText)
        setResumeOptimizationReport(null)
      } else {
        // 兼容旧格式
        setResumeReportTitle("简历优化报告")
        setResumeReportContent("报告生成失败，请重试")
        setResumeOptimizationReport(null)
      }
      setAiGenerateError(null)
    } catch (error: any) {
      console.error("Resume optimization report generation failed:", error)
      setAiGenerateError("生成简历优化报告时出现问题")
      setResumeReportTitle("简历优化报告")
      setResumeReportContent("生成失败，请稍后重试")
    } finally {
      setAiGenerating(false)
    }
  }

  // 重新生成邮件
  const onRegenerateEmail = async () => {
    if (!user || !selectedOpp) return

    setAiGenerating(true)
    setAiGenerateError(null)
    
    // 根据当前页面决定调用哪个API和使用哪些状态变量
    if (currentPage === "resume-optimizer") {
      // 简历优化页面：生成简历优化报告
      setResumeReportTitle("")
      setResumeReportContent("")
      
      try {
        const response = await fetch("/api/resume-optimization", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: user,
            opportunity: selectedOpp,
            resumeText: resumeText,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        
        // 处理简历优化报告数据
        if (data.report) {
          setResumeOptimizationReport(data.report)
          const reportText = formatResumeOptimizationReport(data.report)
          setResumeReportTitle("简历优化报告")
          setResumeReportContent(reportText)
        } else if (data.rawText) {
          setResumeReportTitle("简历优化报告")
          setResumeReportContent(data.rawText)
          setResumeOptimizationReport(null)
        } else {
          setResumeReportTitle("简历优化报告")
          setResumeReportContent("报告生成失败，请重试")
          setResumeOptimizationReport(null)
        }
        setAiGenerateError(null)
      } catch (error: any) {
        console.error("Resume optimization report generation failed:", error)
        setAiGenerateError("生成简历优化报告时出现问题")
        setResumeReportTitle("简历优化报告")
        setResumeReportContent("生成失败，请稍后重试")
        setResumeOptimizationReport(null)
      }
    } else {
      // 破冰工坊页面：生成邮件
      setMailSubject("")
      setMailBody("")
      
      try {
        const response = await fetch("/api/generate-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: user,
            opportunity: selectedOpp,
            resumeText: resumeText,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        
        if (data.subject && data.body) {
          setMailSubject(data.subject)
          setMailBody(data.body)
        } else if (data.rawText) {
          setMailSubject("求职邮件")
          setMailBody(data.rawText)
        } else {
          setMailSubject("求职邮件")
          setMailBody("邮件生成失败，请重试")
        }
        setAiGenerateError(null)
      } catch (error: any) {
        console.error("Email generation failed:", error)
        setAiGenerateError("生成邮件时出现问题")
        setMailSubject("求职邮件")
        setMailBody("生成失败，请稍后重试")
      }
    }
    
    setAiGenerating(false)
  }

  // 机会卡片 -> 破冰工坊（简历优化报告生成）
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

    // 异步生成求职邮件
    setAiGenerating(true)
    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: user,
          opportunity: opp,
          resumeText: resumeText,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // 处理邮件数据
      if (data.email) {
        setMailSubject(data.email.subject || "求职邮件")
        setMailBody(data.email.body || "邮件生成失败，请重试")
      } else {
        // 兼容旧格式
        setMailSubject(data.subject || "求职邮件")
        setMailBody(data.body || "邮件生成失败，请重试")
      }
      setAiGenerateError(null)
    } catch (error: any) {
      console.error("Job application email generation failed:", error)
      setAiGenerateError("生成求职邮件时出现问题")
      setMailSubject("求职邮件")
      setMailBody("生成失败，请稍后重试")
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
      console.log("Starting email sending process...")

      // 1) 发送真实邮件
      const emailResult = await sendEmail({
        to: recipientEmail.trim(),
        subject: mailSubject.trim(),
        body: mailBody.trim(),
        senderName: user.username,
        senderEmail: senderEmail.trim() || undefined,
      })

      console.log("Email sending result:", emailResult)

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
      console.error("Sending process failed:", e)
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
        console.warn("Failed to update legacy resume field:", error)
      }

      setFileUploadSuccess(`简历 "${title}" 已成功添加并设为当前使用`)

      // 3秒后清除成功消息
      setTimeout(() => setFileUploadSuccess(null), 3000)
    } catch (error: any) {
      console.error("Resume upload failed:", error)
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
      let encodedUrl: string
      try {
        encodedUrl = encodeURIComponent(crawlUrl)
      } catch (encodeError) {
        console.error('URL encoding failed:', encodeError)
        setCrawlError('URL格式不正确，无法进行编码')
        return
      }
      
      const proxyUrl = `https://api.allorigins.win/get?url=${encodedUrl}`
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
      console.error("Failed to load admin opportunities:", error)
    }
  }

  const saveAdminOpportunities = (opportunities: Opportunity[]) => {
    try {
      localStorage.setItem(ADMIN_OPPORTUNITIES_KEY, JSON.stringify(opportunities))
      setAdminOpportunities(opportunities)
    } catch (error) {
      console.error("Failed to save admin opportunities:", error)
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

  // 新的机会管理页面处理函数
  const handleAddOpportunityNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!opportunityForm.company.trim() || !opportunityForm.position.trim()) {
      alert("请填写公司名称和职位名称")
      return
    }

    const newOpp: Opportunity = {
      id: `admin-opp-${Date.now()}`,
      company: opportunityForm.company.trim(),
      title: opportunityForm.position.trim(),
      city: opportunityForm.location.trim() || undefined,
      tags: [],
      reason: opportunityForm.description.trim() || undefined,
    }

    const updated = [...adminOpportunities, newOpp]
    saveAdminOpportunities(updated)

    // 刷新统计数据
    try {
      const stats = await getOpportunityStatistics()
      setOpportunityStats(stats)
      console.log("Statistics data updated:", stats)
    } catch (error) {
      console.error("Failed to update statistics data:", error)
    }

    // 重置表单
    setOpportunityForm({
      company: "",
      position: "",
      location: "",
      salary: "",
      description: "",
      requirements: "",
      contact: "",
      url: "",
    })
    setShowOpportunityForm(false)
  }

  const handleUpdateOpportunityNew = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingOpportunity || !opportunityForm.company.trim() || !opportunityForm.position.trim()) {
      alert("请填写公司名称和职位名称")
      return
    }

    const updatedOpp: Opportunity = {
      ...editingOpportunity,
      company: opportunityForm.company.trim(),
      title: opportunityForm.position.trim(),
      city: opportunityForm.location.trim() || undefined,
      tags: [],
      reason: opportunityForm.description.trim() || undefined,
    }

    const updated = adminOpportunities.map((opp) => (opp.id === editingOpportunity.id ? updatedOpp : opp))
    saveAdminOpportunities(updated)

    // 重置编辑状态
    setEditingOpportunity(null)
    setOpportunityForm({
      company: "",
      position: "",
      location: "",
      salary: "",
      description: "",
      requirements: "",
      contact: "",
      url: "",
    })
    setShowOpportunityForm(false)
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
                    <a
                      href="#resume-optimizer"
                      className={navItemClass(currentPage === "resume-optimizer")}
                      onClick={(e) => handleNavClick(e, "#resume-optimizer")}
                    >
                      简历优化
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
                <div className="relative profile-dropdown-container">
                  <button
                    className="nav-link flex items-center"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    aria-label="个人信息菜单"
                    title="个人信息菜单"
                  >
                    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-green-500 text-white font-bold">
                      {avatarInitial}
                    </span>
                  </button>
                  
                  {/* 下拉菜单 */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            // 保存当前页面状态到sessionStorage
                            try {
                              const currentState = {
                                page: currentPage,
                                hash: window.location.hash || '#home'
                              }
                              sessionStorage.setItem('PREV_PAGE', JSON.stringify(currentState))
                            } catch (error) {
                              console.warn('Failed to save previous page state:', error)
                            }
                            
                            setProfileDropdownOpen(false)
                            setCurrentPage("personal-filter")
                            setActiveFilterSection('city')
                          }}
                        >
                          我的标签
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            setProfileDropdownOpen(false)
                            setPreviousPage(currentPage)
                            setCurrentPage("profile")
                          }}
                        >
                          我的简历
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                className={`block py-2 ${navItemClass(currentPage === "home" && activeHomeSection !== "about")}`}
                onClick={(e) => handleNavClick(e, "#home")}
              >
                产品功能
              </a>
              <a
                href="#pricing"
                className={`block py-2 ${navItemClass(currentPage === "pricing")}`}
                onClick={(e) => handleNavClick(e, "#pricing")}
              >
                定价
              </a>
              <a
                href="#blog"
                className={`block py-2 ${navItemClass(currentPage === "blog")}`}
                onClick={(e) => handleNavClick(e, "#blog")}
              >
                求职干货
              </a>
              <a
                href="#home"
                data-scroll-to="about"
                className={`block py-2 ${navItemClass(currentPage === "home" && activeHomeSection === "about")}`}
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
                    className={`block py-2 ${navItemClass(currentPage === "scraper")}`}
                    onClick={(e) => handleNavClick(e, "#scraper")}
                  >
                    网页爬虫
                  </a>
                  <a
                    href="#opportunity-manager"
                    className={`block py-2 ${navItemClass(currentPage === "opportunity-manager")}`}
                    onClick={(e) => handleNavClick(e, "#opportunity-manager")}
                  >
                    机会管理
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="#bounty"
                    className={`block py-2 ${navItemClass(currentPage === "bounty")}`}
                    onClick={(e) => handleNavClick(e, "#bounty")}
                  >
                    机会雷达
                  </a>
                  <a
                    href="#forge"
                    className={`block py-2 ${navItemClass(currentPage === "forge")}`}
                    onClick={(e) => handleNavClick(e, "#forge")}
                  >
                    破冰工坊
                  </a>
                  <a
                    href="#resume-optimizer"
                    className={`block py-2 ${navItemClass(currentPage === "resume-optimizer")}`}
                    onClick={(e) => handleNavClick(e, "#resume-optimizer")}
                  >
                    简历优化
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
                  className={`block py-2 ${navItemClass(currentPage === "profile")}`}
                  onClick={(e) => handleNavClick(e, "#profile")}
                >
                  个人主页
                </a>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-gray-600 hover:text-green-500"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <a
                  href="#login"
                  className={`block py-2 ${navItemClass(currentPage === "login")}`}
                  onClick={(e) => handleNavClick(e, "#login")}
                >
                  登录
                </a>
                <a
                  href="#signup"
                  className="block text-center bg-green-500 text-white font-bold py-2 px-5 rounded-full cta-button nav-link mt-2"
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
                      <h3 className="text-2xl font-bold mt-2 mb-4">AI简历优化报告</h3>
                      <p className="text-gray-600 mb-6">
                        基于五维评估模型，AI为你生成专业的简历优化报告，提供量化评分、具体建议和STAR法则改写，助你打造完美简历。
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
                  {/* 文章1 */}
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

        {/* 个人筛选页 */}
        {currentPage === "personal-filter" && (
          <div id="page-personal-filter" className="page-content">
            <section className="py-12 bg-gray-50 min-h-screen">
              <div className="container mx-auto px-6 max-w-6xl">
                {/* 顶部标题 */}
                <div className="mb-8 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-4">
                    为了帮您精准找到合适的工作，请选择你的个人标签
                  </h2>
                </div>

                {/* 主要内容区域 */}
                <div className="flex gap-8">
                  {/* 左侧导航 */}
                  <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                      <div className="space-y-2">
                        <button
                          onClick={() => setActiveFilterSection('city')}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            activeFilterSection === 'city'
                              ? 'bg-green-50 text-green-600 border border-green-200'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          意向城市
                        </button>
                        <button
                          onClick={() => setActiveFilterSection('company')}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            activeFilterSection === 'company'
                              ? 'bg-green-50 text-green-600 border border-green-200'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          意向公司类型
                        </button>
                        <button
                          onClick={() => setActiveFilterSection('education')}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            activeFilterSection === 'education'
                              ? 'bg-green-50 text-green-600 border border-green-200'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          教育背景
                        </button>
                        <button
                          onClick={() => setActiveFilterSection('tags')}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            activeFilterSection === 'tags'
                              ? 'bg-green-50 text-green-600 border border-green-200'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          我的标签
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 右侧内容区 */}
                  <div className="flex-1">
                    <div className="bg-white rounded-lg shadow-sm border p-6 min-h-[500px] relative">
                      {/* 意向城市 */}
                      {activeFilterSection === 'city' && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">选择意向城市</h3>
                          {/* 搜索框 */}
                          <div className="mb-4">
                            <input
                              type="text"
                              placeholder="搜索城市名称或拼音"
                              value={citySearchTerm}
                              onChange={(e) => setCitySearchTerm(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          {/* 搜索结果或热门城市 */}
                          <div className="mb-6">
                            {citySearchTerm.trim() ? (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                  搜索结果 ({filteredCities.length})
                                </h4>
                                {filteredCities.length > 0 ? (
                                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                    {filteredCities.map((city) => (
                                      <button
                                        key={city.name}
                                        onClick={() => {
                                          if (selectedCities.includes(city.name)) {
                                            // 如果已选中，则取消选择
                                            setSelectedCities(prev => prev.filter(c => c !== city.name))
                                            setPersonalTags(prev => prev.filter(tag => !(tag.type === '意向城市' && tag.value === city.name)))
                                          } else {
                                            // 添加到选中列表
                                            setSelectedCities(prev => [...prev, city.name])
                                            const newTag = { type: '意向城市', value: city.name }
                                            setPersonalTags(prev => [...prev, newTag])
                                          }
                                          setCitySearchTerm('') // 清空搜索框
                                        }}
                                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                          selectedCities.includes(city.name)
                                            ? 'bg-green-500 text-white border-green-500'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                                        }`}
                                      >
                                        {city.name}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <p>未找到匹配的城市</p>
                                    <p className="text-sm mt-1">请尝试输入城市名称、拼音或缩写</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">热门城市</h4>
                                <div className="grid grid-cols-3 gap-2">
                                  {['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '全国'].map((city) => (
                                    <button
                                      key={city}
                                      onClick={() => {
                                        if (selectedCities.includes(city)) {
                                          // 如果已选中，则取消选择
                                          setSelectedCities(prev => prev.filter(c => c !== city))
                                          setPersonalTags(prev => prev.filter(tag => !(tag.type === '意向城市' && tag.value === city)))
                                        } else {
                                          // 添加到选中列表
                                          setSelectedCities(prev => [...prev, city])
                                          const newTag = { type: '意向城市', value: city }
                                          setPersonalTags(prev => [...prev, newTag])
                                        }
                                      }}
                                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                        selectedCities.includes(city)
                                          ? 'bg-green-500 text-white border-green-500'
                                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                                      }`}
                                    >
                                      {city}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {selectedCities.length > 0 && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                              <div className="flex flex-wrap gap-2">
                                {selectedCities.map((city) => (
                                  <div key={city} className="flex items-center bg-green-500 text-white px-3 py-1 rounded-lg text-sm">
                                    <span>{city}</span>
                                    <button
                                      onClick={() => {
                                        setSelectedCities(prev => prev.filter(c => c !== city))
                                        setPersonalTags(prev => prev.filter(tag => !(tag.type === '意向城市' && tag.value === city)))
                                      }}
                                      className="ml-2 text-white hover:text-gray-200 font-bold"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 意向公司类型 */}
                      {activeFilterSection === 'company' && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">选择意向公司类型</h3>
                          <div className="space-y-4">
                            {/* 国企选项 */}
                            <div className={`p-4 rounded-lg border transition-colors flex items-center justify-between ${
                              selectedCompanyType === '国企'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white border-gray-300 hover:border-blue-300'
                            }`}>
                              <button
                                onClick={() => {
                                  if (selectedCompanyType === '国企') {
                                    // 如果已选中，则取消选择
                                    setSelectedCompanyType('')
                                    setPersonalTags(prev => prev.filter(tag => tag.type !== '意向公司类型'))
                                  } else {
                                    // 选中国企
                                    setSelectedCompanyType('国企')
                                    const newTag = { type: '意向公司类型', value: '国企' }
                                    setPersonalTags(prev => {
                                      const filtered = prev.filter(tag => tag.type !== '意向公司类型')
                                      return [...filtered, newTag]
                                    })
                                  }
                                }}
                                className="flex-1 text-left font-medium"
                              >
                                国企
                              </button>
                              {selectedCompanyType === '国企' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedCompanyType('')
                                    setPersonalTags(prev => prev.filter(tag => tag.type !== '公司类型'))
                                  }}
                                  className="ml-2 text-white hover:text-gray-200 font-bold text-lg"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            
                            {/* 中小厂选项 */}
                            <div className="space-y-2">
                              <div className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                                selectedCompanyType === '中小厂' || showSubOptions
                                  ? 'bg-green-500 text-white border-green-500'
                                  : 'bg-white border-gray-300 hover:border-green-300'
                              }`}
                                onClick={() => {
                                  if (selectedCompanyType === '中小厂' && showSubOptions) {
                                    // 如果已经选中且展开，则收起
                                    setShowSubOptions(false)
                                    setSelectedCompanyType('')
                                    setSelectedSubOptions([])
                                    setPersonalTags(prev => prev.filter(tag => tag.type !== '公司类型' && tag.type !== '发展阶段'))
                                  } else {
                                    // 选中中小厂并展开子选项
                                    setSelectedCompanyType('中小厂')
                                    setShowSubOptions(true)
                                    const newTag = { type: '意向公司类型', value: '中小厂' }
                                    setPersonalTags(prev => {
                                      const filtered = prev.filter(tag => tag.type !== '意向公司类型')
                                      return [...filtered, newTag]
                                    })
                                  }
                                }}
                              >
                                <div className="font-medium">中小厂</div>
                              </div>
                              
                              {/* 子选项 - 垂直排列 */}
                              {showSubOptions && (
                                <div className="ml-4 space-y-2">
                                  {/* 初创期选项 */}
                                  <div className={`p-3 rounded-lg border transition-colors flex items-center justify-between ${
                                    selectedSubOptions.includes('初创期')
                                      ? 'bg-green-500 text-white border-green-500'
                                      : 'bg-white border-gray-300 hover:border-green-300'
                                  }`}>
                                    <button
                                      onClick={() => {
                                        if (selectedSubOptions.includes('初创期')) {
                                          // 如果已选中，则取消选择
                                          setSelectedSubOptions(prev => prev.filter(option => option !== '初创期'))
                                          setPersonalTags(prev => prev.filter(tag => !(tag.type === '意向公司类型' && tag.value === '初创期')))
                                        } else {
                                          // 选中初创期
                                          setSelectedSubOptions(prev => [...prev, '初创期'])
                                          const stageTag = { type: '意向公司类型', value: '初创期' }
                                          setPersonalTags(prev => [...prev, stageTag])
                                        }
                                      }}
                                      className="flex-1 text-left font-medium"
                                    >
                                      初创期
                                    </button>
                                    {selectedSubOptions.includes('初创期') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedSubOptions(prev => prev.filter(option => option !== '初创期'))
                                          setPersonalTags(prev => prev.filter(tag => !(tag.type === '意向公司类型' && tag.value === '初创期')))
                                        }}
                                        className="ml-2 text-white hover:text-gray-200 font-bold text-lg"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* 成长期选项 */}
                                  <div className={`p-3 rounded-lg border transition-colors flex items-center justify-between ${
                                    selectedSubOptions.includes('成长期')
                                      ? 'bg-green-500 text-white border-green-500'
                                      : 'bg-white border-gray-300 hover:border-green-300'
                                  }`}>
                                    <button
                                      onClick={() => {
                                        if (selectedSubOptions.includes('成长期')) {
                                          // 如果已选中，则取消选择
                                          setSelectedSubOptions(prev => prev.filter(option => option !== '成长期'))
                                          setPersonalTags(prev => prev.filter(tag => !(tag.type === '意向公司类型' && tag.value === '成长期')))
                                        } else {
                                          // 选中成长期
                                          setSelectedSubOptions(prev => [...prev, '成长期'])
                                          const stageTag = { type: '意向公司类型', value: '成长期' }
                                          setPersonalTags(prev => [...prev, stageTag])
                                        }
                                      }}
                                      className="flex-1 text-left font-medium"
                                    >
                                      成长期
                                    </button>
                                    {selectedSubOptions.includes('成长期') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedSubOptions(prev => prev.filter(option => option !== '成长期'))
                                          setPersonalTags(prev => prev.filter(tag => !(tag.type === '意向公司类型' && tag.value === '成长期')))
                                        }}
                                        className="ml-2 text-white hover:text-gray-200 font-bold text-lg"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 教育背景 */}
                      {activeFilterSection === 'education' && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">选择教育背景</h3>
                          <div className="flex gap-4">
                            {['大专', '本科', '硕士及以上'].map((edu) => (
                              <div key={edu} className={`px-6 py-3 rounded-lg border transition-colors flex items-center gap-2 ${
                                selectedEducation === edu
                                  ? 'bg-green-500 text-white border-green-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                              }`}>
                                <button
                                  onClick={() => {
                                    if (selectedEducation === edu) {
                                      // 如果已选中，则取消选择
                                      setSelectedEducation('')
                                      setPersonalTags(prev => prev.filter(tag => tag.type !== '教育背景'))
                                    } else {
                                      // 选中教育背景
                                      setSelectedEducation(edu)
                                      const newTag = { type: '教育背景', value: edu }
                                      setPersonalTags(prev => {
                                        const filtered = prev.filter(tag => tag.type !== '教育背景')
                                        return [...filtered, newTag]
                                      })
                                    }
                                  }}
                                  className="flex-1 text-left font-medium"
                                >
                                  {edu}
                                </button>
                                {selectedEducation === edu && (
                                  <button
                                    onClick={() => {
                                      setSelectedEducation('')
                                      setPersonalTags(prev => prev.filter(tag => tag.type !== '教育背景'))
                                    }}
                                    className="text-white hover:text-gray-200 font-bold text-lg"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 我的标签 */}
                      {activeFilterSection === 'tags' && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">我的标签</h3>
                          {(selectedCities.length === 0 && !selectedCompanyType && selectedSubOptions.length === 0 && !selectedEducation) ? (
                            <p className="text-gray-500">暂无标签，请先选择其他选项</p>
                          ) : (
                            <div className="space-y-3">
                              {/* 意向城市标签行 */}
                              {selectedCities.length > 0 && (
                                <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg">
                                  <span className="text-green-700 font-medium mr-2">意向城市：</span>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedCities.map((city, index) => (
                                      <span key={city} className="flex items-center">
                                        <span className="text-green-700">{city}</span>
                                        <button
                                          onClick={() => {
                                            setSelectedCities(prev => prev.filter(c => c !== city))
                                            setPersonalTags(prev => prev.filter(tag => !(tag.type === '意向城市' && tag.value === city)))
                                          }}
                                          className="ml-1 text-red-500 hover:text-red-700 transition-colors font-bold"
                                        >
                                          ×
                                        </button>
                                        {index < selectedCities.length - 1 && <span className="mx-1 text-green-700">、</span>}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* 意向公司类型标签行 */}
                              {(selectedCompanyType || selectedSubOptions.length > 0) && (
                                <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg">
                                  <span className="text-green-700 font-medium mr-2">意向公司类型：</span>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedCompanyType && (
                                      <span className="flex items-center">
                                        <span className="text-green-700">{selectedCompanyType}</span>
                                        <button
                                          onClick={() => {
                                            setSelectedCompanyType('')
                                            setShowSubOptions(false)
                                            setSelectedSubOptions([])
                                            setPersonalTags(prev => prev.filter(tag => tag.type !== '意向公司类型'))
                                          }}
                                          className="ml-1 text-red-500 hover:text-red-700 transition-colors font-bold"
                                        >
                                          ×
                                        </button>
                                        {selectedSubOptions.length > 0 && <span className="mx-1 text-green-700">、</span>}
                                      </span>
                                    )}
                                    {selectedSubOptions.map((option, index) => (
                                      <span key={option} className="flex items-center">
                                        <span className="text-green-700">{option}</span>
                                        <button
                                          onClick={() => {
                                            setSelectedSubOptions(prev => prev.filter(opt => opt !== option))
                                            setPersonalTags(prev => prev.filter(tag => !(tag.type === '意向公司类型' && tag.value === option)))
                                          }}
                                          className="ml-1 text-red-500 hover:text-red-700 transition-colors font-bold"
                                        >
                                          ×
                                        </button>
                                        {index < selectedSubOptions.length - 1 && <span className="mx-1 text-green-700">、</span>}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* 教育背景标签行 */}
                              {selectedEducation && (
                                <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg">
                                  <span className="text-green-700 font-medium mr-2">教育背景：</span>
                                  <div className="flex items-center">
                                    <span className="text-green-700">{selectedEducation}</span>
                                    <button
                                      onClick={() => {
                                        setSelectedEducation('')
                                        setPersonalTags(prev => prev.filter(tag => tag.type !== '教育背景'))
                                      }}
                                      className="ml-1 text-red-500 hover:text-red-700 transition-colors font-bold"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 下一步按钮 */}
                      <div className="absolute bottom-6 right-6">
                        <button
                          onClick={() => {
                            // 携带筛选参数跳转到原目标页面
                            const filterParams = {
                              cities: selectedCities,
                              companyType: selectedCompanyType,
                              education: selectedEducation,
                              tags: personalTags
                            }
                            // 将筛选参数存储到localStorage，供机会雷达页面使用
                            try {
                              localStorage.setItem('personalFilterParams', JSON.stringify(filterParams))
                              // 标记已完成定位筛选
                              localStorage.setItem('personalFilterCompleted', 'true')
                            } catch (error) {
                              console.warn('localStorage storage failed, using memory storage:', error)
                              // 如果localStorage失败，可以使用sessionStorage或内存存储作为备选
                              sessionStorage.setItem('personalFilterParams', JSON.stringify(filterParams))
                              sessionStorage.setItem('personalFilterCompleted', 'true')
                            }
                            setHasCompletedFilter(true)
                            
                            // 读取之前保存的页面状态并跳转
                            try {
                              const prevPageData = sessionStorage.getItem('PREV_PAGE')
                              if (prevPageData) {
                                const prevState = JSON.parse(prevPageData)
                                // 清除保存的状态
                                sessionStorage.removeItem('PREV_PAGE')
                                // 跳转到之前的页面
                                if (prevState.hash) {
                                  showPage(prevState.hash)
                                } else if (prevState.page) {
                                  setCurrentPage(prevState.page)
                                } else {
                                  // 默认跳转到简历管理页面
                                  showPage('#resume-manage')
                                }
                              } else {
                                // 如果没有保存的状态，默认跳转到简历管理页面
                                showPage('#resume-manage')
                              }
                            } catch (error) {
                              console.warn('Failed to restore previous page state:', error)
                              // 出错时默认跳转到简历管理页面
                              showPage('#resume-manage')
                            }
                          }}
                          disabled={selectedCities.length === 0}
                          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            selectedCities.length > 0
                              ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          完成
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 1) 机会雷达 */}
        {currentPage === "bounty" && (
          <div id="page-bounty" className="page-content">
            <section className="py-12 bg-gray-50 min-h-screen">
              <div className="container mx-auto px-6">
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">机会雷达</h2>
                      <p className="text-gray-600">发现最新的职业机会，精准匹配你的技能和期望</p>
                      {!user && <p className="text-sm text-amber-600 mt-2">💡 登录后可生成简历优化报告</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={loadEnhancedOpportunities}
                        disabled={loadingOpportunities}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-60 transition-colors"
                        title="刷新机会列表"
                      >
                        <RefreshCw size={16} className={loadingOpportunities ? "animate-spin" : ""} />
                        {loadingOpportunities ? "刷新中..." : "刷新"}
                      </button>
                      <button
                         onClick={handleScoreOpportunities}
                         disabled={scoringOpportunities || !user || !resumeText}
                         className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-60 transition-colors"
                         title={!user ? "请先登录" : !resumeText ? "请先上传简历" : "对符合条件的机会进行评分"}
                       >
                         <Calculator size={16} className={scoringOpportunities ? "animate-pulse" : ""} />
                         {scoringOpportunities ? "评分中..." : "评分"}
                       </button>
                    </div>
                  </div>
                </div>

                {/* 筛选器 */}
                <OpportunityFilters onFiltersChange={handleFiltersChange} />



                {/* 评分错误信息 */}
                {scoringError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{scoringError}</p>
                  </div>
                )}

                {/* 机会列表 */}
                {loadingOpportunities ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <span className="ml-3 text-gray-600">加载中...</span>
                  </div>
                ) : filteredOpportunities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-2">没有找到匹配的机会</p>
                    <p className="text-sm text-gray-500">尝试调整筛选条件或点击刷新按钮</p>
                    <button
                      onClick={loadEnhancedOpportunities}
                      className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      重新加载数据
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {(() => {
                        // 如果已经评分，只显示有评分的机会；否则使用分页显示的机会
                        const displayOpportunities = Object.keys(opportunityScores).length > 0 
                          ? filteredOpportunities.filter(opp => opportunityScores[opp.id] !== undefined)
                          : displayedOpportunities
                        
                        return displayOpportunities.map((opportunity) => (
                          <OpportunityCardEnhanced
                            key={opportunity.id}
                            opportunity={opportunity}
                            onApply={handleApplyOpportunity}
                            score={opportunityScores[opportunity.id]}
                          />
                        ))
                      })()
                      }
                    </div>

                    {/* 加载更多按钮 */}
                    {Object.keys(opportunityScores).length === 0 && hasMoreOpportunities && (
                      <div className="mt-8 text-center">
                        <button
                          onClick={loadMoreOpportunities}
                          disabled={isLoadingMore}
                          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingMore ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              加载中...
                            </div>
                          ) : (
                            `加载更多 (还有 ${filteredOpportunities.length - displayedOpportunities.length} 个机会)`
                          )}
                        </button>
                      </div>
                    )}

                    {/* 显示限制提示 */}
                    <div className="mt-8 text-center">
                      {Object.keys(opportunityScores).length > 0 ? (
                        <>
                          <p className="text-sm text-gray-500">
                            显示 {Object.keys(opportunityScores).length} 个机会的评分结果
                            {resumeScore && ` (简历总分: ${resumeScore}分)`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">显示所有机会的匹配度评分</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-500">
                            显示 {displayedOpportunities.length} / {filteredOpportunities.length} 个机会
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {hasMoreOpportunities 
                              ? '点击"加载更多"查看剩余机会，或使用筛选条件精准匹配' 
                              : '使用筛选条件可以精准匹配更合适的机会'
                            }
                          </p>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* 数据库连接状态提示 */}
                {connOk === false && (
                  <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Info size={16} className="text-yellow-600" />
                      <p className="text-yellow-700 text-sm">
                        <strong>离线模式：</strong>
                        {connErr === "连接超时" ? "网络连接超时" : 
                         connErr === "网络连接失败" ? "网络暂时不可用" : 
                         "云端服务暂时不可用"}。当前显示本地数据，功能正常使用。
                      </p>
                    </div>
                  </div>
                )}
                

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
                        AI个性化简历优化
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

        {/* 简历优化页面 */}
        {currentPage === "resume-optimizer" && (
          <div id="page-resume-optimizer" className="page-content">
            <section className="py-12">
              <div className="container mx-auto px-6 max-w-3xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">简历优化</h2>
                {connOk === true && <p className="text-sm text-green-600 mb-4">已成功链接云端数据（Supabase）</p>}
                {connOk === false && (
                  <p className="text-sm text-yellow-600 mb-4">离线模式：{connErr === "连接超时" ? "网络连接超时" : connErr === "网络连接失败" ? "网络暂时不可用" : "云端服务暂时不可用"}（使用本地数据）</p>
                )}

                {!user ? (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                    <p className="text-gray-700">请先登录后生成简历优化报告</p>
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
                        根据你的简历与目标公司「<b>{selectedOpp.company}</b>」生成简历优化报告。
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
                            生成报告
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
                          <p className="text-blue-700 text-sm">AI正在为你生成简历优化报告，请稍候...</p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">简历优化报告</label>
                        <textarea
                          value={resumeReportContent}
                          onChange={(e) => setResumeReportContent(e.target.value)}
                          rows={20}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none text-sm"
                          disabled={aiGenerating}
                          style={{ whiteSpace: 'pre-wrap' }}
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
                          返回机会雷达
                        </a>
                        <button
                          onClick={() => {
                            // 复制报告内容到剪贴板
                            if (resumeReportContent) {
                              navigator.clipboard.writeText(resumeReportContent).then(() => {
                                alert('报告内容已复制到剪贴板！')
                              }).catch(() => {
                                alert('复制失败，请手动选择文本复制')
                              })
                            }
                          }}
                          disabled={aiGenerating || !resumeReportContent.trim()}
                          className="px-5 py-2 rounded-full bg-blue-500 text-white cta-button disabled:opacity-60"
                        >
                          复制报告
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                

              </div>
            </section>
          </div>
        )}

        {/* 破冰工坊页面 - 简历优化报告生成功能 */}
        {currentPage === "forge" && (
          <div id="page-forge" className="page-content">
            <section className="py-12">
              <div className="container mx-auto px-6 max-w-3xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">破冰工坊</h2>
                <p className="text-gray-600 mb-6">AI分析简历与目标职位匹配度，生成个性化的求职邮件</p>
                {connOk === true && <p className="text-sm text-green-600 mb-4">已成功链接云端数据（Supabase）</p>}
                {connOk === false && (
                  <p className="text-sm text-yellow-600 mb-4">离线模式：{connErr === "连接超时" ? "网络连接超时" : connErr === "网络连接失败" ? "网络暂时不可用" : "云端服务暂时不可用"}（使用本地数据）</p>
                )}

                {!user ? (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                    <p className="text-gray-700">请先登录后生成求职邮件</p>
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
                        AI分析简历与「<b>{selectedOpp.company}</b>」的「<b>{selectedOpp.title}</b>」职位匹配度，生成个性化求职邮件。
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
                            重新生成邮件
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
                          <p className="text-blue-700 text-sm">AI正在为你生成求职邮件，请稍候...</p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">邮件主题</label>
                        <input
                          type="text"
                          value={mailSubject}
                          onChange={(e) => setMailSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                          disabled={aiGenerating}
                          placeholder="邮件主题将自动生成..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">邮件正文</label>
                        <textarea
                          value={mailBody}
                          onChange={(e) => setMailBody(e.target.value)}
                          rows={15}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none text-sm"
                          disabled={aiGenerating}
                          style={{ whiteSpace: 'pre-wrap' }}
                          placeholder="邮件正文将自动生成..."
                        />
                      </div>

                      {!resumeText && (
                        <p className="text-xs text-amber-600">
                          💡 未检测到你的简历文本，建议先到"个人主页"上传简历以获得更个性化的AI生成内容。
                        </p>
                      )}

                      <div className="flex justify-end gap-3">
                        <a
                          href="#resume-optimizer"
                          onClick={(e) => handleNavClick(e, "#resume-optimizer")}
                          className="px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-100 nav-link"
                        >
                          去往简历优化
                        </a>
                        <button
                          onClick={() => {
                            // 复制邮件内容到剪贴板
                            const emailContent = `主题: ${mailSubject}\n\n${mailBody}`
                            if (emailContent.trim()) {
                              navigator.clipboard.writeText(emailContent).then(() => {
                                alert('邮件内容已复制到剪贴板！')
                              }).catch(() => {
                                alert('复制失败，请手动选择文本复制')
                              })
                            }
                          }}
                          disabled={aiGenerating || (!mailSubject.trim() && !mailBody.trim())}
                          className="px-5 py-2 rounded-full bg-green-500 text-white cta-button disabled:opacity-60"
                        >
                          复制邮件
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                

              </div>
            </section>
          </div>
        )}

        {/* 个人资料页面 */}
        {currentPage === "profile" && (
          <div id="page-profile" className="page-content">
            <section className="py-12 bg-white relative">
              <div className="container mx-auto px-6 max-w-4xl">

                
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">个人资料</h2>
                  {connOk === true && <p className="text-sm text-green-600">已成功连接云端数据（Supabase）</p>}
                  {connOk === false && (
                    <p className="text-sm text-yellow-600">离线模式：{connErr === "连接超时" ? "网络连接超时" : connErr === "网络连接失败" ? "网络暂时不可用" : "云端服务暂时不可用"}（使用本地存储）</p>
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
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-sm">{fileUploadError}</p>
                        </div>
                      )}
                      {fileUploadSuccess && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-600 text-sm">{fileUploadSuccess}</p>
                        </div>
                      )}

                      {/* 简历表单 */}
                      {showResumeForm && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-bold text-gray-800 mb-4">{editingResume ? "编辑简历" : "新建简历"}</h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">简历标题</label>
                              <input
                                type="text"
                                value={resumeForm.title}
                                onChange={(e) => setResumeForm({ ...resumeForm, title: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                                placeholder="如：前端开发简历 - 2024"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">简历内容</label>
                              <textarea
                                value={resumeForm.content}
                                onChange={(e) => setResumeForm({ ...resumeForm, content: e.target.value })}
                                rows={8}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                                placeholder="请输入你的简历内容..."
                              />
                            </div>
                            {resumeError && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{resumeError}</p>
                              </div>
                            )}
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={cancelResumeForm}
                                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                              >
                                取消
                              </button>
                              <button
                                onClick={editingResume ? handleUpdateResume : handleCreateResume}
                                disabled={resumeLoading}
                                className="px-4 py-2 rounded-lg bg-green-500 text-white cta-button disabled:opacity-60"
                              >
                                {resumeLoading ? "保存中..." : editingResume ? "更新" : "创建"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 简历列表 */}
                      <div className="space-y-4">
                        {resumes.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>还没有简历，点击上方按钮创建或上传你的第一份简历</p>
                          </div>
                        ) : (
                          resumes.map((resume) => (
                            <div
                              key={resume.id}
                              className={`p-4 rounded-lg border transition-colors ${
                                selectedResumeId === resume.id
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-800">{resume.title}</h4>
                                  <p className="text-sm text-gray-500">
                                    创建时间：{new Date(resume.created_at).toLocaleDateString("zh-CN")}
                                    {resume.updated_at !== resume.created_at && (
                                      <span className="ml-2">
                                        · 更新时间：{new Date(resume.updated_at).toLocaleDateString("zh-CN")}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {resume.content.slice(0, 100)}...
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <button
                                    onClick={() => handleSelectResume(resume.id)}
                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                      selectedResumeId === resume.id
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                                  >
                                    {selectedResumeId === resume.id ? "当前使用" : "选择"}
                                  </button>
                                  <button
                                    onClick={() => handleEditResume(resume)}
                                    className="px-3 py-1 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                  >
                                    编辑
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResume(resume.id)}
                                    className="px-3 py-1 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 寻找机会按钮 - 可拖拽移动 */}
                <button
                  onClick={handleButtonClick}
                  onMouseDown={handleMouseDown}
                  className={`fixed text-white font-semibold py-3 px-6 rounded-lg z-50 select-none ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{
                    left: buttonPosition.x || 'auto',
                    top: buttonPosition.y || 'auto',
                    right: buttonPosition.x ? 'auto' : '2rem',
                    bottom: buttonPosition.y ? 'auto' : '2rem',
                    background: 'linear-gradient(to right, #3B82F6, #1D4ED8)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.35)';
                  }}
                >
                  去往机会雷达
                </button>
              </div>
            </section>
          </div>
        )}

        {/* 网页爬虫页面 */}
        {currentPage === "scraper" && (
          <div id="page-scraper" className="page-content">
            <section className="py-12 bg-gray-50 min-h-screen">
              <div className="container mx-auto px-6 max-w-4xl">
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">网页爬虫</h2>
                  <p className="text-gray-600">爬取网页内容，获取招聘信息和公司动态</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      目标网址 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="url"
                        value={crawlUrl}
                        onChange={(e) => setCrawlUrl(e.target.value)}
                        placeholder="https://example.com/careers"
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        disabled={crawling}
                      />
                      <button
                        onClick={handleCrawl}
                        disabled={crawling || !crawlUrl.trim()}
                        className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-60 transition-colors font-medium"
                      >
                        {crawling ? "爬取中..." : "开始爬取"}
                      </button>
                    </div>
                  </div>

                  {/* 爬取状态 */}
                  {crawling && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-blue-700 text-sm">正在爬取网页内容，请稍候...</p>
                      </div>
                    </div>
                  )}

                  {/* 错误信息 */}
                  {crawlError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{crawlError}</p>
                    </div>
                  )}

                  {/* 爬取结果 */}
                  {crawlResult && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">爬取结果</h3>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                          {crawlResult}
                        </pre>
                      </div>
                      <div className="mt-3 flex gap-3">
                        <button
                          onClick={() => navigator.clipboard.writeText(crawlResult)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          复制内容
                        </button>
                        <button
                          onClick={() => setCrawlResult(null)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                        >
                          清除结果
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 使用说明 */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-bold text-yellow-800 mb-2">使用说明</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• 输入完整的网址（包含 https://）</li>
                      <li>• 支持爬取大部分公开网页内容</li>
                      <li>• 爬取结果会显示网页的文本内容</li>
                      <li>• 可以用于获取招聘页面、公司动态等信息</li>
                      <li>• 请遵守网站的robots.txt和使用条款</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 机会管理页面 */}
        {currentPage === "opportunity-manager" && (
          <div id="page-opportunity-manager" className="page-content">
            <section className="py-12 bg-gray-50 min-h-screen">
              <div className="container mx-auto px-6 max-w-6xl">
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">机会管理</h2>
                      <p className="text-gray-600">管理和添加新的职业机会</p>
                    </div>
                    <button
                      onClick={() => setShowOpportunityForm(true)}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      添加新机会
                    </button>
                  </div>
                </div>

                {/* 统计信息 */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 fade-in-element">
                    <div className="text-2xl font-bold text-green-600">{opportunityStats.total_opportunities}</div>
                    <div className="text-sm text-gray-500">总机会数</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 fade-in-element">
                    <div className="text-2xl font-bold text-orange-600">{opportunityStats.expiring_soon}</div>
                    <div className="text-sm text-gray-500">即将过期</div>
                  </div>
                </div>



                {/* 添加机会表单 */}
                {showOpportunityForm && (
                  <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-800">
                        {editingOpportunity ? "编辑机会" : "添加新机会"}
                      </h3>
                      <button
                        onClick={() => {
                          setShowOpportunityForm(false)
                          setEditingOpportunity(null)
                          setOpportunityForm({
                            company: "",
                            position: "",
                            location: "",
                            salary: "",
                            description: "",
                            requirements: "",
                            contact: "",
                            url: "",
                          })
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={editingOpportunity ? handleUpdateOpportunityNew : handleAddOpportunityNew} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            公司名称 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={opportunityForm.company}
                            onChange={(e) => setOpportunityForm({ ...opportunityForm, company: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            职位名称 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={opportunityForm.position}
                            onChange={(e) => setOpportunityForm({ ...opportunityForm, position: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">工作地点</label>
                          <input
                            type="text"
                            value={opportunityForm.location}
                            onChange={(e) => setOpportunityForm({ ...opportunityForm, location: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">薪资范围</label>
                          <input
                            type="text"
                            value={opportunityForm.salary}
                            onChange={(e) => setOpportunityForm({ ...opportunityForm, salary: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                            placeholder="如：15-25K"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">职位描述</label>
                        <textarea
                          value={opportunityForm.description}
                          onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">任职要求</label>
                        <textarea
                          value={opportunityForm.requirements}
                          onChange={(e) => setOpportunityForm({ ...opportunityForm, requirements: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
                          <input
                            type="text"
                            value={opportunityForm.contact}
                            onChange={(e) => setOpportunityForm({ ...opportunityForm, contact: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                            placeholder="邮箱或电话"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">相关链接</label>
                          <input
                            type="url"
                            value={opportunityForm.url}
                            onChange={(e) => setOpportunityForm({ ...opportunityForm, url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowOpportunityForm(false)
                            setEditingOpportunity(null)
                            setOpportunityForm({
                              company: "",
                              position: "",
                              location: "",
                              salary: "",
                              description: "",
                              requirements: "",
                              contact: "",
                              url: "",
                            })
                          }}
                          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors font-medium"
                        >
                          {editingOpportunity ? "更新机会" : "添加机会"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 机会列表 */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">
                      管理员机会列表 ({adminOpportunities.length})
                    </h3>
                  </div>

                  {adminOpportunities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p>还没有添加任何机会</p>
                      <p className="text-sm mt-1">点击上方"添加新机会"按钮开始添加</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {adminOpportunities.map((opportunity) => (
                        <div key={opportunity.id} className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-bold text-gray-800">{opportunity.company}</h4>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  {opportunity.position}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                {opportunity.location && (
                                  <p><strong>地点：</strong>{opportunity.location}</p>
                                )}
                                {opportunity.salary && (
                                  <p><strong>薪资：</strong>{opportunity.salary}</p>
                                )}
                                {opportunity.description && (
                                  <p><strong>描述：</strong>{opportunity.description}</p>
                                )}
                                {opportunity.requirements && (
                                  <p><strong>要求：</strong>{opportunity.requirements}</p>
                                )}
                                {opportunity.contact && (
                                  <p><strong>联系：</strong>{opportunity.contact}</p>
                                )}
                                {opportunity.url && (
                                  <p><strong>链接：</strong>
                                    <a href={opportunity.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                      {opportunity.url}
                                    </a>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => {
                                  setEditingOpportunity(opportunity)
                                  setOpportunityForm({
                                    company: opportunity.company,
                                    position: opportunity.position,
                                    location: opportunity.location || "",
                                    salary: opportunity.salary || "",
                                    description: opportunity.description || "",
                                    requirements: opportunity.requirements || "",
                                    contact: opportunity.contact || "",
                                    url: opportunity.url || "",
                                  })
                                  setShowOpportunityForm(true)
                                }}
                                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteOpportunity(opportunity.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
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
              </div>
            </section>
          </div>
        )}

        {/* 其他管理员页面保持不变... */}
      </main>
    </div>
  )
}
