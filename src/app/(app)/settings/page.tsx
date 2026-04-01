import Link from "next/link"

const SETTINGS_SECTIONS = [
  {
    title: "Workflow",
    items: [
      {
        href: "/settings/statuses",
        label: "Workflow Statuses",
        description: "Manage the statuses available across all projects",
      },
    ],
  },
]

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Workspace-wide configuration</p>
      </div>

      {SETTINGS_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </h2>
          <div className="rounded-lg border divide-y">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <span className="text-muted-foreground">→</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
