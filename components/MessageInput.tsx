import { useState } from 'react'

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>
  disabled: boolean
}

export default function MessageInput({
  onSendMessage,
  disabled,
}: MessageInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      await onSendMessage(input)
      setInput('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-t p-4 flex gap-2"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        placeholder="Digite uma mensagem..."
        className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={disabled}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
      >
        Enviar
      </button>
    </form>
  )
}