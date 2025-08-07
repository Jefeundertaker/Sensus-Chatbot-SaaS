import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Package, Check, CreditCard } from 'lucide-react'

export default function Packages({ currentUser }) {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      const response = await fetch('/api/packages', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPackages(data)
      }
    } catch (err) {
      setError('Erro ao carregar pacotes')
    }
  }

  const buyPackage = async (packageId) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Criar transação
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ package_id: packageId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Simular pagamento (completar transação automaticamente)
        const completeResponse = await fetch(`/api/transactions/${data.transaction.id}/complete`, {
          method: 'POST',
          credentials: 'include',
        })

        const completeData = await completeResponse.json()

        if (completeResponse.ok) {
          setSuccess(`Pacote comprado com sucesso! ${completeData.messages_added} mensagens adicionadas ao seu saldo.`)
          // Atualizar saldo do usuário
          currentUser.message_balance = completeData.new_balance
        } else {
          setError(completeData.error || 'Erro ao processar pagamento')
        }
      } else {
        setError(data.error || 'Erro ao criar transação')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Pacotes de Mensagens</span>
          </CardTitle>
          <CardDescription>
            Escolha o pacote ideal para suas necessidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Seu saldo atual:</strong> {currentUser.message_balance} mensagens
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                {pkg.name.includes('Intermediário') && (
                  <Badge variant="secondary">Mais Popular</Badge>
                )}
              </div>
              <CardDescription>
                {pkg.message_count.toLocaleString()} mensagens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  R$ {pkg.price.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-sm text-gray-500">
                  R$ {(pkg.price / pkg.message_count).toFixed(4).replace('.', ',')} por mensagem
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{pkg.message_count.toLocaleString()} mensagens</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Chatbot especializado TOTVS Datasul</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Suporte técnico</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Histórico de conversas</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => buyPackage(pkg.id)}
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Comprar Pacote
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Os pacotes são ativados imediatamente após a compra</p>
            <p>• As mensagens não possuem prazo de validade</p>
            <p>• Cada pergunta ao chatbot consome 1 mensagem do seu saldo</p>
            <p>• Para dúvidas sobre pagamento, entre em contato: (47) 3029-2866</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

