import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function RootNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
      <FileQuestion className="h-10 w-10 text-muted-foreground" />
      <div>
        <h2 className="text-xl font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  )
}
