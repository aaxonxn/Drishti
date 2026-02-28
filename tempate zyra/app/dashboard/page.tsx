"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, XCircle, DollarSign, AlertTriangle, Wrench, Trash2, Activity, Clock, Loader2 } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface DashboardSummary {
    totalJobsAssigned: number
    totalJobsDeferred: number
    totalRevenue: number
    totalRiskExposure: number
    machinesForPM: number
    machinesForReplacement: number
    throughputPerDay: number
    totalDowntimeHours: number
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetch(`${API}/api/dashboard/summary`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then((json) => { setData(json); setLoading(false) })
            .catch((err) => { setError(err.message); setLoading(false) })
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="ml-3 text-neutral-400 text-sm">Loading dashboard...</span>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="p-6">
                <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-6">
                        <p className="text-red-400 text-sm">Failed to load dashboard: {error ?? "Unknown error"}</p>
                        <p className="text-neutral-500 text-xs mt-2">Ensure the backend is running at {API}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const metrics = [
        { label: "TOTAL JOBS ASSIGNED", value: data.totalJobsAssigned ?? 0, icon: Target, color: "text-white", iconColor: "text-white" },
        { label: "TOTAL JOBS DEFERRED", value: data.totalJobsDeferred ?? 0, icon: XCircle, color: "text-orange-500", iconColor: "text-orange-500" },
        { label: "TOTAL REVENUE", value: `$${(data.totalRevenue ?? 0).toLocaleString("en-US")}`, icon: DollarSign, color: "text-white", iconColor: "text-white" },
        { label: "TOTAL RISK EXPOSURE", value: (data.totalRiskExposure ?? 0).toFixed(2), icon: AlertTriangle, color: "text-red-500", iconColor: "text-red-500" },
        { label: "MACHINES FOR PM", value: data.machinesForPM ?? 0, icon: Wrench, color: "text-orange-500", iconColor: "text-orange-500" },
        { label: "MACHINES FOR REPLACEMENT", value: data.machinesForReplacement ?? 0, icon: Trash2, color: "text-red-500", iconColor: "text-red-500" },
        { label: "THROUGHPUT / DAY", value: `$${(data.throughputPerDay ?? 0).toLocaleString("en-US")}`, icon: Activity, color: "text-white", iconColor: "text-white" },
        { label: "TOTAL DOWNTIME (HRS)", value: `${(data.totalDowntimeHours ?? 0).toFixed(1)}h`, icon: Clock, color: "text-orange-500", iconColor: "text-orange-500" },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-wider">DASHBOARD OVERVIEW</h1>
                <p className="text-sm text-neutral-400">Predictive Maintenance & Risk-Aware Scheduling Summary</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                    <Card key={metric.label} className="bg-neutral-900 border-neutral-700">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-neutral-400 tracking-wider">{metric.label}</p>
                                    <p className={`text-2xl font-bold font-mono ${metric.color}`}>{metric.value}</p>
                                </div>
                                <metric.icon className={`w-8 h-8 ${metric.iconColor}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-6 bg-neutral-900 border-neutral-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SYSTEM MODULES</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {[
                                { label: "Machine Health Monitoring", status: "ACTIVE", phase: "Phase 2" },
                                { label: "Maintenance Strategy Simulation", status: "ACTIVE", phase: "Phase 3" },
                                { label: "Risk-Aware Job Scheduling", status: "ACTIVE", phase: "Phase 4" },
                                { label: "Weight Sensitivity Analysis", status: "ACTIVE", phase: "Policy Tuning" },
                            ].map((module) => (
                                <div
                                    key={module.label}
                                    className="flex items-center justify-between p-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                        <div>
                                            <div className="text-xs text-white font-mono">{module.phase}</div>
                                            <div className="text-xs text-neutral-500">{module.label}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded bg-white/20 text-white uppercase tracking-wider">
                                        {module.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-6 bg-neutral-900 border-neutral-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">RISK DISTRIBUTION</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    <span className="text-xs text-white font-medium">Machine Risk Categories</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-neutral-400">High Risk</span>
                                        <span className="text-red-500 font-bold font-mono">{data.machinesForReplacement ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-neutral-400">Needs PM</span>
                                        <span className="text-orange-500 font-bold font-mono">{data.machinesForPM ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span className="text-xs text-orange-500 font-medium">Scheduling Summary</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-neutral-400">Jobs Assigned</span>
                                        <span className="text-white font-bold font-mono">{data.totalJobsAssigned ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-neutral-400">Jobs Deferred</span>
                                        <span className="text-orange-500 font-bold font-mono">{data.totalJobsDeferred ?? 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
