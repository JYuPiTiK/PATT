import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req: NextRequest & { auth: unknown }) => {
  const isLoggedIn = !!(req as unknown as { auth: { user?: unknown } }).auth?.user
  const isLoginPage = req.nextUrl.pathname === "/login"
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth")

  // Allow auth API routes always
  if (isApiAuth) return NextResponse.next()

  // Redirect authenticated users away from login
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Redirect unauthenticated users to login
  if (!isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
}
