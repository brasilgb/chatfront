import { Message, ChatResponse, HealthResponse } from './types/chat'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const chatApi = {
  async sendMessage(message: string, history: Message[] = [], date?: string) {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history, date }),
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

  async *streamMessage(message: string, history: Message[] = [], date?: string, signal?: AbortSignal) {
    const response = await fetch(`${API_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history, date }),
      signal,
    })

    if (!response.ok) {
      throw new Error('Erro ao fazer stream')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    if (!reader) return

    try {
      while (true) {
        if (signal?.aborted) break

        const { done, value } = await reader.read()
        if (done) {
          if (buffer.trim().startsWith('data: ')) {
            yield buffer.trim().slice(6)
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // O último elemento pode ser incompleto
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            yield trimmed.slice(6)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  },
}
