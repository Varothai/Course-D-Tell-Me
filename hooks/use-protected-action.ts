import { useAuth } from '../contexts/auth-context'
import { useSession } from 'next-auth/react'

export function useProtectedAction() {
  const { setShowAuthModal } = useAuth()
  const { data: session } = useSession()

  const handleProtectedAction = (callback: () => void) => {
    if (!session) {
      setShowAuthModal(true)
      return
    }
    callback()
  }

  return handleProtectedAction
}