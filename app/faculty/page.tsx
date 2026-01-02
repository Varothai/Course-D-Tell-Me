"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { localeContent } from "@/locales/content"

export default function FacultyPage() {
  const { content, language } = useLanguage()

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 dark:from-slate-950 dark:via-indigo-950/50 dark:to-purple-950/30 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/10 dark:to-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-rose-400/20 dark:from-pink-600/10 dark:to-rose-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 dark:from-blue-600/10 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]" />
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
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