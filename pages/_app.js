import '../styles/globals.css'
import { useEffect } from 'react'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Initialize admin user on app start
    const initAdmin = async () => {
      try {
        await fetch('/api/init-admin', { method: 'POST' })
      } catch (error) {
        console.error('Failed to initialize admin:', error)
      }
    }
    
    initAdmin()
  }, [])

  return <Component {...pageProps} />
}
