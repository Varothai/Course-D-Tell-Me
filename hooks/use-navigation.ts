"use client"

import { useRouter } from "next/navigation"
import { useCallback, useRef } from "react"
import { useNavigationContext } from "@/contexts/navigation-context"

export function useNavigation() {
  const router = useRouter()
  const isNavigatingRef = useRef(false)
  const { setNavigating } = useNavigationContext()

  const navigate = useCallback((href: string, options?: { replace?: boolean }) => {
    // Prevent double navigation
    if (isNavigatingRef.current) {
      return
    }

    isNavigatingRef.current = true
    setNavigating(true)

    // Use replace if specified, otherwise use push
    if (options?.replace) {
      router.replace(href)
    } else {
      router.push(href)
    }

    // Reset navigation state after a delay (navigation events will handle actual completion)
    const timeout = setTimeout(() => {
      isNavigatingRef.current = false
      setNavigating(false)
    }, 2000)

    // Cleanup function
    return () => {
      clearTimeout(timeout)
    }
  }, [router, setNavigating])

  return { navigate }
}

