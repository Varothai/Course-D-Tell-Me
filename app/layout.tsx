import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/providers/theme-provider"
import { LanguageProvider } from "@/providers/language-provider"
import { NavBar } from "@/components/nav-bar"
import { ReviewProvider } from "@/providers/review-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Course D Tell-Me",
  description: "Share and discover course reviews",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            <ReviewProvider>
              <NavBar />
              {children}
            </ReviewProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

