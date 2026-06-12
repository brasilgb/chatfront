export interface ChatOption {
  id?: string
  label: string
  value: string
  message: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  image_url?: string | null
  image_path?: string | null
  options?: ChatOption[]
}

export interface ChatIntent {
  modulo: string | null
  tipo: string | null
  departamento: number | null
  departamento_nome: string | null
  data: string | null
  data_inicio: string | null
  data_fim: string | null
  pergunta: string | null
}

export interface ChatResponse {
  success: boolean
  answer: string
  reply?: string
  intent?: ChatIntent
  error?: string
  image_url?: string | null
  image_path?: string | null
  imageUrl?: string | null
  imagePath?: string | null
  options?: ChatOption[]
}

export interface HealthResponse {
  ok: boolean
  ollama: boolean
  models?: Array<{ name: string }>
  error?: string
}
