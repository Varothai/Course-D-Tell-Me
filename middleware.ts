import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Protect all POST requests
      if (req.method === "POST") {
        return !!token
      }
      // Allow GET requests
      return true
    },
  },
})

export const config = {
  matcher: [
    "/api/reviews/:path*",
    "/api/comments/:path*",
    "/api/qa/:path*",
    "/api/likes/:path*",
  ],
} 