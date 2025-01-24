"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/providers/language-provider"

export function MainNav() {
  const pathname = usePathname()
  const { content } = useLanguage()

  const items = [
    {
      href: "/",
      label: "Home"
    },
    {
      href: "/qa",
      label: "Q&A"
    },
    {
      href: "/faculty",
      label: content.faculty  // This will show "คณะ" in Thai
    }
  ]

  return (
    <nav className="flex items-center space-x-6">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
} 