import { useAuth } from '../contexts/auth-context'
import { useSession } from 'next-auth/react'

export function useProtectedAction() {
  const { setShowAuthModal } = useAuth()
  const { data: session } = useSession()

  const handleProtectedAction = (callback: () => void, requireCMU = false) => {
    if (!session) {
      setShowAuthModal(true)
      return
    }

    if (requireCMU && session.user.provider !== 'cmu') {
      alert('This feature is only available for CMU users')
      return
    }

    callback()
  }

  return handleProtectedAction
}