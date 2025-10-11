'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Toaster } from 'sonner'
import { toast } from 'sonner'

// Components
import Navbar from '../components/Navbar'
import AuthPage from '../components/AuthPage'
import Dashboard from '../components/Dashboard'
import Services from '../components/Services'
import Keys from '../components/Keys'
import Library from '../components/Library'
import AdminPanel from '../components/AdminPanel'

const API = '/api'
axios.defaults.baseURL = API
axios.defaults.headers.common['Content-Type'] = 'application/json'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('home')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUserInfo()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('/auth/me')
      setUser(response.data)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
    setIsAuthenticated(true)
    toast.success('Login successful!')
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
    setCurrentTab('home')
    toast.info('Logged out successfully')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage onLogin={login} />
        <Toaster position="top-right" richColors />
      </>
    )
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <Dashboard user={user} />
      case 'services':
        return <Services user={user} />
      case 'keys':
        return <Keys user={user} />
      case 'library':
        return <Library user={user} />
      case 'admin':
        return user?.is_admin ? <AdminPanel /> : <Dashboard user={user} />
      default:
        return <Dashboard user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar 
        user={user}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLogout={logout}
      />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Toaster position="top-right" richColors />
    </div>
  )
}
