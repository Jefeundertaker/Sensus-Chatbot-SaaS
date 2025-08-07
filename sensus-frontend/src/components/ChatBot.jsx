import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Send, Bot, User, MessageSquare } from 'lucide-react'

export default function ChatBot({ currentUser }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Carregar histórico de mensagens
    loadChatHistory()
  }, [])

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history?per_page=10', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages.reverse())
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    if (currentUser.message_balance <= 0) {
      setError('Você não possui saldo de mensagens. Adquira um pacote para continuar.')
      return
    }

    setLoading(true)
    setError('')

    const userMessage = {
      question: inputMessage,
      created_at: new Date().toISOString(),
      user: currentUser.username
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ question: inputMessage }),
      })

      const data = await response.json()

      if (response.ok) {
        const botMessage = {
          question: data.question,
          answer: data.answer,
          created_at: new Date().toISOString(),
          user: currentUser.username
        }
        
        setMessages(prev => [...prev.slice(0, -1), botMessage])
        
        // Atualizar saldo do usuário
        currentUser.message_balance = data.remaining_balance
      } else {
        setError(data.error || 'Erro ao enviar mensagem')
        setMessages(prev => prev.slice(0, -1)) // Remove a mensagem do usuário
      }
    } catch (err) {
      setError('Erro de conexão')
      setMessages(prev => prev.slice(0, -1)) // Remove a mensagem do usuário
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Informações do usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Chatbot TOTVS Datasul</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Especialista em TOTVS Datasul e serviços da Sensus
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                Saldo: <span className="text-blue-600">{currentUser.message_balance}</span> mensagens
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat */}
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="text-lg">Conversa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Olá! Sou o assistente especializado em TOTVS Datasul.</p>
                <p className="text-sm">Como posso ajudá-lo hoje?</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="space-y-2">
                  {/* Pergunta do usuário */}
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                      <div className="flex items-start space-x-2">
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{message.question}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resposta do bot */}
                  {message.answer && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                        <div className="flex items-start space-x-2">
                          <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                          <p className="text-sm whitespace-pre-wrap">{message.answer}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua pergunta sobre TOTVS Datasul..."
              disabled={loading || currentUser.message_balance <= 0}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={loading || !inputMessage.trim() || currentUser.message_balance <= 0}
              size="sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Iframe do chatbot externo (opcional) */}
      <Card>
        <CardHeader>
          <CardTitle>Chatbot Alternativo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: '500px' }}>
            <iframe 
              src="https://app.gptmaker.ai/widget/3E53773CC640E0D44A34DE0AA24E784E/iframe" 
              width="100%" 
              style={{ height: '100%', minHeight: '500px' }}
              allow="microphone;" 
              frameBorder="0"
              title="Chatbot Externo"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Este é o chatbot externo fornecido. O chatbot acima consome seu saldo de mensagens.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

