"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Target, XCircle, DollarSign, AlertTriangle, Loader2 } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "https://drishti-h8gn.onrender.com"

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

interface SchedulingResult {
    jobsAssigned: number
    jobsDeferred: number
    totalRevenue: number
    totalRisk: number
    jobs: ScheduledJob[]
    deferredJobs: DeferredJob[]
}

export default function WeightTuningPage() {
    const [revenueWeight, setRevenueWeight] = useState(0.5)
    const [riskWeight, setRiskWeight] = useState(0.3)
    const [loadWeight, setLoadWeight] = useState(0.2)
    const [result, setResult] = useState<SchedulingResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const fetchResults = useCallback((rw: number, rkw: number, lw: number) => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setLoading(true)
            setError(null)
            fetch(`${API}/api/scheduling/optimize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ revenueWeight: rw, riskWeight: rkw, loadWeight: lw }),
            })
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`)
                    return res.json()
                })
                .then((json) => { setResult(json); setLoading(false) })
                .catch((err) => { setError(err.message); setLoading(false) })
        }, 500)
    }, [])

    useEffect(() => {
        fetchResults(revenueWeight, riskWeight, loadWeight)
    }, [revenueWeight, riskWeight, loadWeight, fetchResults])

    const jobs = result?.jobs ?? []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-wider">WEIGHT ADJUSTMENT PANEL</h1>
                <p className="text-sm text-neutral-400">Policy Tuning — Adjust scheduling weights to optimize job assignments</p>
            </div>

            {/* Weight Sliders */}
            <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">OPTIMIZATION WEIGHTS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-400">Revenue Weight</span>
                            <span className="text-white font-mono">{revenueWeight.toFixed(2)}</span>
                        </div>
                        <Slider
                            value={[revenueWeight]}
                            onValueChange={([v]) => setRevenueWeight(v)}
                            min={0}
                            max={1}
                            step={0.05}
                            className="w-full"
                            aria-label="Revenue weight"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-400">Risk Weight</span>
                            <span className="text-white font-mono">{riskWeight.toFixed(2)}</span>
                        </div>
                        <Slider
                            value={[riskWeight]}
                            onValueChange={([v]) => setRiskWeight(v)}
                            min={0}
                            max={1}
                            step={0.05}
                            className="w-full"
                            aria-label="Risk weight"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-400">Load Weight</span>
                            <span className="text-white font-mono">{loadWeight.toFixed(2)}</span>
                        </div>
                        <Slider
                            value={[loadWeight]}
                            onValueChange={([v]) => setLoadWeight(v)}
                            min={0}
                            max={1}
                            step={0.05}
                            className="w-full"
                            aria-label="Load weight"
                        />
                    </div>

                    <div className="p-3 bg-neutral-800 rounded border border-neutral-700 text-xs text-neutral-500">
                        Total Weight = {(revenueWeight + riskWeight + loadWeight).toFixed(2)}
                        {Math.abs(revenueWeight + riskWeight + loadWeight - 1.0) > 0.01 && (
                            <span className="text-orange-500 ml-2">⚠ Weights should sum to 1.0</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Error State */}
            {error && (
                <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-4">
                        <p className="text-red-400 text-sm">Failed to optimize: {error}</p>
                        <p className="text-neutral-500 text-xs mt-1">Ensure the backend is running at {API}</p>
                    </CardContent>
                </Card>
            )}

            {/* Result Summary */}
            {result && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-neutral-900 border-neutral-700">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-neutral-400 tracking-wider">JOBS ASSIGNED</p>
                                        <p className="text-2xl font-bold text-white font-mono">{loading ? "..." : result.jobsAssigned ?? 0}</p>
                                    </div>
                                    <Target className="w-8 h-8 text-white" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral-900 border-neutral-700">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-neutral-400 tracking-wider">JOBS DEFERRED</p>
                                        <p className="text-2xl font-bold text-orange-500 font-mono">{loading ? "..." : result.jobsDeferred ?? 0}</p>
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
                                        <p className="text-2xl font-bold text-white font-mono">{loading ? "..." : `$${(result.totalRevenue ?? 0).toLocaleString("en-US")}`}</p>
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
                                        <p className="text-2xl font-bold text-red-500 font-mono">{loading ? "..." : (result.totalRisk ?? 0).toFixed(2)}</p>
                                    </div>
                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Scheduling Results Table */}
                    <Card className="bg-neutral-900 border-neutral-700">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                                OPTIMIZED SCHEDULE {loading && <span className="text-orange-500 ml-2">RECALCULATING...</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {jobs.length > 0 ? (
                                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
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
                                <div className="p-8 text-center text-neutral-500 text-sm">No jobs scheduled with these weights</div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Initial Loading State */}
            {!result && !error && loading && (
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    <span className="ml-3 text-neutral-400 text-sm">Calculating initial schedule...</span>
                </div>
            )}
        </div>
    )
}
