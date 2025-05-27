import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { LanguageProvider } from "@/providers/language-provider"
import { NavBar } from "@/components/nav-bar"
import { ReviewProvider } from "@/providers/review-provider"
import { AuthProvider } from '@/components/providers/auth-provider'
import { ReviewsProvider } from "@/providers/reviews-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Course D Tell-Me",
  description: "Share and discover course reviews",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <ReviewProvider>
                <ReviewsProvider>
                  <div className="min-h-screen flex flex-col">
                    <NavBar />
                    <main className="flex-1 container mx-auto px-4 py-6">
                      {children}
                    </main>
                  </div>
                </ReviewsProvider>
              </ReviewProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

