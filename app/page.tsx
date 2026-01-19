"use client"

import { AppLayout } from "@/components/app-layout"
import { SolarSystemVisualization } from "@/components/landscape"

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] w-full p-4">
        <SolarSystemVisualization
          onPlanetClick={(month) => {
            console.log("Clicked month:", month)
          }}
          onPlanetHover={(month) => {
            if (month) console.log("Hovering:", month)
          }}
        />
      </div>
    </AppLayout>
  )
}
