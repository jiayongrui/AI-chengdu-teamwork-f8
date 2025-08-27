// API密钥管理系统
// 支持多个API密钥和自动轮换功能

interface ApiKey {
  key: string
  name: string
  priority: number // 优先级，数字越小优先级越高
  isActive: boolean
  lastUsed?: Date
  errorCount: number // 连续错误次数
  maxErrors: number // 最大允许错误次数
}

class ApiManager {
  private apiKeys: ApiKey[] = [
    {
      key: 'sk-rcikeknawpmjqisbvhcmuwqugxwklbphjbxdpefmqhgqlekf',
      name: '新增API密钥',
      priority: 1, // 最高优先级
      isActive: true,
      errorCount: 0,
      maxErrors: 3
    },
    {
      key: 'sk-ufnwysgrwnebkczychcgkvzvvinyydmppnrvgyclbwdluvpu',
      name: '原有API密钥',
      priority: 2, // 备用
      isActive: true,
      errorCount: 0,
      maxErrors: 3
    }
  ]

  private currentApiIndex = 0

  /**
   * 获取当前可用的API密钥
   */
  getCurrentApiKey(): string {
    const availableKeys = this.getAvailableKeys()
    if (availableKeys.length === 0) {
      throw new Error('没有可用的API密钥')
    }
    
    const currentKey = availableKeys[this.currentApiIndex % availableKeys.length]
    return currentKey.key
  }

  /**
   * 获取所有可用的API密钥（按优先级排序）
   */
  private getAvailableKeys(): ApiKey[] {
    return this.apiKeys
      .filter(key => key.isActive && key.errorCount < key.maxErrors)
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * 标记当前API密钥出现错误
   */
  markCurrentKeyError(error: any): void {
    const availableKeys = this.getAvailableKeys()
    if (availableKeys.length === 0) return

    const currentKey = availableKeys[this.currentApiIndex % availableKeys.length]
    currentKey.errorCount++
    currentKey.lastUsed = new Date()

    console.warn(`API密钥 ${currentKey.name} 出现错误 (${currentKey.errorCount}/${currentKey.maxErrors}):`, error)

    // 如果当前密钥错误次数过多，切换到下一个
    if (currentKey.errorCount >= currentKey.maxErrors) {
      console.warn(`API密钥 ${currentKey.name} 已达到最大错误次数，将被暂时禁用`)
      this.switchToNextKey()
    }
  }

  /**
   * 标记当前API密钥使用成功
   */
  markCurrentKeySuccess(): void {
    const availableKeys = this.getAvailableKeys()
    if (availableKeys.length === 0) return

    const currentKey = availableKeys[this.currentApiIndex % availableKeys.length]
    currentKey.errorCount = 0 // 重置错误计数
    currentKey.lastUsed = new Date()
  }

  /**
   * 切换到下一个可用的API密钥
   */
  switchToNextKey(): void {
    const availableKeys = this.getAvailableKeys()
    if (availableKeys.length <= 1) {
      console.warn('没有更多可用的API密钥进行切换')
      return
    }

    this.currentApiIndex = (this.currentApiIndex + 1) % availableKeys.length
    const newKey = availableKeys[this.currentApiIndex]
    console.log(`已切换到API密钥: ${newKey.name}`)
  }

  /**
   * 重置所有API密钥的错误计数（用于定期重置）
   */
  resetAllErrorCounts(): void {
    this.apiKeys.forEach(key => {
      key.errorCount = 0
    })
    console.log('已重置所有API密钥的错误计数')
  }

  /**
   * 获取API使用状态信息
   */
  getStatus(): { currentKey: string; availableCount: number; totalCount: number } {
    const availableKeys = this.getAvailableKeys()
    const currentKey = availableKeys.length > 0 
      ? availableKeys[this.currentApiIndex % availableKeys.length].name 
      : '无可用密钥'
    
    return {
      currentKey,
      availableCount: availableKeys.length,
      totalCount: this.apiKeys.length
    }
  }

  /**
   * 添加新的API密钥
   */
  addApiKey(key: string, name: string, priority: number = 999): void {
    this.apiKeys.push({
      key,
      name,
      priority,
      isActive: true,
      errorCount: 0,
      maxErrors: 3
    })
    
    // 重新排序
    this.apiKeys.sort((a, b) => a.priority - b.priority)
    console.log(`已添加新的API密钥: ${name}`)
  }

  /**
   * 禁用指定的API密钥
   */
  disableApiKey(keyOrName: string): void {
    const key = this.apiKeys.find(k => k.key === keyOrName || k.name === keyOrName)
    if (key) {
      key.isActive = false
      console.log(`已禁用API密钥: ${key.name}`)
    }
  }

  /**
   * 启用指定的API密钥
   */
  enableApiKey(keyOrName: string): void {
    const key = this.apiKeys.find(k => k.key === keyOrName || k.name === keyOrName)
    if (key) {
      key.isActive = true
      key.errorCount = 0 // 重置错误计数
      console.log(`已启用API密钥: ${key.name}`)
    }
  }
}

// 创建全局API管理器实例
export const apiManager = new ApiManager()

// 定期重置错误计数（每小时）
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiManager.resetAllErrorCounts()
  }, 60 * 60 * 1000) // 1小时
}

export default apiManager