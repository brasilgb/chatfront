'use client'

import { useState } from 'react'
import { useChat } from '@/lib/useChat'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function ChatBox() {
  const {
    messages,
    loading,
    streaming,
    error,
    sendMessage,
    clearMessages,
  } = useChat()
  const [useStream, setUseStream] = useState(false)

  const handleSendMessage = async (message: string) => {
    await sendMessage(message, useStream)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-700">🤖 Chatbot</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useStream}
              onChange={(e) => setUseStream(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Streaming</span>
          </label>
          <button
            onClick={clearMessages}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={loading || streaming}
      />

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
          {error}
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={loading || streaming}
      />
    </div>
  )
}