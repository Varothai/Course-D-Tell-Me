"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface EditModalContextType {
  isEditModalOpen: boolean
  setIsEditModalOpen: (open: boolean) => void
}

const EditModalContext = createContext<EditModalContextType | null>(null)

export function EditModalProvider({ children }: { children: ReactNode }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <EditModalContext.Provider value={{ isEditModalOpen, setIsEditModalOpen }}>
      {children}
    </EditModalContext.Provider>
  )
}

export function useEditModal() {
  const context = useContext(EditModalContext)
  if (!context) {
    throw new Error("useEditModal must be used within EditModalProvider")
  }
  return context
}

