"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, History, User } from "lucide-react"
import { useLanguage } from "@/providers/language-provider"
import { useEffect } from "react"

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { content } = useLanguage()

  useEffect(() => {
    if (!session) {
      router.push('/')
    }
  }, [session, router])

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <User className="w-10 h-10 text-purple-600 dark:text-purple-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{session.user?.name}</h1>
            <p className="text-muted-foreground">{session.user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="p-6 flex items-center gap-3 hover:bg-purple-50 dark:hover:bg-purple-900/30"
            onClick={() => router.push('/bookmarks')}
          >
            <Bookmark className="w-5 h-5" />
            <span className="text-lg">{content.bookmarks}</span>
          </Button>

          <Button
            variant="outline"
            className="p-6 flex items-center gap-3 hover:bg-purple-50 dark:hover:bg-purple-900/30"
            onClick={() => router.push('/history')}
          >
            <History className="w-5 h-5" />
            <span className="text-lg">{content.history}</span>
          </Button>
        </div>
      </Card>
    </div>
  )
} 