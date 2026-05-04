'use client'

import { useChat } from '@/lib/useChat'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import Link from 'next/link'

export default function ChatBox() {
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  } = useChat()

  const handleSendMessage = async (message: string) => {
    await sendMessage(message)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-700">🤖 Chatbot</h1>

        <Link
        href={'/dashboard'}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Dashboard
        </Link>
      </div>

      <MessageList messages={messages} loading={loading} />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
          {error}
        </div>
      )}

      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={loading}
      />
    </div>
  )
}