import { useState, useCallback, useRef } from 'react'
import { chatApi } from './api'
import { Message, ChatResponse } from './types/chat'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string, useStream = false) => {
      if (!content.trim()) return

      setError(null)
      setMessages((prev) => [...prev, { role: 'user', content }])

      if (useStream) {
        setStreaming(true)
        let fullResponse = ''

        abortControllerRef.current = new AbortController()

        try {
          for await (const chunk of chatApi.streamMessage(
            content,
            messages,
            abortControllerRef.current?.signal
          )) {
            if (abortControllerRef.current?.signal.aborted) break

            try {
              const data = JSON.parse(chunk)
              const newContent = data.message?.content || ''
              fullResponse += newContent

              // Update the last message in real-time
              setMessages((prev) => {
                const newMessages = [...prev]
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                  newMessages[newMessages.length - 1].content = fullResponse
                } else {
                  newMessages.push({ role: 'assistant', content: fullResponse })
                }
                return newMessages
              })
            } catch {
              // Ignorar linhas que não são JSON válido
            }
          }
        } catch (err) {
          if (!abortControllerRef.current?.signal.aborted) {
            setError(
              err instanceof Error ? err.message : 'Erro ao fazer stream'
            )
          }
        } finally {
          setStreaming(false)
          abortControllerRef.current = null
        }
      } else {
        setLoading(true)

        try {
          const response = await chatApi.sendMessage(content, messages)

          if (response.success) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', content: response.reply },
            ])
          } else {
            setError(response.error || 'Erro desconhecido')
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Erro ao enviar mensagem'
          )
        } finally {
          setLoading(false)
        }
      }
    },
    [messages]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setStreaming(false)
      abortControllerRef.current = null
    }
  }, [])

  return {
    messages,
    loading,
    streaming,
    error,
    sendMessage,
    clearMessages,
    cancelStreaming,
  }
}