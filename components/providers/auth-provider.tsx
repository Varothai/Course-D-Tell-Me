"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider as CustomAuthProvider } from "@/contexts/auth-context"
import AuthModal from "@/components/auth-modal"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CustomAuthProvider>
        {children}
        <AuthModal />
      </CustomAuthProvider>
    </SessionProvider>
  )
} 