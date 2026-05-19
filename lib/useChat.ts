import { useState, useCallback, useEffect } from 'react'
import { chatApi } from './api'
import { Message } from './types/chat'

function createSessionId() {
  if (typeof window === 'undefined') {
    return ''
  }

  const key = 'chatbot_session_id'
  let sessionId = window.localStorage.getItem(key)

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    window.localStorage.setItem(key, sessionId)
  }

  return sessionId
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    setSessionId(createSessionId())
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return
      if (!sessionId) return

      setError(null)

      const userMessage: Message = {
        role: 'user',
        content,
      }

      setMessages((prev) => [...prev, userMessage])
      setLoading(true)

      try {
        const response = await chatApi.sendMessage(content, sessionId)

        const answer = response.answer || response.reply || ''
        const imagePath = response.image_path || response.imagePath || null

        if (answer) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: answer,
              image_path: imagePath,
              options: response.options || [],
            },
          ])
        } else {
          setError(response.error || 'Erro ao enviar mensagem')
        }
      } catch (err) {
        console.error(err)
        setError('Erro de conexão com o servidor')
      } finally {
        setLoading(false)
      }
    },
    [sessionId]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  }
}