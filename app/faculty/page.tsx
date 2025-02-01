"use client"

import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
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
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Image
                          src={`/icons/faculties/${faculty.value.toLowerCase().replace(/ /g, '-')}.png`}
                          alt={faculty.value}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">
                          <div className="text-purple-700 dark:text-purple-300 group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors duration-300">
                            {thaiLabel}
                          </div>
                          <div className="text-sm text-muted-foreground group-hover:text-purple-500/70 dark:group-hover:text-purple-300/70 transition-colors duration-300">
                            {englishLabel}
                          </div>
                        </h3>
                      </div>
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