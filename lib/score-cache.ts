// 新建评分缓存模块
import { md5 } from './md5';

interface ScoreCache {
  [key: string]: {
    score: number
    breakdown: any[]
    timestamp: number
    ttl: number // 缓存有效期（毫秒）
  }
}

const SCORE_CACHE_KEY = 'score-cache'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24小时

export function getScoreFromCache(resumeHash: string, opportunityId: string): any | null {
  try {
    const cache: ScoreCache = JSON.parse(localStorage.getItem(SCORE_CACHE_KEY) || '{}')
    const key = `${resumeHash}-${opportunityId}`
    const cached = cache[key]
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return {
        score: cached.score,
        breakdown: cached.breakdown
      }
    }
  } catch (error) {
    console.warn('缓存读取失败:', error)
  }
  return null
}

export function setScoreToCache(resumeHash: string, opportunityId: string, score: number, breakdown: any[]) {
  try {
    const cache: ScoreCache = JSON.parse(localStorage.getItem(SCORE_CACHE_KEY) || '{}')
    const key = `${resumeHash}-${opportunityId}`
    
    cache[key] = {
      score,
      breakdown,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    }
    
    // 清理过期缓存
    Object.keys(cache).forEach(k => {
      if (Date.now() - cache[k].timestamp >= cache[k].ttl) {
        delete cache[k]
      }
    })
    
    localStorage.setItem(SCORE_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn('缓存写入失败:', error)
  }
}

// 生成简历哈希
export function generateResumeHash(resumeText: string): string {
  // 简单哈希算法
  let hash = 0
  for (let i = 0; i < resumeText.length; i++) {
    const char = resumeText.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return Math.abs(hash).toString(36)
}

// 新增评分缓存模块
interface CachedScore {
  score: any;
  timestamp: number;
  resumeHash: string;
}

const CACHE_KEY_PREFIX = 'score_cache_';

export class ScoreCache {
  static generateCacheKey(resumeText: string, opportunityId: string): string {
    const resumeHash = md5(resumeText.trim());
    return `${CACHE_KEY_PREFIX}${opportunityId}_${resumeHash}`;
  }
  
  static get(resumeText: string, opportunityId: string): any | null {
    try {
      const cacheKey = this.generateCacheKey(resumeText, opportunityId);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const { score, timestamp }: CachedScore = JSON.parse(cached);
      
      // 检查缓存是否过期
      if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return score;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  static set(resumeText: string, opportunityId: string, score: any): void {
    try {
      const cacheKey = this.generateCacheKey(resumeText, opportunityId);
      const resumeHash = md5(resumeText.trim());
      
      const cacheData: CachedScore = {
        score,
        timestamp: Date.now(),
        resumeHash
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}