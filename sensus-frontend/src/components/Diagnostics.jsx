import React, { useState, useEffect } from 'react'

const Diagnostics = () => {
  const [diagnostics, setDiagnostics] = useState({
    envVars: {},
    backendStatus: 'testing',
    corsTest: 'testing',
    apiTests: {},
    logs: []
  })

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setDiagnostics(prev => ({
      ...prev,
      logs: [...prev.logs, { timestamp, message, type }]
    }))
  }

  const testEnvironmentVariables = () => {
    addLog('🔍 Testando variáveis de ambiente...', 'info')
    
    const envVars = {
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      NODE_ENV: process.env.NODE_ENV,
      PUBLIC_URL: process.env.PUBLIC_URL
    }
    
    setDiagnostics(prev => ({ ...prev, envVars }))
    
    if (envVars.REACT_APP_API_URL) {
      addLog(`✅ REACT_APP_API_URL encontrada: ${envVars.REACT_APP_API_URL}`, 'success')
    } else {
      addLog('❌ REACT_APP_API_URL não encontrada!', 'error')
    }
  }

  const testBackendConnection = async () => {
    addLog('🔍 Testando conexão com backend...', 'info')
    
    const apiUrl = process.env.REACT_APP_API_URL || 'https://sensus-chatbot-backend.onrender.com'
    
    try {
      // Teste 1: Ping básico
      addLog(`📡 Tentando conectar com: ${apiUrl}`, 'info')
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
      })
      
      if (response.ok) {
        addLog('✅ Backend respondeu com sucesso!', 'success')
        setDiagnostics(prev => ({ ...prev, backendStatus: 'success' }))
      } else {
        addLog(`⚠️ Backend respondeu com status: ${response.status}`, 'warning')
        setDiagnostics(prev => ({ ...prev, backendStatus: 'warning' }))
      }
      
    } catch (error) {
      addLog(`❌ Erro ao conectar com backend: ${error.message}`, 'error')
      setDiagnostics(prev => ({ ...prev, backendStatus: 'error' }))
    }
  }

  const testCORS = async () => {
    addLog('🔍 Testando CORS...', 'info')
    
    const apiUrl = process.env.REACT_APP_API_URL || 'https://sensus-chatbot-backend.onrender.com'
    
    try {
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        addLog('✅ CORS funcionando corretamente!', 'success')
        setDiagnostics(prev => ({ ...prev, corsTest: 'success' }))
      } else {
        addLog(`⚠️ CORS com problemas - Status: ${response.status}`, 'warning')
        setDiagnostics(prev => ({ ...prev, corsTest: 'warning' }))
      }
      
    } catch (error) {
      if (error.message.includes('CORS')) {
        addLog('❌ Erro de CORS detectado!', 'error')
      } else {
        addLog(`❌ Erro no teste de CORS: ${error.message}`, 'error')
      }
      setDiagnostics(prev => ({ ...prev, corsTest: 'error' }))
    }
  }

  const testAPIEndpoints = async () => {
    addLog('🔍 Testando endpoints da API...', 'info')
    
    const apiUrl = process.env.REACT_APP_API_URL || 'https://sensus-chatbot-backend.onrender.com'
    const endpoints = [
      { name: 'Health Check', url: '/api/health' },
      { name: 'Auth Check', url: '/api/auth/check' },
      { name: 'Packages', url: '/api/packages' }
    ]
    
    const results = {}
    
    for (const endpoint of endpoints) {
      try {
        addLog(`📡 Testando ${endpoint.name}: ${apiUrl}${endpoint.url}`, 'info')
        
        const response = await fetch(`${apiUrl}${endpoint.url}`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include'
        })
        
        if (response.ok) {
          results[endpoint.name] = 'success'
          addLog(`✅ ${endpoint.name}: OK`, 'success')
        } else {
          results[endpoint.name] = 'warning'
          addLog(`⚠️ ${endpoint.name}: Status ${response.status}`, 'warning')
        }
        
      } catch (error) {
        results[endpoint.name] = 'error'
        addLog(`❌ ${endpoint.name}: ${error.message}`, 'error')
      }
    }
    
    setDiagnostics(prev => ({ ...prev, apiTests: results }))
  }

  const runFullDiagnostic = async () => {
    addLog('🚀 Iniciando diagnóstico completo...', 'info')
    setDiagnostics(prev => ({ ...prev, logs: [] }))
    
    testEnvironmentVariables()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testBackendConnection()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testCORS()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testAPIEndpoints()
    
    addLog('🏁 Diagnóstico completo finalizado!', 'info')
  }

  useEffect(() => {
    runFullDiagnostic()
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'testing': return '🔄'
      default: return '❓'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      case 'testing': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">🔧 Diagnóstico do Sistema Sensus</h1>
        
        <div className="mb-6">
          <button 
            onClick={runFullDiagnostic}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            🔄 Executar Diagnóstico Completo
          </button>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Backend</h3>
            <div className={`${getStatusColor(diagnostics.backendStatus)}`}>
              {getStatusIcon(diagnostics.backendStatus)} {diagnostics.backendStatus}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">CORS</h3>
            <div className={`${getStatusColor(diagnostics.corsTest)}`}>
              {getStatusIcon(diagnostics.corsTest)} {diagnostics.corsTest}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Variáveis</h3>
            <div className={`${diagnostics.envVars.REACT_APP_API_URL ? 'text-green-600' : 'text-red-600'}`}>
              {diagnostics.envVars.REACT_APP_API_URL ? '✅ OK' : '❌ Erro'}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">APIs</h3>
            <div className="text-sm">
              {Object.entries(diagnostics.apiTests).map(([name, status]) => (
                <div key={name} className={getStatusColor(status)}>
                  {getStatusIcon(status)} {name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Variáveis de Ambiente */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">🔧 Variáveis de Ambiente</h2>
          <div className="bg-gray-50 p-4 rounded">
            <pre className="text-sm">
              {JSON.stringify(diagnostics.envVars, null, 2)}
            </pre>
          </div>
        </div>

        {/* Logs */}
        <div>
          <h2 className="text-lg font-semibold mb-3">📋 Logs de Diagnóstico</h2>
          <div className="bg-black text-green-400 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
            {diagnostics.logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Diagnostics

