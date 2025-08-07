import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, User, MessageSquare, Package, CreditCard, Settings, Wrench } from 'lucide-react'
import sensusLogo from '../assets/sensus-logo.png'

export default function Layout({ children, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('chat')

  const menuItems = [
    { id: 'chat', label: 'Chatbot', icon: MessageSquare },
    { id: 'packages', label: 'Pacotes', icon: Package },
    { id: 'transactions', label: 'Transações', icon: CreditCard },
    { id: 'diagnostics', label: 'Diagnóstico', icon: Wrench },
  ]

  const adminMenuItems = [
    { id: 'admin-users', label: 'Usuários', icon: User },
    { id: 'admin-packages', label: 'Gerenciar Pacotes', icon: Package },
    { id: 'admin-transactions', label: 'Todas Transações', icon: CreditCard },
    { id: 'admin-settings', label: 'Configurações', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <img 
                  src={sensusLogo} 
                  alt="Sensus Logo" 
                  className="h-10 w-auto"
                />
                <div>
                  <h1 className="text-xl font-bold text-blue-600">Sensus Chatbot</h1>
                  <p className="text-sm text-gray-500">Sistema TOTVS Datasul</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentUser && (
                <>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{currentUser.username}</span>
                    {currentUser.user_type === 'client' && (
                      <span className="ml-2 text-blue-600">
                        {currentUser.message_balance} mensagens
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          {currentUser && (
            <div className="lg:w-64">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Menu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Button
                        key={item.id}
                        variant={activeTab === item.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveTab(item.id)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    )
                  })}
                  
                  {currentUser.user_type === 'admin' && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Administração</p>
                        {adminMenuItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <Button
                              key={item.id}
                              variant={activeTab === item.id ? "default" : "ghost"}
                              className="w-full justify-start"
                              onClick={() => setActiveTab(item.id)}
                            >
                              <Icon className="h-4 w-4 mr-2" />
                              {item.label}
                            </Button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {children(activeTab)}
          </div>
        </div>
      </div>
    </div>
  )
}

