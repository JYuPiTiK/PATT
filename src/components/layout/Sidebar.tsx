"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  CheckSquare,
  ListChecks,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/approval-queue", label: "Approval Queue", icon: CheckSquare },
  { href: "/items", label: "Work Items", icon: ListChecks },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-sidebar-primary-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-white text-sm font-bold">
            P
          </div>
          <span>PATT</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <nav className="px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator className="my-2 bg-sidebar-border" />

        <div className="px-2 pb-4">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </Link>
        </div>
      </ScrollArea>
    </aside>
  )
}
