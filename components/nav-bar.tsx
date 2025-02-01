"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/providers/language-provider"
import { User, Home, MessageCircleQuestion, GraduationCap, History, Bookmark, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function NavBar() {
  const pathname = usePathname()
  const { content } = useLanguage()
  const { data: session } = useSession()
  
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

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo or Brand with Mascot */}
          <div className="flex-1 flex items-center gap-2">
            <div className="relative w-12 h-12">
              <img
                src="/elephant-mascot.png" 
                alt="Cute elephant mascot"
                className="w-full h-full object-contain animate-bounce-gentle"
              />
            </div>
            <Link 
              href="/" 
              className="flex items-center gap-2"
            >
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                Course D Tell-Me
              </span>
            </Link>
          </div>

          {/* Center Navigation */}
          <div className="flex gap-1">
            {routes.map((route) => {
              const Icon = route.icon
              return (
                <Link
                  key={route.href}
                  href={route.href}
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
          </div>

          {/* Profile Menu */}
          <div className="flex-1 flex justify-end">
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
                {session && (
                  <Link href="/profile">
                    <DropdownMenuItem className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gradient-to-r from-purple-50 to-pink-50 dark:hover:bg-gradient-to-r dark:from-purple-900/30 dark:to-pink-900/30 cursor-pointer transition-all duration-300 group">
                      <User className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                      <div className="flex flex-col">
                        <span className="font-medium">{content.profile}</span>
                        <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                )}

                <Link href="/bookmarks">
                  <DropdownMenuItem className="flex items-center gap-2 px-4 py-3 mt-1 rounded-lg hover:bg-gradient-to-r from-purple-50 to-pink-50 dark:hover:bg-gradient-to-r dark:from-purple-900/30 dark:to-pink-900/30 cursor-pointer transition-all duration-300 group">
                    <Bookmark className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium">{content.bookmarks}</span>
                  </DropdownMenuItem>
                </Link>

                <Link href="/history">
                  <DropdownMenuItem className="flex items-center gap-2 px-4 py-3 mt-1 rounded-lg hover:bg-gradient-to-r from-purple-50 to-pink-50 dark:hover:bg-gradient-to-r dark:from-purple-900/30 dark:to-pink-900/30 cursor-pointer transition-all duration-300 group">
                    <History className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium">{content.history}</span>
                  </DropdownMenuItem>
                </Link>

                {session && (
                  <>
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