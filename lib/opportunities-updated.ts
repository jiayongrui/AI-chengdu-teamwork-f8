import type { Opportunity } from "@/types/opportunity"
import {
  fetchOpportunities,
  getLocalOpportunities,
  setLocalOpportunities,
  type OpportunityView,
} from "./opportunities-db"

// 转换数据库格式到应用格式
function convertDbToApp(dbOpp: OpportunityView): Opportunity {
  return {
    id: dbOpp.id,
    company: dbOpp.company,
    title: dbOpp.title,
    city: dbOpp.city,
    tags: dbOpp.tags || [],
    reason: dbOpp.reason,
  }
}

// 获取机会列表（带降级）
export async function getAllOpportunities(): Promise<Opportunity[]> {
  try {
    const dbOpportunities = await fetchOpportunities(50)
    const appOpportunities = dbOpportunities.map(convertDbToApp)

    // 缓存到本地存储
    setLocalOpportunities(dbOpportunities)

    return appOpportunities
  } catch (error) {
    console.warn("从数据库获取机会失败，使用本地缓存:", error)

    // 降级到本地存储
    const localOpportunities = getLocalOpportunities()
    return localOpportunities.map(convertDbToApp)
  }
}

// 搜索机会
export async function searchOpportunitiesWithFallback(keyword: string): Promise<Opportunity[]> {
  try {
    const { searchOpportunities } = await import("./opportunities-db")
    const dbOpportunities = await searchOpportunities({ keyword, limit: 20 })
    return dbOpportunities.map(convertDbToApp)
  } catch (error) {
    console.warn("搜索失败，使用本地过滤:", error)

    // 降级到本地搜索
    const localOpportunities = getLocalOpportunities()
    const filtered = localOpportunities.filter(
      (opp) =>
        opp.company.toLowerCase().includes(keyword.toLowerCase()) ||
        opp.title.toLowerCase().includes(keyword.toLowerCase()),
    )
    return filtered.map(convertDbToApp)
  }
}

// 按地区获取机会
export async function getOpportunitiesByLocation(location: string): Promise<Opportunity[]> {
  try {
    const { searchOpportunities } = await import("./opportunities-db")
    const dbOpportunities = await searchOpportunities({ location, limit: 20 })
    return dbOpportunities.map(convertDbToApp)
  } catch (error) {
    console.warn("按地区获取失败，使用本地过滤:", error)

    const localOpportunities = getLocalOpportunities()
    const filtered = localOpportunities.filter((opp) => opp.city?.toLowerCase().includes(location.toLowerCase()))
    return filtered.map(convertDbToApp)
  }
}

// 获取热门机会（高优先级）
export async function getTrendingOpportunities(): Promise<Opportunity[]> {
  try {
    const dbOpportunities = await fetchOpportunities(10)
    // 按优先级排序，取前10个
    const trending = dbOpportunities.sort((a, b) => b.priority - a.priority).slice(0, 10)
    return trending.map(convertDbToApp)
  } catch (error) {
    console.warn("获取热门机会失败，使用本地数据:", error)

    const localOpportunities = getLocalOpportunities()
    const trending = localOpportunities.sort((a, b) => b.priority - a.priority).slice(0, 10)
    return trending.map(convertDbToApp)
  }
}
