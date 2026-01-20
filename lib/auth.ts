import NextAuth, { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[Auth] Authorize called with email:", credentials?.email)

        const validated = loginSchema.safeParse(credentials)
        if (!validated.success) {
          console.log("[Auth] Validation failed:", validated.error.issues)
          return null
        }

        console.log("[Auth] Looking up user:", validated.data.email)
        const user = await prisma.user.findUnique({
          where: { email: validated.data.email }
        })

        if (!user) {
          console.log("[Auth] User not found:", validated.data.email)
          return null
        }
        console.log("[Auth] User found:", user.id)

        const passwordValid = await bcrypt.compare(
          validated.data.password,
          user.passwordHash
        )

        if (!passwordValid) {
          console.log("[Auth] Invalid password for user:", user.id)
          return null
        }

        console.log("[Auth] Login successful for user:", user.id)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
