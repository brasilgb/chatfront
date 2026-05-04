export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  success: boolean
  answer?: string
  reply?: string
  intent?: any
  error?: string
}

export interface HealthResponse {
  ok: boolean
  ollama: boolean
  models?: Array<{ name: string }>
  error?: string
}