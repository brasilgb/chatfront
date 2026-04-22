import { Message, ChatResponse, HealthResponse } from './types/chat'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const chatApi = {
  async sendMessage(message: string, history: Message[] = []) {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history }),
    })

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem')
    }

    return response.json() as Promise<ChatResponse>
  },

  async checkHealth() {
    const response = await fetch(`${API_URL}/chat/health`)
    return response.json() as Promise<HealthResponse>
  },

  async *streamMessage(message: string, history: Message[] = [], signal?: AbortSignal) {
    const response = await fetch(`${API_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history }),
      signal,
    })

    if (!response.ok) {
      throw new Error('Erro ao fazer stream')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) return

    try {
      while (true) {
        if (signal?.aborted) break

        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter((line) => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            yield line.slice(6)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  },
}
