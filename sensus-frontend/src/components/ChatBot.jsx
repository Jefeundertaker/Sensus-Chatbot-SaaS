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
      console.log('Carregando histórico para usuário:', currentUser.username, 'ID:', currentUser.id)
      
      const response = await fetch(`/api/chat/history?per_page=10&user_id=${currentUser.id}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dados recebidos do backend:', data)
        
        // Tripla verificação de isolamento
        const userMessages = data.messages.filter(msg => {
          const isCorrectUser = msg.user_id === currentUser.id || msg.isolated_user_id === currentUser.id
          if (!isCorrectUser) {
            console.warn('Mensagem de outro usuário detectada e filtrada:', msg)
          }
          return isCorrectUser
        })
        
        console.log('Mensagens filtradas para o usuário:', userMessages)
        setMessages(userMessages.reverse())
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
      user_id: currentUser.id,
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
          user_id: currentUser.id,
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

      {/* Iframe do chatbot externo com identificação do usuário */}
      <Card>
        <CardHeader>
          <CardTitle>Chatbot GPTMaker - {currentUser.username}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Usuário identificado:</strong> {currentUser.username} (ID: {currentUser.id})
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Este chatbot está personalizado para você e não consome seu saldo de mensagens.
            </p>
          </div>
          
          {/* Botão para inicializar conversa com nome */}
          <div className="mb-4">
            <button 
              onClick={() => {
                const iframe = document.getElementById(`gptmaker-iframe-${currentUser.id}`)
                if (iframe && iframe.contentWindow) {
                  // Tentar enviar mensagem para o iframe
                  iframe.contentWindow.postMessage({
                    type: 'setUser',
                    username: currentUser.username,
                    userId: currentUser.id
                  }, '*')
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              🔄 Identificar como {currentUser.username}
            </button>
          </div>
          
          <div className="w-full" style={{ height: '500px' }}>
            <iframe 
              src={`https://app.gptmaker.ai/widget/3E53773CC640E0D44A34DE0AA24E784E/iframe?user=${encodeURIComponent(currentUser.username)}&userId=${currentUser.id}&context=${encodeURIComponent(`Usuário: ${currentUser.username}`)}&name=${encodeURIComponent(currentUser.username)}`}
              width="100%" 
              style={{ height: '100%', minHeight: '500px' }}
              allow="microphone;" 
              frameBorder="0"
              title={`Chatbot para ${currentUser.username}`}
              id={`gptmaker-iframe-${currentUser.id}`}
              onLoad={() => {
                console.log('GPTMaker iframe carregado para:', currentUser.username)
                // Tentar identificar o usuário após o carregamento
                setTimeout(() => {
                  const iframe = document.getElementById(`gptmaker-iframe-${currentUser.id}`)
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                      type: 'setUser',
                      username: currentUser.username,
                      userId: currentUser.id
                    }, '*')
                  }
                }, 2000)
              }}
            />
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <p>💡 <strong>Dica:</strong> Se aparecer "Desconhecido", clique no botão "🔄 Identificar" acima ou mencione que você é <strong>{currentUser.username}</strong> na primeira mensagem.</p>
            <p className="mt-1">🔗 <strong>URL personalizada:</strong> Inclui parâmetros user={currentUser.username}&userId={currentUser.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

