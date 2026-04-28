# Frontend Next.js - Guia de Integração com o Backend

Este é um guia para integrar o frontend Next.js com o backend do chatbot.

## 📦 Setup do Projeto Next.js

### 1. Criar o projeto Next.js

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint
cd frontend
```

### 2. Instalar dependências adicionais (opcional)

```bash
npm install axios zustand react-markdown react-syntax-highlighter
```

### 3. Configurar variáveis de ambiente

Criar `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Para produção bare metal com Nginx no mesmo domínio do frontend:

```env
NEXT_PUBLIC_API_URL=/api
```

Se a API estiver em outro domínio ou subdomínio:

```env
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com/api
```

### 4. Estrutura de pastas recomendada

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
├── components/
│   ├── ChatBox.tsx
│   ├── MessageList.tsx
│   └── MessageInput.tsx
├── lib/
│   ├── useChat.ts
│   └── api.ts
├── types/
│   └── chat.ts
├── .env.local
└── package.json
```

## 🛠️ Implementação

### 1. Criar tipos TypeScript

```typescript
// lib/types/chat.ts
export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  success: boolean
  reply: string
  model?: string
  error?: string
}

export interface HealthResponse {
  ok: boolean
  ollama: boolean
  models?: Array<{ name: string }>
  error?: string
}
```

### 2. Criar cliente da API

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL

export const chatApi = {
  async sendMessage(message: string, history: Message[] = [], date?: string) {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history, date }),
    })

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem')
    }

    return response.json() as Promise<ChatResponse>
  },

  async checkHealth() {
    const response = await fetch(`${API_URL}/chat/health`)
    return response.json() as Promise<HealthResponse>
  },

  async *streamMessage(message: string, history: Message[] = [], date?: string) {
    const response = await fetch(`${API_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, history, date }),
    })

    if (!response.ok) {
      throw new Error('Erro ao fazer stream')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    if (!reader) return

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          if (buffer.trim().startsWith('data: ')) {
            yield buffer.trim().slice(6)
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // O último elemento pode ser incompleto
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            yield trimmed.slice(6)
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  },
}
```

### 3. Criar hook useChat

```typescript
// lib/useChat.ts
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
    async (content: string, useStream = false, date?: string) => {
      if (!content.trim()) return

      setError(null)
      setMessages((prev) => [...prev, { role: 'user', content }])

      if (useStream) {
        setStreaming(true)
        let fullResponse = ''

        try {
          for await (const chunk of chatApi.streamMessage(
            content,
            messages,
            date
          )) {
            try {
              const data = JSON.parse(chunk)
              fullResponse += data.message?.content || ''
              
              // Opcional: Atualizar a última mensagem em tempo real
              // setMessages(prev => ...)
            } catch {
              // Ignorar chunks não-JSON
            }
          }

          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: fullResponse },
          ])
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Erro ao fazer stream'
          )
        } finally {
          setStreaming(false)
        }
      } else {
        setLoading(true)

        try {
          const response = await chatApi.sendMessage(content, messages, date)

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
```

### 4. Criar componente de Chat

```typescript
// components/ChatBox.tsx
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
        <h1 className="text-2xl font-bold">🤖 Chatbot</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useStream}
              onChange={(e) => setUseStream(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Streaming</span>
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
```

### 5. Componente MessageList

```typescript
// components/MessageList.tsx
import { useEffect, useRef } from 'react'
import { Message } from '@/lib/types/chat'

interface MessageListProps {
  messages: Message[]
  loading: boolean
}

export default function MessageList({ messages, loading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-center">
            Inicie uma conversa! 👋
          </p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-black'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}

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
```

### 6. Componente MessageInput

```typescript
// components/MessageInput.tsx
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
```

### 7. Integrar no page.tsx

```typescript
// app/page.tsx
import ChatBox from '@/components/ChatBox'

export default function Home() {
  return <ChatBox />
}
```

## ▶️ Executar tudo junto

### Terminal 1 - Ollama

```bash
ollama serve
```

### Terminal 2 - Backend

```bash
cd chatbot
npm install
npm run dev
```

### Terminal 3 - Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: `http://localhost:3000`

## 🚀 Deploy Bare Metal com Nginx

### Backend

No servidor, deixe o backend rodando em `127.0.0.1:3001` com:

```env
PORT=3001
HOST=127.0.0.1
NODE_ENV=production
OLLAMA_URL=http://127.0.0.1:11434
MODEL=gemma3:4b
FRONTEND_URL=https://seu-dominio.com
```

Use um gerenciador de processo, como `systemd` ou `pm2`, para manter o Node ativo.

Teste no servidor:

```bash
curl http://127.0.0.1:3001/health
curl http://127.0.0.1:3001/api/chat/health
curl -X POST http://127.0.0.1:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Responda exatamente: TESTE_GEMMA_OK"}'
```

### Frontend

Se o Nginx publica o frontend e também repassa `/api` para o backend, configure:

```env
NEXT_PUBLIC_API_URL=/api
```

Exemplo de proxy Nginx para a API:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /health {
    proxy_pass http://127.0.0.1:3001/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

Depois do Nginx configurado, teste pelo domínio:

```bash
curl https://seu-dominio.com/health
curl https://seu-dominio.com/api/chat/health
```

### WhatsApp Business

O frontend não precisa mudar para o WhatsApp. O canal WhatsApp usa o mesmo backend e o mesmo `chatService`:

```txt
WhatsApp Business -> /api/whatsapp/webhook -> chatService.chat() -> Ollama/Gemma
```

No painel da Meta, configure o webhook público:

```txt
https://seu-dominio.com/api/whatsapp/webhook
```

O Nginx já atende esse endpoint se `/api/` estiver apontando para `127.0.0.1:3001`.

## 🔗 Links Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
