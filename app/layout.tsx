import type { Metadata, Viewport } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { LanguageProvider } from "@/providers/language-provider"
import { NavBar } from "@/components/nav-bar"
import { ReviewProvider } from "@/providers/review-provider"
import { AuthProvider } from '@/components/providers/auth-provider'
import { ReviewsProvider } from "@/providers/reviews-provider"
import { EditModalProvider } from "@/contexts/edit-modal-context"
import { NavigationProvider } from "@/contexts/navigation-context"
import { NavigationProgress } from "@/components/navigation-progress"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Course D Tell-Me",
  description: "Share and discover course reviews",
  icons: {
    icon: '/elephant-mascot.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/elephant-mascot.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <ReviewProvider>
                <ReviewsProvider>
                  <NavigationProvider>
                    <EditModalProvider>
                      <NavigationProgress />
                      <div className="min-h-screen flex flex-col">
                        <NavBar />
                        <main className="flex-1 container mx-auto px-4 py-6">
                          {children}
                        </main>
                      </div>
                    </EditModalProvider>
                  </NavigationProvider>
                </ReviewsProvider>
              </ReviewProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

