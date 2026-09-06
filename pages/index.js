import { useState, useEffect } from 'react'
import Login from '../components/Login'
import Register from '../components/Register'
import Dashboard from '../components/Dashboard'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogin = (userData) => {
    setIsLoggedIn(true)
    setUser(userData)
    localStorage.setItem('token', 'dummy-token')
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (!isLoggedIn) {
    return showRegister ? (
      <Register onRegister={handleLogin} onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login onLogin={handleLogin} onSwitchToRegister={() => setShowRegister(true)} />
    )
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}