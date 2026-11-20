import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('aps_admin_theme')
      if (saved === 'light' || saved === 'dark') return saved
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light'
      }
    } catch (e) {
      // fallback
    }
    return 'dark'
  })

  useEffect(() => {
    try {
      const root = document.documentElement
      if (theme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
      }
      localStorage.setItem('aps_admin_theme', theme)
    } catch (e) {
      console.error('Failed to persist theme:', e)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
