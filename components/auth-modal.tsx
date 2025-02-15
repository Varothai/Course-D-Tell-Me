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
      <DialogContent className="sm:max-w-md rounded-3xl bg-white/95 backdrop-blur-sm p-8 border-2 border-purple-200 dark:border-purple-800 dark:bg-gray-900/90">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <img
            src="/elephant-mascot.png" 
            alt="Cute elephant mascot"
            className="w-full h-full object-contain animate-bounce-gentle"
          />
        </div>
        
        <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Welcome to Course D Tell-Me!
        </DialogTitle>
        
        <p className="text-center mb-6 text-sm text-gray-600 dark:text-gray-400">
          Sign in to share your experiences and connect with others
        </p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={handleCMUSignIn}
            className="group relative flex items-center justify-center gap-3 w-full px-6 py-3 
              bg-gradient-to-r from-purple-50 to-pink-50 
              dark:from-purple-900/30 dark:to-pink-900/30
              hover:from-purple-100 hover:to-pink-100
              dark:hover:from-purple-900/50 dark:hover:to-pink-900/50
              border border-purple-200 dark:border-purple-800 
              rounded-2xl transition-all duration-300
              shadow-sm hover:shadow-md"
          >
            <img 
              src="/cmu-logo.png" 
              alt="CMU logo" 
              className="w-5 h-5 object-contain"
            />
            <span className="font-medium text-gray-700 dark:text-gray-200">Sign in with CMU Account</span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/0 to-pink-600/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">or continue with</span>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="group relative flex items-center justify-center gap-3 w-full px-6 py-3
              bg-white dark:bg-gray-900
              hover:bg-gray-50 dark:hover:bg-gray-800
              border border-gray-200 dark:border-gray-800
              rounded-2xl transition-all duration-300
              shadow-sm hover:shadow-md"
          >
            <FcGoogle className="w-5 h-5" />
            <span className="font-medium text-gray-700 dark:text-gray-200">Sign in with Google</span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/0 to-pink-600/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  )
}