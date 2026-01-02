"use client"

import { Card, CardContent } from "@/components/ui/card"
import { GoalWizard } from "@/components/goal-wizard"

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <GoalWizard
            mode="onboarding"
            includeOtherAspects={true}
            onComplete={() => {
              // Router.push happens inside GoalWizard for onboarding mode
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
