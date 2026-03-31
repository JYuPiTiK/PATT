import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Single-user admin auth for MVP
// Replace with User DB lookup when multi-user is needed

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string

        if (!email || !password) return null

        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!adminEmail || !adminPassword) return null

        if (email !== adminEmail) return null

        // Support both plain text (dev) and bcrypt hashed passwords
        let isValid = false
        if (adminPassword.startsWith("$2")) {
          isValid = await bcrypt.compare(password, adminPassword)
        } else {
          isValid = password === adminPassword
        }

        if (!isValid) return null

        return {
          id: "admin",
          email: adminEmail,
          name: "Admin",
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
