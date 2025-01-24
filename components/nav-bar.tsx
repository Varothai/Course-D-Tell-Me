"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/providers/language-provider"
import { User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NavBar() {
  const pathname = usePathname()
  const { content } = useLanguage()
  
  const routes = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
    },
    {
      href: "/qa",
      label: "Q&A",
      active: pathname === "/qa",
    },
    {
      href: "/faculty",
      label: content.faculty,  // This will show "คณะ" in Thai
      active: pathname === "/faculty",
    }
  ]

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Center Navigation */}
          <div className="flex-1" /> {/* Spacer */}
          <div className="flex gap-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "px-4 py-2 text-sm transition-colors hover:text-primary",
                  route.active ? "text-black dark:text-white" : "text-muted-foreground"
                )}
              >
                {route.label}
              </Link>
            ))}
          </div>
          {/* Profile Menu */}
          <div className="flex-1 flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href="/bookmarks">
                  <DropdownMenuItem>
                    {content.bookmarks}
                  </DropdownMenuItem>
                </Link>
                <Link href="/history">
                  <DropdownMenuItem>
                    {content.history}
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
} 