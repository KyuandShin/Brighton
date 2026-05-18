"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Home, Users, Calendar, BookOpen, Heart, TrendingUp, ClipboardList,
  UserCheck, Settings, MessageSquare, HelpCircle, Search
} from "lucide-react"

const dashboardRoutes = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Find Tutors", href: "/dashboard/tutors", icon: Users },
  { name: "My Classes", href: "/dashboard/classes", icon: BookOpen },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Bookings", href: "/dashboard/bookings", icon: ClipboardList },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
  { name: "Feedback", href: "/dashboard/feedback", icon: TrendingUp },
  { name: "Test History", href: "/dashboard/test-history", icon: TrendingUp },
  { name: "Placement Test", href: "/dashboard/test", icon: HelpCircle },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const adminRoutes = [
  { name: "Admin Dashboard", href: "/dashboard/admin", icon: Home },
  { name: "Tutor Approvals", href: "/dashboard/admin/tutors", icon: UserCheck },
  { name: "Students", href: "/dashboard/admin/students", icon: Users },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:bg-surface-elevated hover:text-text-main transition-all border border-border/50"
        aria-label="Open command palette"
      >
        <Search size={14} strokeWidth={2} />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex ml-2 h-5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-text-muted">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Dashboard">
              {dashboardRoutes.map((route) => {
                const Icon = route.icon
                return (
                  <CommandItem
                    key={route.href}
                    onSelect={() => runCommand(route.href)}
                  >
                    <Icon size={16} className="mr-2" />
                    {route.name}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandGroup heading="Admin">
              {adminRoutes.map((route) => {
                const Icon = route.icon
                return (
                  <CommandItem
                    key={route.href}
                    onSelect={() => runCommand(route.href)}
                  >
                    <Icon size={16} className="mr-2" />
                    {route.name}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}