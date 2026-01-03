import { redirect } from 'next/navigation'

export default function HomepageRedirect() {
  // Server-side redirect works consistently in both localhost and production
  // This ensures /homepage always redirects to / (root)
  redirect('/')
}

