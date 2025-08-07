import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Search, Plus, Eye, ToggleLeft, ToggleRight, MessageSquare, DollarSign } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userHistory, setUserHistory] = useState(null)
  const [addBalanceAmount, setAddBalanceAmount] = useState('')
  const [showAddBalanceDialog, setShowAddBalanceDialog] = useState(false)
  const [showUserHistoryDialog, setShowUserHistoryDialog] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        setError('Erro ao carregar usuários')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (err) {
      setError('Erro ao buscar usuários')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message)
        loadUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao alterar status do usuário')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const addBalance = async () => {
    if (!selectedUser || !addBalanceAmount || addBalanceAmount <= 0) {
      setError('Quantidade deve ser maior que zero')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/add-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ messages: parseInt(addBalanceAmount) }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message)
        setShowAddBalanceDialog(false)
        setAddBalanceAmount('')
        setSelectedUser(null)
        loadUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao adicionar saldo')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const loadUserHistory = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/history`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUserHistory(data)
        setShowUserHistoryDialog(true)
      } else {
        setError('Erro ao carregar histórico do usuário')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Gerenciamento de Usuários</span>
          </CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={searchUsers} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Mensagens</TableHead>
                  <TableHead>Gasto Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.message_balance} msgs
                      </Badge>
                    </TableCell>
                    <TableCell>{user.message_count || 0}</TableCell>
                    <TableCell>{formatCurrency(user.total_spent || 0)}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadUserHistory(user.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Dialog open={showAddBalanceDialog && selectedUser?.id === user.id} onOpenChange={setShowAddBalanceDialog}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adicionar Saldo de Mensagens</DialogTitle>
                              <DialogDescription>
                                Adicionar mensagens para o usuário: {user.username}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="balance">Quantidade de Mensagens</Label>
                                <Input
                                  id="balance"
                                  type="number"
                                  min="1"
                                  value={addBalanceAmount}
                                  onChange={(e) => setAddBalanceAmount(e.target.value)}
                                  placeholder="Ex: 100"
                                />
                              </div>
                              <div className="text-sm text-gray-600">
                                Saldo atual: {user.message_balance} mensagens
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowAddBalanceDialog(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={addBalance}>
                                Adicionar Saldo
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para histórico do usuário */}
      <Dialog open={showUserHistoryDialog} onOpenChange={setShowUserHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico do Usuário</DialogTitle>
            <DialogDescription>
              Detalhes completos de atividade e transações
            </DialogDescription>
          </DialogHeader>
          
          {userHistory && (
            <div className="space-y-6">
              {/* Informações do usuário */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{userHistory.user.username}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{userHistory.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Saldo Atual</p>
                      <p className="font-medium">{userHistory.user.message_balance} msgs</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total de Mensagens</p>
                      <p className="font-medium">{userHistory.stats.total_messages}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Gasto</p>
                      <p className="font-medium">{formatCurrency(userHistory.stats.total_spent)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Transações</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userHistory.transactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Pacote</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userHistory.transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.created_at)}</TableCell>
                            <TableCell>{transaction.package}</TableCell>
                            <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                {transaction.status === 'completed' ? 'Concluída' : 'Pendente'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhuma transação encontrada</p>
                  )}
                </CardContent>
              </Card>

              {/* Mensagens recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Mensagens Recentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userHistory.messages.items.length > 0 ? (
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {userHistory.messages.items.slice(0, 10).map((message) => (
                        <div key={message.id} className="border-l-4 border-blue-500 pl-4">
                          <p className="text-sm text-gray-500">{formatDate(message.created_at)}</p>
                          <p className="font-medium text-sm">P: {message.question}</p>
                          <p className="text-sm text-gray-700 mt-1">R: {message.answer?.substring(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhuma mensagem encontrada</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowUserHistoryDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

