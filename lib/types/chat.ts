export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  success: boolean
  reply: string
  model?: string
  error?: string
}

export interface HealthResponse {
  ok: boolean
  ollama: boolean
  models?: Array<{ name: string }>
  error?: string
}