import { useEffect, useRef } from 'react'
import { Message } from '@/lib/types/chat'

interface MessageListProps {
  messages: Message[]
  loading: boolean
}

function resolverImageUrl(msg: Message): string | null {
  const path = msg.image_url || msg.image_path

  if (!path) return null

  if (path.startsWith('http')) {
    return path
  }

  return path.startsWith('/') ? path : `/${path}`
}

export default function MessageList({ messages, loading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-center">
            Inicie uma conversa! 👋
          </p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const imageUrl = resolverImageUrl(msg)

        return (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
          >
            <div
              className={`px-4 py-2 rounded-lg ${msg.role === 'user'
                  ? 'max-w-xs lg:max-w-md bg-blue-500 text-white'
                  : 'max-w-xs sm:max-w-2xl lg:max-w-4xl bg-gray-300 text-black'
                }`}
            >
              <div className="space-y-3">
                {msg.content && (
                  <p className="whitespace-pre-line">{msg.content}</p>
                )}

                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.options.map((option) => (
                      <button
                        key={option.id || option.value}
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('chat-select-option', {
                              detail: option.message,
                            })
                          )
                        }}
                        className="rounded-lg border border-gray-400 bg-white px-3 py-2 text-sm text-black hover:bg-gray-100 transition"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {imageUrl && (
                  <a href={imageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={imageUrl}
                      alt="Relatório"
                      className="mt-2 max-w-full rounded-lg border bg-white shadow-sm"
                    />
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {loading && (
        <div className="flex justify-start">
          <div className="bg-gray-300 text-black px-4 py-2 rounded-lg">
            <div className="flex gap-1">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce delay-100">●</span>
              <span className="animate-bounce delay-200">●</span>
            </div>
          </div>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  )
}
