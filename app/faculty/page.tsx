"use client"

import { useLanguage } from "@/providers/language-provider"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function FacultyPage() {
  const { content } = useLanguage()

  return (
    <div className="min-h-screen bg-[#E5E1FF] dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">{content.faculty}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.faculties.map((faculty) => (
            <Link 
              key={faculty.value} 
              href={`/faculty/${encodeURIComponent(faculty.value)}`}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <h3 className="font-semibold">{faculty.label}</h3>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 