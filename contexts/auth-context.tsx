"use client"

import { createContext, useContext, ReactNode, useState } from 'react'
import { useSession, signIn, signOut } from "next-auth/react"

interface AuthContextType {
  user: any | null
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const signInWithGoogle = async () => {
    try {
      // Use current origin to ensure it works in both localhost and production
      const callbackUrl = typeof window !== 'undefined' ? window.location.origin + '/' : '/'
      await signIn('google', { callbackUrl })
      setShowAuthModal(false)
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  const logout = async () => {
    try {
      // Use current origin to ensure it works in both localhost and production
      const callbackUrl = typeof window !== 'undefined' ? window.location.origin + '/' : '/'
      await signOut({ callbackUrl })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user: session?.user ?? null, 
      signInWithGoogle, 
      logout,
      showAuthModal,
      setShowAuthModal,
      isAuthenticated: status === "authenticated"
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}