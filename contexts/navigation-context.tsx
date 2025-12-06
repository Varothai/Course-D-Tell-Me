"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { usePathname } from "next/navigation"

interface NavigationContextType {
  isNavigating: boolean
  setNavigating: (value: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()

  // Reset navigation state when route changes
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  return (
    <NavigationContext.Provider value={{ isNavigating, setNavigating: setIsNavigating }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigationContext() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error("useNavigationContext must be used within a NavigationProvider")
  }
  return context
}

