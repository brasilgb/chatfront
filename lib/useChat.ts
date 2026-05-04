import { useState, useCallback } from 'react'
import { chatApi } from './api'
import { Message } from './types/chat'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (content: string, date?: string) => {
      if (!content.trim()) return

      setError(null)

      const userMessage: Message = {
        role: 'user',
        content,
      }

      const history = [...messages, userMessage]

      setMessages(history)
      setLoading(true)

      try {

        const response = await chatApi.sendMessage(content, history, date)

        const answer = response.answer || response.reply || ''

        if (response.success && answer) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: answer,
            },
          ])
        } else {
          setError(response.error || answer || 'Erro desconhecido')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erro ao enviar mensagem'
        )
      } finally {
        setLoading(false)
      }
    },
    [messages]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    loading,
    streaming: false,
    error,
    sendMessage,
    clearMessages,
    cancelStreaming: () => { },
  }
}