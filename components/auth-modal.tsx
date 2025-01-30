"use client"

import { Dialog } from '@headlessui/react'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../contexts/auth-context'

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, signInWithGoogle } = useAuth()

  return (
    <Dialog
      open={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium mb-4">Sign in required</Dialog.Title>
          <p className="mb-4 text-sm text-gray-600">Please sign in to continue with this action</p>
          
          <button
            onClick={signInWithGoogle}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FcGoogle className="w-5 h-5" />
            Sign in with Google
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}