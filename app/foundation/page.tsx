"use client"

import { AppLayout } from "@/components/app-layout"
import { NorthStarView } from "@/components/foundation"

export default function FoundationPage() {
  return (
    <AppLayout>
      <div className="container max-w-2xl space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Foundation</h1>
          <p className="text-sm text-muted-foreground">
            Your north star - the why behind your goals
          </p>
        </div>

        {/* North Star View */}
        <NorthStarView />
      </div>
    </AppLayout>
  )
}
