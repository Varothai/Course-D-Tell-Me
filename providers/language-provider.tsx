"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { localeContent } from "@/locales/content"
import type { LocaleContent } from "@/types/review"

type Language = "en" | "th"

type LanguageProviderProps = {
  children: ReactNode
  defaultLanguage?: Language
}

type LanguageProviderState = {
  language: Language
  content: LocaleContent
  toggleLanguage: () => void
}

const LanguageProviderContext = createContext<LanguageProviderState | undefined>(
  undefined
)

const locales = {
  en: {
    // ... existing translations
    questionPlaceholder: "Write your question here...",
    askQuestion: "Ask a Question",
    posting: "Posting...",
  },
  th: {
    // ... existing translations
    questionPlaceholder: "เขียนคำถามของคุณที่นี่...",
    askQuestion: "ถามคำถาม",
    posting: "กำลังโพสต์...",
  }
}

export function LanguageProvider({
  children,
  defaultLanguage = "th",
}: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(defaultLanguage)

  const toggleLanguage = () => {
    setLanguage((prevLang) => (prevLang === "en" ? "th" : "en"))
  }

  const value: LanguageProviderState = {
    language,
    content: localeContent[language],
    toggleLanguage,
  }

  return (
    <LanguageProviderContext.Provider value={value}>
      {children}
    </LanguageProviderContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageProviderContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

