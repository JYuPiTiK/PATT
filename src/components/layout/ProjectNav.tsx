"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface Tab {
  label: string
  href: string
}

export function ProjectNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b -mb-6">
      {tabs.map((tab) => {
        const isActive =
          tab.href === pathname ||
          (tab.label !== "Overview" && pathname.startsWith(tab.href))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
