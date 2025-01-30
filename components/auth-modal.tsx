"use client"

import { Dialog } from "@/components/ui/dialog"
import { DialogContent, DialogTitle } from "@/components/ui/dialog"
import { FcGoogle } from 'react-icons/fc'
// import { SiMicrosoft } from 'react-icons/si'
import { useAuth } from '../contexts/auth-context'

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, signInWithGoogle } = useAuth()

  const handleCMUSignIn = async () => {
    try {
      const response = await fetch('/api/signIn', { method: 'GET' })
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error initiating CMU sign in:', error)
    }
  }

  return (
    <Dialog
      open={showAuthModal}
      onOpenChange={setShowAuthModal}
    >
      <DialogContent className="sm:max-w-sm rounded-2xl bg-white p-6">
        <DialogTitle className="text-lg font-medium mb-4">Sign in required</DialogTitle>
        <p className="mb-4 text-sm text-gray-600">Please sign in to continue with this action</p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={signInWithGoogle}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FcGoogle className="w-5 h-5" />
            Sign in with Google
          </button>

          <button
            onClick={handleCMUSignIn}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FcGoogle className="w-5 h-5 text-blue-500" />
            Sign in with CMU Account
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}