import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import sensusLogo from '../assets/sensus-logo.png'

// Configuração da API com fallback
const API_URL = process.env.REACT_APP_API_URL || 'https://sensus-chatbot-backend.onrender.com'

export default function Login({ onLogin }) {
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [resetPasswordData, setResetPasswordData] = useState({ token: '', newPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Debug: Mostrar URL sendo usada
      console.log('API_URL:', API_URL)
      console.log('ENV REACT_APP_API_URL:', process.env.REACT_APP_API_URL)
      
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (response.ok) {
        onLogin(data.user)
      } else {
        setError(data.error || 'Erro ao fazer login')
      }
    } catch (err) {
      console.error('Erro de conexão:', err)
      setError(`Erro de conexão com ${API_URL}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (registerData.password !== registerData.confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Conta criada com sucesso! Faça login para continuar.')
        setRegisterData({ username: '', email: '', password: '', confirmPassword: '' })
      } else {
        setError(data.error || 'Erro ao criar conta')
      }
    } catch (err) {
      console.error('Erro de conexão no registro:', err)
      setError(`Erro de conexão com ${API_URL}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    // Simular login com Google (em produção, usar Google OAuth)
    setError('Login com Google será implementado em breve')
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        if (data.reset_link) {
          // Para demonstração, mostrar o link
          setSuccess(`${data.message}\n\nLink para teste: ${data.reset_link}`)
        }
      } else {
        setError(data.error || 'Erro ao solicitar recuperação')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetPasswordData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Senha redefinida com sucesso!')
        setShowResetPassword(false)
        setResetPasswordData({ token: '', newPassword: '' })
      } else {
        setError(data.error || 'Erro ao redefinir senha')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={sensusLogo} 
              alt="Sensus Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Sensus</h1>
          <p className="text-gray-600">Chatbot especializado em TOTVS Datasul</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acesso ao Sistema</CardTitle>
            <CardDescription>
              Entre com sua conta ou crie uma nova conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Cadastro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Usuário</Label>
                    <Input
                      id="username"
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>

                <div className="text-center">
                  <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                    <DialogTrigger asChild>
                      <Button variant="link" size="sm">
                        Esqueceu sua senha?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperar Senha</DialogTitle>
                        <DialogDescription>
                          Digite seu email para receber instruções de recuperação
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleForgotPassword}>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="forgot-email">Email</Label>
                            <Input
                              id="forgot-email"
                              type="email"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter className="mt-4">
                          <Button type="submit" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                >
                  Entrar com Google
                </Button>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-username">Usuário</Label>
                    <Input
                      id="reg-username"
                      type="text"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password">Senha</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Criando conta...' : 'Criar conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mt-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

          </CardContent>
        </Card>

        {/* Dialog para redefinir senha */}
        <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>
                Digite o token recebido por email e sua nova senha
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetPassword}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reset-token">Token</Label>
                  <Input
                    id="reset-token"
                    type="text"
                    value={resetPasswordData.token}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, token: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={resetPasswordData.newPassword}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

