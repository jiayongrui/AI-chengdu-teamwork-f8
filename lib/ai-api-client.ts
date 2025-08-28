// AI API客户端 - 集成API轮换逻辑
import { apiManager } from './api-manager'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatCompletionRequest {
  model?: string
  messages: ChatMessage[]
  max_tokens?: number
  temperature?: number
  stream?: boolean
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 通用AI API调用函数，支持自动API轮换
 */
export async function callAiApi(
  request: ChatCompletionRequest,
  maxRetries: number = 3
): Promise<ChatCompletionResponse> {
  const defaultRequest: ChatCompletionRequest = {
    model: 'deepseek-ai/DeepSeek-V3',
    max_tokens: 4000,
    temperature: 0.7,
    ...request
  }

  let lastError: Error | null = null
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      const apiKey = apiManager.getCurrentApiKey()
      const status = apiManager.getStatus()
      
      console.log(`尝试使用API密钥: ${status.currentKey} (第${retryCount + 1}次尝试)`)

      // 清理prompt中的特殊字符
      const cleanedMessages = defaultRequest.messages.map(msg => ({
        ...msg,
        content: msg.content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim()
      }))

      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          ...defaultRequest,
          messages: cleanedMessages
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`API调用失败: ${response.status} ${response.statusText} - ${errorText}`)
        
        // 检查是否是余额不足或API密钥问题
        if (response.status === 401 || response.status === 429 || 
            errorText.includes('insufficient') || errorText.includes('quota') ||
            errorText.includes('balance') || errorText.includes('limit')) {
          console.warn(`API密钥可能余额不足或达到限制: ${response.status}`)
          apiManager.markCurrentKeyError(error)
          
          // 如果还有其他可用的API密钥，继续重试
          const newStatus = apiManager.getStatus()
          if (newStatus.availableCount > 0) {
            retryCount++
            continue
          }
        }
        
        throw error
      }

      const result: ChatCompletionResponse = await response.json()
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('API返回格式错误：缺少choices或message字段')
      }

      // 标记成功使用
      apiManager.markCurrentKeySuccess()
      
      console.log(`API调用成功，使用密钥: ${status.currentKey}`)
      return result

    } catch (error) {
      lastError = error as Error
      console.error(`API调用失败 (第${retryCount + 1}次):`, error)
      
      // 标记当前密钥错误
      apiManager.markCurrentKeyError(error)
      
      retryCount++
      
      // 如果还有重试机会，等待一段时间后重试
      if (retryCount < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000) // 指数退避，最大5秒
        console.log(`等待 ${waitTime}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  // 所有重试都失败了
  const status = apiManager.getStatus()
  throw new Error(`所有API调用尝试都失败了。当前状态: ${status.currentKey}, 可用密钥: ${status.availableCount}/${status.totalCount}。最后错误: ${lastError?.message}`)
}

/**
 * 简化的AI文本生成函数
 */
export async function generateAiText(
  prompt: string,
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
  } = {}
): Promise<string> {
  const response = await callAiApi({
    model: options.model || 'deepseek-ai/DeepSeek-V3',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: options.maxTokens || 4000,
    temperature: options.temperature || 0.7
  })

  return response.choices[0].message.content
}

/**
 * 获取API使用状态
 */
export function getApiStatus() {
  return apiManager.getStatus()
}

/**
 * 手动切换到下一个API密钥
 */
export function switchApiKey() {
  apiManager.switchToNextKey()
}

/**
 * 重置所有API密钥的错误计数
 */
export function resetApiErrors() {
  apiManager.resetAllErrorCounts()
}