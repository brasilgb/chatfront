import { Message, ChatResponse, HealthResponse } from './types/chat'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const chatApi = {
  async sendMessage(message: string, history: Message[] = [], date?: string) {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        date,
      }),
    })

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem')
    }

    return response.json() as Promise<ChatResponse>
  },

  async checkHealth() {
    const response = await fetch(`${API_URL}/health`)

    if (!response.ok) {
      throw new Error('Erro ao verificar saúde da API')
    }

    return response.json() as Promise<HealthResponse>
  },
}