import { ChatResponse } from './types/chat'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const chatApi = {
  async sendMessage(message: string, sessionId: string) {
    const response = await fetch(`${API_URL}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    })

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem')
    }

    return response.json() as Promise<ChatResponse>
  },
}