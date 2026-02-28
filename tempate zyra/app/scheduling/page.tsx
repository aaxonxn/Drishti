"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, XCircle, DollarSign, AlertTriangle, X, Loader2 } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface ScheduledJob {
    jobId: string
    assignedMachine: string
    revenue: number
    riskComponent: number
    finishTime: number
}

interface DeferredJob {
    jobId: string
    reason: string
}

interface SchedulingSummary {
    jobsAssigned: number
    jobsDeferred: number
    totalRevenue: number
    totalRisk: number
    jobs: ScheduledJob[]
    deferredJobs: DeferredJob[]
}

export default function SchedulingPage() {
    const [data, setData] = useState<SchedulingSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<"scheduled" | "deferred">("scheduled")

    useEffect(() => {
        fetch(`${API}/api/scheduling/results`)
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
                <span className="ml-3 text-neutral-400 text-sm">Loading schedule...</span>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div>
                <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-6">
                        <p className="text-red-400 text-sm">Failed to load scheduling data: {error ?? "Unknown error"}</p>
                        <p className="text-neutral-500 text-xs mt-2">Ensure the backend is running at {API}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const jobs = data.jobs ?? []
    const deferredJobs = data.deferredJobs ?? []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-wider">RISK-AWARE JOB SCHEDULING</h1>
                <p className="text-sm text-neutral-400">Phase 4 — Optimized job assignment with risk considerations</p>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-neutral-400 tracking-wider">JOBS ASSIGNED</p>
                                <p className="text-2xl font-bold text-white font-mono">{data.jobsAssigned ?? 0}</p>
                            </div>
                            <Target className="w-8 h-8 text-white" />
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className={`bg-neutral-900 border-neutral-700 cursor-pointer transition-colors ${activeTab === "deferred" ? "border-orange-500" : "hover:border-orange-500"}`}
                    onClick={() => setActiveTab(activeTab === "deferred" ? "scheduled" : "deferred")}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-neutral-400 tracking-wider">JOBS DEFERRED <span className="text-orange-500">▸ CLICK</span></p>
                                <p className="text-2xl font-bold text-orange-500 font-mono">{data.jobsDeferred ?? 0}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-neutral-400 tracking-wider">TOTAL REVENUE</p>
                                <p className="text-2xl font-bold text-white font-mono">${(data.totalRevenue ?? 0).toLocaleString("en-US")}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-white" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-neutral-400 tracking-wider">TOTAL RISK</p>
                                <p className="text-2xl font-bold text-red-500 font-mono">{(data.totalRisk ?? 0).toFixed(2)}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 border-b border-neutral-700 pb-0">
                <button
                    onClick={() => setActiveTab("scheduled")}
                    aria-label="View scheduled jobs"
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "scheduled"
                        ? "border-orange-500 text-orange-500"
                        : "border-transparent text-neutral-400 hover:text-white"
                        }`}
                >
                    SCHEDULED JOBS ({jobs.length})
                </button>
                <button
                    onClick={() => setActiveTab("deferred")}
                    aria-label="View deferred jobs"
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "deferred"
                        ? "border-red-500 text-red-500"
                        : "border-transparent text-neutral-400 hover:text-white"
                        }`}
                >
                    DEFERRED JOBS ({deferredJobs.length})
                </button>
            </div>

            {/* Scheduled Jobs Table */}
            {activeTab === "scheduled" && (
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-0">
                        {jobs.length > 0 ? (
                            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                <table className="w-full">
                                    <thead className="sticky top-0 bg-neutral-900">
                                        <tr className="border-b border-neutral-700">
                                            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">JOB ID</th>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">ASSIGNED MACHINE</th>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">REVENUE</th>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">RISK COMPONENT</th>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">FINISH TIME</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((job, index) => (
                                            <tr
                                                key={job.jobId}
                                                className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors ${index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                                                    }`}
                                            >
                                                <td className="py-3 px-4 text-sm text-white font-mono">{job.jobId}</td>
                                                <td className="py-3 px-4 text-sm text-white font-mono">{job.assignedMachine}</td>
                                                <td className="py-3 px-4 text-sm text-white font-mono">${(job.revenue ?? 0).toLocaleString("en-US")}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-sm font-mono ${(job.riskComponent ?? 0) >= 2.0 ? "text-red-500" : (job.riskComponent ?? 0) >= 1.0 ? "text-orange-500" : "text-white"}`}>
                                                        {(job.riskComponent ?? 0).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-white font-mono">{(job.finishTime ?? 0).toFixed(1)}h</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-neutral-500 text-sm">No scheduled jobs available</div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Deferred Jobs Table */}
            {activeTab === "deferred" && (
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-red-500 tracking-wider">
                            DEFERRED JOBS — {deferredJobs.length} TOTAL
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {deferredJobs.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {deferredJobs.map((job) => (
                                    <div key={job.jobId} className="flex justify-between items-center p-3 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors">
                                        <span className="text-sm text-white font-mono">{job.jobId}</span>
                                        <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500">{job.reason}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-neutral-500 text-sm">No deferred jobs — all jobs were successfully scheduled</div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
