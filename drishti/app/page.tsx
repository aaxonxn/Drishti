"use client"

import { useState, useEffect } from "react"
import { Bell, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

import DashboardPage from "./dashboard/page"
import MachineHealthPage from "./machine-health/page"
import MaintenancePage from "./maintenance/page"
import SchedulingPage from "./scheduling/page"
import WeightTuningPage from "./weight-tuning/page"
import SensitivityPage from "./sensitivity/page"
import OperatorPage from "./operator/page"

export default function DrishtiDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [currentTime, setCurrentTime] = useState<string | null>(null)

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString("en-US"))
  }, [])

  const sectionLabels: Record<string, string> = {
    dashboard: "DASHBOARD",
    "machine-health": "MACHINE HEALTH",
    maintenance: "MAINTENANCE SIM",
    scheduling: "SCHEDULING",
    "weight-tuning": "WEIGHT TUNING",
    sensitivity: "SENSITIVITY",
    operator: "OPERATOR",
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <div className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="DRISHTI logo" className="w-8 h-8" />
            <h1 className="text-xl font-bold text-orange-500 tracking-wider">DRISHTI</h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Predictive Maintenance & Scheduling
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2" aria-label="Main navigation">
          {Object.keys(sectionLabels).map((key) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              aria-label={`Navigate to ${sectionLabels[key]}`}
              aria-current={activeSection === key ? "page" : undefined}
              className={`w-full text-left px-4 py-2 rounded text-sm transition flex items-center justify-between ${activeSection === key
                  ? key === "operator"
                    ? "bg-orange-500 text-black font-semibold"
                    : "bg-orange-500 text-black font-semibold"
                  : key === "operator"
                    ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 border border-orange-500/30"
                    : "text-neutral-400 hover:text-orange-500 hover:bg-neutral-900"
                }`}
            >
              {sectionLabels[key]}
              {key === "operator" && activeSection !== "operator" && (
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-800 text-xs text-neutral-500">
          <div className="text-white font-semibold mb-1">SYSTEM ONLINE</div>
          <div>MACHINES: LIVE</div>
          <div>STATUS: OPERATIONAL</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-6">
          <div className="text-sm text-neutral-400">
            DRISHTI /{" "}
            <span className="text-orange-500 font-semibold">
              {sectionLabels[activeSection]}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">
              LAST UPDATE: {currentTime ?? "Loading..."}
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="text-neutral-400 hover:text-orange-500"
            >
              <Bell className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh data"
              className="text-neutral-400 hover:text-orange-500"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Section Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "dashboard" && <DashboardPage />}
          {activeSection === "machine-health" && <MachineHealthPage />}
          {activeSection === "maintenance" && <MaintenancePage />}
          {activeSection === "scheduling" && <SchedulingPage />}
          {activeSection === "weight-tuning" && <WeightTuningPage />}
          {activeSection === "sensitivity" && <SensitivityPage />}
          {activeSection === "operator" && <OperatorPage />}
        </div>
      </div>
    </div>
  )
}