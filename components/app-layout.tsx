"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Target,
  ListTodo,
  BookOpen,
  Dumbbell,
  Utensils,
  BookMarked,
  ShoppingCart,
  BarChart3,
  Settings,
  Menu,
  Plus,
  PenLine,
  UtensilsCrossed,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/journal", label: "Journal", icon: BookOpen },
]

const moreNavItems = [
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/recipes", label: "Recipes", icon: BookMarked },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  { href: "/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

const quickActions = [
  { label: "Add Task", icon: Plus, action: "add-task" },
  { label: "Write Journal", icon: PenLine, action: "write-journal" },
  { label: "Log Meal", icon: UtensilsCrossed, action: "log-meal" },
  { label: "Log Training", icon: Activity, action: "log-training" },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-64 border-r border-border/60 bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center px-6">
          <h1 className="font-serif text-xl font-semibold tracking-tight">Life Tracker</h1>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 pt-4">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-foreground/5 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px] stroke-[1.5]" />
                {item.label}
              </Link>
            )
          })}
          <div className="pt-6">
            <p className="px-3 pb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              More
            </p>
            {moreNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-foreground/5 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
                  )}
                >
                  <Icon className="h-[18px] w-[18px] stroke-[1.5]" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-card/80 px-4 backdrop-blur-sm lg:hidden">
        <h1 className="font-serif text-lg font-semibold tracking-tight">Life Tracker</h1>
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5 stroke-[1.5]" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="flex flex-col gap-1 pt-8">
              {[...mainNavItems, ...moreNavItems].map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      isActive
                        ? "bg-foreground/5 font-medium text-foreground"
                        : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] stroke-[1.5]" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border/60 bg-card/80 backdrop-blur-sm lg:hidden">
        {mainNavItems.slice(0, 4).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 text-[11px] transition-colors",
                isActive ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5 stroke-[1.5]" />
              <span>{item.label}</span>
              {isActive && <span className="absolute bottom-0 h-0.5 w-0.5 rounded-full bg-foreground" />}
            </Link>
          )
        })}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-3 py-2 text-[11px] text-muted-foreground">
              <Menu className="h-5 w-5 stroke-[1.5]" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <div className="grid grid-cols-3 gap-3 py-6">
              {moreNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-colors hover:bg-foreground/[0.03]"
                  >
                    <Icon className="h-6 w-6 stroke-[1.5] text-muted-foreground" />
                    <span className="text-xs">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-md transition-shadow hover:shadow-lg lg:bottom-4"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <DropdownMenuItem key={action.action}>
                <Icon className="mr-2 h-4 w-4 stroke-[1.5]" />
                {action.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
