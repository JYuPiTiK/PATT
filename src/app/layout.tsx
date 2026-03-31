import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "PATT — Project & Task Tracker",
  description: "AI-assisted project operations tool",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased font-sans">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
