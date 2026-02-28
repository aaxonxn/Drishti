"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface SensitivityRow {
    weightConfig: string
    jobsAssigned: number
    jobsDeferred: number
    totalRevenue: number
    totalRisk: number
    objectiveValue: number
}

export default function SensitivityPage() {
    const [rows, setRows] = useState<SensitivityRow[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetch(`${API}/api/sensitivity/analysis`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then((json) => { setRows(json); setLoading(false) })
            .catch((err) => { setError(err.message); setLoading(false) })
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="ml-3 text-neutral-400 text-sm">Loading sensitivity analysis...</span>
            </div>
        )
    }

    if (error || !rows) {
        return (
            <div>
                <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-6">
                        <p className="text-red-400 text-sm">Failed to load sensitivity data: {error ?? "Unknown error"}</p>
                        <p className="text-neutral-500 text-xs mt-2">Ensure the backend is running at {API}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (rows.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-wider">WEIGHT SENSITIVITY ANALYSIS</h1>
                    <p className="text-sm text-neutral-400">Policy Tuning — Compare scheduling outcomes across different weight configurations</p>
                </div>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-8 text-center text-neutral-500 text-sm">No sensitivity data available</CardContent>
                </Card>
            </div>
        )
    }

    const maxRevenue = Math.max(...rows.map((r) => r.totalRevenue ?? 0))
    const minRisk = Math.min(...rows.map((r) => r.totalRisk ?? Infinity))
    const maxObj = Math.max(...rows.map((r) => r.objectiveValue ?? 0))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-wider">WEIGHT SENSITIVITY ANALYSIS</h1>
                <p className="text-sm text-neutral-400">Policy Tuning — Compare scheduling outcomes across different weight configurations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">CONFIGURATIONS TESTED</p>
                        <p className="text-2xl font-bold text-white font-mono">{rows.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">BEST REVENUE</p>
                        <p className="text-2xl font-bold text-white font-mono">${maxRevenue.toLocaleString("en-US")}</p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">LOWEST RISK</p>
                        <p className="text-2xl font-bold text-white font-mono">{minRisk.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">SENSITIVITY COMPARISON</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-neutral-900">
                                <tr className="border-b border-neutral-700">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">WEIGHT CONFIG</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">JOBS ASSIGNED</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">JOBS DEFERRED</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">TOTAL REVENUE</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">TOTAL RISK</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">OBJECTIVE VALUE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr
                                        key={row.weightConfig}
                                        className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors ${index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                                            }`}
                                    >
                                        <td className="py-3 px-4 text-sm text-white">{row.weightConfig}</td>
                                        <td className="py-3 px-4 text-sm text-white font-mono">{row.jobsAssigned ?? 0}</td>
                                        <td className="py-3 px-4 text-sm text-orange-500 font-mono">{row.jobsDeferred ?? 0}</td>
                                        <td className={`py-3 px-4 text-sm font-mono ${row.totalRevenue === maxRevenue ? "text-orange-500 font-bold" : "text-white"}`}>
                                            ${(row.totalRevenue ?? 0).toLocaleString("en-US")}
                                        </td>
                                        <td className={`py-3 px-4 text-sm font-mono ${row.totalRisk === minRisk ? "text-white font-bold" : (row.totalRisk ?? 0) > 20 ? "text-red-500" : "text-white"}`}>
                                            {(row.totalRisk ?? 0).toFixed(2)}
                                        </td>
                                        <td className={`py-3 px-4 text-sm font-mono ${row.objectiveValue === maxObj ? "text-orange-500 font-bold" : "text-white"}`}>
                                            {(row.objectiveValue ?? 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
