"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/providers/language-provider"
import { useTheme } from "@/providers/theme-provider"
import { 
  User, 
  Home, 
  MessageCircleQuestion, 
  GraduationCap, 
  History, 
  Bookmark, 
  LogOut,
  Mail,
  Chrome,
  Menu,
  X,
  Moon,
  Sun
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut, signIn } from "next-auth/react"
import { useAuth } from '@/contexts/auth-context'
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function NavBar() {
  const pathname = usePathname()
  const { content, language, toggleLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { data: session } = useSession()
  const { signInWithGoogle } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const routes = [
    {
      href: "/homepage",
      label: "Home",
      icon: Home,
      active: pathname === "/homepage",
    },
    {
      href: "/qa",
      label: "Q&A",
      icon: MessageCircleQuestion,
      active: pathname === "/qa",
    },
    {
      href: "/faculty",
      label: content.faculty,
      icon: GraduationCap,
      active: pathname === "/faculty",
    }
  ]

  const handleCMUSignIn = async () => {
    try {
      const response = await fetch('/api/signIn', { method: 'GET' })
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error initiating CMU sign in:', error)
    }
  }

  const isGoogleUser = () => {
    return session?.user?.provider === 'google';
  };

  const NavItems = () => (
    <>
      {routes.map((route) => {
        const Icon = route.icon
        return (
          <Link
            key={route.href}
            href={route.href}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className={cn(
                "group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                route.active 
                  ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300" 
                  : "hover:bg-purple-50 dark:hover:bg-purple-900/30 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-300"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 transition-transform duration-300 group-hover:scale-110",
                route.active && "text-purple-600 dark:text-purple-300"
              )} />
              <span className="text-sm font-medium">{route.label}</span>
            </div>
          </Link>
        )
      })}
    </>
  )

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo or Brand with Mascot */}
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12">
              <img
                src="/elephant-mascot.png" 
                alt="Cute elephant mascot"
                className="w-full h-full object-contain"
              />
            </div>
            <Link 
              href="/homepage" 
              className="flex items-center gap-2"
            >
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                Course D Tell-Me
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-1">
            <NavItems />
          </div>

          {/* Theme and Language Toggle Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full w-10 h-10 hover:scale-110 hover:shadow-lg transition-all duration-300 bg-white/50 dark:bg-gray-800/50"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={toggleLanguage}
              className="rounded-full w-10 h-10 hover:scale-110 hover:shadow-lg transition-all duration-300 bg-white/50 dark:bg-gray-800/50 text-sm font-medium"
            >
              {language === "en" ? "TH" : "EN"}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="md:hidden rounded-full h-10 w-10 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors duration-300"
                >
                  <Menu className="h-5 w-5 text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-4 mt-8">
                  <NavItems />
                  {/* Mobile Theme and Language Toggles */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={toggleTheme}
                      className="rounded-full w-10 h-10 hover:scale-110 hover:shadow-lg transition-all duration-300 bg-white/50 dark:bg-gray-800/50"
                    >
                      {theme === "light" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={toggleLanguage}
                      className="rounded-full w-10 h-10 hover:scale-110 hover:shadow-lg transition-all duration-300 bg-white/50 dark:bg-gray-800/50 text-sm font-medium"
                    >
                      {language === "en" ? "TH" : "EN"}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-full h-10 w-10 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors duration-300"
                >
                  <User className="h-5 w-5 text-muted-foreground hover:text-purple-600 dark:hover:text-purple-300 transition-colors duration-300" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end"
                className="w-56 mt-2 p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800 rounded-xl shadow-xl animate-in slide-in-from-top-2"
              >
                {!session ? (
                  <>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gradient-to-r from-purple-50 to-pink-50 dark:hover:bg-gradient-to-r dark:from-purple-900/30 dark:to-pink-900/30 cursor-pointer transition-all duration-300 group"
                      onClick={handleCMUSignIn}
                    >
                      <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-medium">Sign in with CMU Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 px-4 py-3 mt-1 rounded-lg hover:bg-gradient-to-r from-purple-50 to-pink-50 dark:hover:bg-gradient-to-r dark:from-purple-900/30 dark:to-pink-900/30 cursor-pointer transition-all duration-300 group"
                      onClick={signInWithGoogle}
                    >
                      <Chrome className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-medium">Sign in with Google</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <Link href="/profile">
                      <DropdownMenuItem className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gradient-to-r from-purple-50 to-pink-50 dark:hover:bg-gradient-to-r dark:from-purple-900/30 dark:to-pink-900/30 cursor-pointer transition-all duration-300 group">
                        <User className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                        <div className="flex flex-col">
                          <span className="font-medium">{content.profile}</span>
                          <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/bookmarks">
                      <DropdownMenuItem className="flex items-center gap-2 px-4 py-3 mt-1 rounded-lg hover:bg-gradient-to-r from-purple-50 to-pink-50 dark:hover:bg-gradient-to-r dark:from-purple-900/30 dark:to-pink-900/30 cursor-pointer transition-all duration-300 group">
                        <Bookmark className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-medium">{content.bookmarks}</span>
                      </DropdownMenuItem>
                    </Link>

                    {!isGoogleUser() && (
                      <Link href="/history">
                        <DropdownMenuItem className="flex items-center gap-2 px-4 py-3 mt-1 rounded-lg hover:bg-gradient-to-r from-purple-50 to-pink-50 dark:hover:bg-gradient-to-r dark:from-purple-900/30 dark:to-pink-900/30 cursor-pointer transition-all duration-300 group">
                          <History className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                          <span className="font-medium">{content.history}</span>
                        </DropdownMenuItem>
                      </Link>
                    )}

                    <div className="h-px my-2 bg-gradient-to-r from-transparent via-purple-200 dark:via-purple-800 to-transparent" />
                    <DropdownMenuItem 
                      className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gradient-to-r from-red-50 to-orange-50 dark:hover:bg-gradient-to-r dark:from-red-900/30 dark:to-orange-900/30 cursor-pointer transition-all duration-300 group"
                      onClick={() => signOut()}
                    >
                      <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {content.signOut}
                      </span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
} 