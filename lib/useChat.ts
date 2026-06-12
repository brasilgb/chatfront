'use client'

import { useState, useCallback, useEffect } from 'react'
import { chatApi } from './api'
import { Message } from './types/chat'

const SESSION_KEY = 'chatbot_session_id'
const STORAGE_VERSION_KEY = 'chatbot_storage_version'

// Altere essa versão sempre que atualizar backend/contexto e quiser forçar nova sessão
const STORAGE_VERSION =
  process.env.NEXT_PUBLIC_CHATBOT_STORAGE_VERSION || '2026-06-11-01'

function resetChatbotStorageIfNeeded() {
  if (typeof window === 'undefined') return

  const currentVersion = window.localStorage.getItem(STORAGE_VERSION_KEY)

  if (currentVersion !== STORAGE_VERSION) {
    window.localStorage.removeItem(SESSION_KEY)

    // Caso existam outras chaves antigas do chatbot
    window.localStorage.removeItem('chatbot_messages')
    window.localStorage.removeItem('chatbot_context')
    window.localStorage.removeItem('chatbot_pending_selection')

    window.localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION)
  }
}

function createSessionId() {
  if (typeof window === 'undefined') return ''

  resetChatbotStorageIfNeeded()

  let sessionId = window.localStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    if (window.crypto?.randomUUID) {
      sessionId = window.crypto.randomUUID()
    } else {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }

    window.localStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    const id = createSessionId()
    console.log('SESSION_ID:', id)
    setSessionId(id)
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      if (!sessionId) {
        setError('Sessão não iniciada')
        return
      }

      console.log('ENVIANDO SESSION_ID:', sessionId)

      setError(null)

      const userMessage: Message = {
        role: 'user',
        content,
      }

      setMessages((prev) => [...prev, userMessage])
      setLoading(true)

      try {
        const response = await chatApi.sendMessage(content, sessionId)

        console.log('CHAT RESPONSE COMPLETA:', response)

        const answer = response.answer || response.reply || ''
        const imageUrl =
          response.image_url ||
          response.image_path ||
          response.imageUrl ||
          response.imagePath ||
          null

        if (answer) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: answer,
              image_url: imageUrl,
              image_path: imageUrl,
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
    sessionId,
  }
}