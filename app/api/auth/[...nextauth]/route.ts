import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

export const authOptions: NextAuthOptions = {
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
        const cookieStore = cookies()
        const token = cookieStore.get('cmu-entraid-example-token')?.value

        if (!token) return null

        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
          ) as any

          return {
            id: decoded.student_id || decoded.cmuitaccount,
            name: `${decoded.firstname_EN} ${decoded.lastname_EN}`,
            email: decoded.cmuitaccount,
          }
        } catch {
          return null
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.provider = token.provider as string
      }
      return session
    },
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider
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