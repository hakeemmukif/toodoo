"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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
  Inbox,
  ClipboardCheck,
  Wallet,
  ChevronDown,
  Repeat,
  Flame,
  ChefHat,
  Compass,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { GoalWizardModal } from "@/components/goal-wizard-modal"
import { ExcavationBanner } from "@/components/excavation"
import { InterruptSheet } from "@/components/pattern-interrupt"
import { useInterruptTimer } from "@/hooks/use-interrupt-timer"
import { useInterruptsStore } from "@/stores/interrupts"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  disabled?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
  defaultOpen: boolean
}

// Core navigation - always visible, no collapse
const coreNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/foundation", label: "Foundation", icon: Compass },
  { href: "/journal", label: "Journal", icon: BookOpen, disabled: true },
]

// Collapsible sections with progressive disclosure
const navSections: NavSection[] = [
  {
    title: "Track",
    defaultOpen: false,
    items: [
      { href: "/training", label: "Training", icon: Dumbbell, disabled: true },
      { href: "/meals", label: "Meals", icon: Utensils },
      { href: "/financial", label: "Financial", icon: Wallet, disabled: true },
    ],
  },
  {
    title: "Cook",
    defaultOpen: true,
    items: [
      { href: "/recipes?method=air-fryer", label: "Air Fryer", icon: Flame },
      { href: "/recipes", label: "All Recipes", icon: BookMarked },
    ],
  },
  {
    title: "Organize",
    defaultOpen: false,
    items: [
      { href: "/recurring", label: "Recurring", icon: Repeat },
      { href: "/shopping", label: "Shopping", icon: ShoppingCart, disabled: true },
    ],
  },
  {
    title: "Reflect",
    defaultOpen: false,
    items: [
      { href: "/review", label: "Weekly Review", icon: ClipboardCheck, disabled: true },
      { href: "/analysis", label: "Analysis", icon: BarChart3, disabled: true },
    ],
  },
]

const settingsItem: NavItem = { href: "/settings", label: "Settings", icon: Settings }

const quickActions = [
  { label: "Start Cooking", icon: ChefHat, action: "start-cooking", href: "/recipes?method=air-fryer&tab=session" },
  { label: "Add Goal", icon: Target, action: "add-goal" },
  { label: "Add Task", icon: Plus, action: "add-task", href: "/tasks" },
  { label: "Write Journal", icon: PenLine, action: "write-journal", href: "/journal", disabled: true },
  { label: "Log Meal", icon: UtensilsCrossed, action: "log-meal", href: "/meals" },
  { label: "Log Training", icon: Activity, action: "log-training", href: "/training", disabled: true },
]

// Mobile bottom nav items - most commonly used
const mobileBottomNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
]

// Helper to check if nav item is active (handles query params)
function isNavItemActive(pathname: string, searchParams: string, itemHref: string): boolean {
  const [itemPath, itemQuery] = itemHref.split("?")

  // Must match base path
  if (pathname !== itemPath) return false

  // If item has query params, check if current URL includes them
  if (itemQuery) {
    const itemParams = new URLSearchParams(itemQuery)
    const currentParams = new URLSearchParams(searchParams)

    for (const [key, value] of itemParams.entries()) {
      if (currentParams.get(key) !== value) return false
    }
  }

  return true
}

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = item.icon

  if (item.disabled) {
    return (
      <span
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed opacity-40 select-none hover:bg-transparent"
        title="Coming soon"
      >
        <Icon className="h-[18px] w-[18px] stroke-[1.5]" />
        {item.label}
        <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Soon</span>
      </span>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        isActive
          ? "bg-foreground/5 font-medium text-foreground"
          : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
      )}
    >
      <Icon className="h-[18px] w-[18px] stroke-[1.5]" />
      {item.label}
    </Link>
  )
}

function CollapsibleSection({
  section,
  pathname,
  searchParams,
  openSections,
  onToggle,
}: {
  section: NavSection
  pathname: string
  searchParams: string
  openSections: Record<string, boolean>
  onToggle: (title: string) => void
}) {
  const isOpen = openSections[section.title] ?? section.defaultOpen
  const hasActiveItem = section.items.some((item) => {
    const [itemPath] = item.href.split("?")
    return pathname === itemPath
  })

  return (
    <Collapsible open={isOpen || hasActiveItem} onOpenChange={() => onToggle(section.title)}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors">
        <span>{section.title}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen || hasActiveItem ? "rotate-0" : "-rotate-90"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5">
        {section.items.map((item) => (
          <NavLink key={item.href} item={item} isActive={isNavItemActive(pathname, searchParams, item.href)} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParamsObj = useSearchParams()
  const searchParams = searchParamsObj.toString()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [goalWizardOpen, setGoalWizardOpen] = useState(false)

  // Pattern interrupt timer - checks for due interrupts every minute
  useInterruptTimer(60000)
  const currentInterrupt = useInterruptsStore((s) => s.currentInterrupt)
  const hideInterrupt = useInterruptsStore((s) => s.hideInterrupt)

  const handleQuickAction = (action: string, href?: string) => {
    if (action === "add-goal") {
      setGoalWizardOpen(true)
    } else if (href) {
      router.push(href)
    }
  }

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !(prev[title] ?? navSections.find((s) => s.title === title)?.defaultOpen ?? false),
    }))
  }

  // Get all items for mobile sheet
  const allNavItems = [
    ...coreNavItems,
    ...navSections.flatMap((s) => s.items),
    settingsItem,
  ]

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-border/60 bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center px-6">
          <h1 className="font-serif text-xl font-semibold tracking-tight">Life Tracker</h1>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-4">
          {/* Core nav - always visible */}
          {coreNavItems.map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href} />
          ))}

          {/* Collapsible sections */}
          <div className="space-y-3 pt-6">
            {navSections.map((section) => (
              <CollapsibleSection
                key={section.title}
                section={section}
                pathname={pathname}
                searchParams={searchParams}
                openSections={openSections}
                onToggle={toggleSection}
              />
            ))}
          </div>

          {/* Settings at bottom */}
          <div className="pt-6">
            <NavLink item={settingsItem} isActive={pathname === settingsItem.href} />
          </div>
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-card/80 px-4 backdrop-blur-sm lg:hidden">
        <h1 className="font-serif text-lg font-semibold tracking-tight">Life Tracker</h1>
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open navigation menu">
              <Menu className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 overflow-y-auto">
            <nav className="flex flex-col gap-1 pt-8">
              {/* Core items */}
              {coreNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  onClick={() => setMobileNavOpen(false)}
                />
              ))}

              {/* Collapsible sections */}
              <div className="space-y-3 pt-4">
                {navSections.map((section) => (
                  <div key={section.title}>
                    <p className="px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      {section.title}
                    </p>
                    {section.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                        onClick={() => setMobileNavOpen(false)}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Settings */}
              <div className="pt-4">
                <NavLink
                  item={settingsItem}
                  isActive={pathname === settingsItem.href}
                  onClick={() => setMobileNavOpen(false)}
                />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 lg:pb-0">
        {/* Daily Excavation Banner - prompts user until completed */}
        <div className="pt-4">
          <ExcavationBanner />
        </div>
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border/60 bg-card/80 backdrop-blur-sm lg:hidden">
        {mobileBottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-2 text-[11px] transition-colors",
                isActive ? "font-medium text-foreground" : "text-muted-foreground"
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
            <button
              className="flex flex-col items-center gap-1 px-3 py-2 text-[11px] text-muted-foreground"
              aria-label="Open more options menu"
            >
              <Menu className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <div className="space-y-4 py-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  <p className="px-3 pb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      if (item.disabled) {
                        return (
                          <span
                            key={item.href}
                            className="flex flex-col items-center gap-2 rounded-lg p-3 text-center opacity-40 cursor-not-allowed select-none hover:bg-transparent"
                            title="Coming soon"
                          >
                            <Icon className="h-6 w-6 stroke-[1.5] text-muted-foreground" />
                            <span className="text-xs">{item.label}</span>
                            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">Soon</span>
                          </span>
                        )
                      }
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
                </div>
              ))}
              <div className="pt-2">
                <Link
                  href={settingsItem.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-foreground/[0.03]"
                >
                  <Settings className="h-5 w-5 stroke-[1.5] text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      {/* Floating Action Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-md transition-shadow hover:shadow-lg lg:bottom-4"
            aria-label="Quick actions menu"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <DropdownMenuItem
                key={action.action}
                onClick={() => !action.disabled && handleQuickAction(action.action, action.href)}
                disabled={action.disabled}
                className={action.disabled ? "opacity-40 cursor-not-allowed" : ""}
              >
                <Icon className="mr-2 h-4 w-4 stroke-[1.5]" />
                {action.label}
                {action.disabled && (
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Soon</span>
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Goal Wizard Modal */}
      <GoalWizardModal
        open={goalWizardOpen}
        onOpenChange={setGoalWizardOpen}
      />

      {/* Pattern Interrupt Sheet */}
      <InterruptSheet
        interrupt={currentInterrupt}
        open={currentInterrupt !== null}
        onOpenChange={(open) => {
          if (!open) hideInterrupt()
        }}
      />
    </div>
  )
}
