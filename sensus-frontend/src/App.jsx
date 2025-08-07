import React, { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './components/Login'
import ChatBot from './components/ChatBot'
import Packages from './components/Packages'
import AdminUsers from './components/AdminUsers'
import Diagnostics from './components/Diagnostics'
import './App.css'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (user) => {
    setCurrentUser(user)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    } finally {
      setCurrentUser(null)
    }
  }

  const renderContent = (activeTab) => {
    switch (activeTab) {
      case 'chat':
        return <ChatBot currentUser={currentUser} />
      case 'packages':
        return <Packages currentUser={currentUser} />
      case 'transactions':
        return <div className="text-center py-8 text-gray-500">Transações em desenvolvimento</div>
      case 'admin-users':
        return <AdminUsers />
      case 'admin-packages':
        return <div className="text-center py-8 text-gray-500">Gerenciar Pacotes em desenvolvimento</div>
      case 'admin-transactions':
        return <div className="text-center py-8 text-gray-500">Todas Transações em desenvolvimento</div>
      case 'admin-settings':
        return <div className="text-center py-8 text-gray-500">Configurações em desenvolvimento</div>
      case 'diagnostics':
        return <Diagnostics />
      default:
        return <ChatBot currentUser={currentUser} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Layout currentUser={currentUser} onLogout={handleLogout}>
      {renderContent}
    </Layout>
  )
}

export default App
