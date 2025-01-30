"use client"

import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { localeContent } from "@/locales/content"

export default function FacultyPage() {
  const { content, language } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-lg transition-all duration-300 mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {content.faculty}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {language === 'en' 
              ? 'Select a faculty to view course reviews'
              : 'เลือกคณะเพื่อดูรีวิวรายวิชา'}
          </p>
        </div>
        
        {/* Faculty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.faculties.map((faculty) => {
            const thaiLabel = localeContent.th.faculties.find(f => f.value === faculty.value)?.label
            const englishLabel = localeContent.en.faculties.find(f => f.value === faculty.value)?.label

            return (
              <Link 
                key={faculty.value} 
                href={`/faculty/${encodeURIComponent(faculty.value)}`}
                className="transition-all duration-300"
              >
                <Card className="group relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:via-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
                  
                  <div className="relative p-6">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        <div className="text-purple-700 dark:text-purple-300 group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors duration-300">
                          {thaiLabel}
                        </div>
                        <div className="text-sm text-muted-foreground group-hover:text-purple-500/70 dark:group-hover:text-purple-300/70 transition-colors duration-300">
                          {englishLabel}
                        </div>
                      </h3>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20" />
                    </div>
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
} 