import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "cmu",
      name: "CMU Account",
      credentials: {},
      async authorize(credentials, req) {
        try {
          const cookieStore = await cookies()
          const token = cookieStore.get('cmu-entraid-example-token')?.value

          if (!token) {
            console.error("CMU auth: No token found in cookies")
            return null
          }

          if (!process.env.JWT_SECRET) {
            console.error("CMU auth: JWT_SECRET not configured")
            return null
          }

          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
          ) as any

          return {
            id: decoded.student_id || decoded.cmuitaccount,
            name: `${decoded.firstname_EN} ${decoded.lastname_EN}`,
            email: decoded.cmuitaccount,
          }
        } catch (error: any) {
          console.error("CMU auth: Token verification failed", {
            message: error?.message,
            name: error?.name,
          })
          return null
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.provider = token.provider as string
        // Include CMU organization data if available
        if (token.organization_name_EN) {
          session.user.organization_name_EN = token.organization_name_EN as string
          session.user.organization_name_TH = token.organization_name_TH as string
          session.user.organization_code = token.organization_code as string
        }
      }
      return session
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.provider = account.provider
      }
      // Store CMU organization data from user object if available
      if (user && 'organization_name_EN' in user) {
        token.organization_name_EN = (user as any).organization_name_EN
        token.organization_name_TH = (user as any).organization_name_TH
        token.organization_code = (user as any).organization_code
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }