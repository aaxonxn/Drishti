"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface MaintenanceRecord {
    machineId: string
    immediateCost: number
    delayedExpectedCost: number
    recommendedAction: string
}

export default function MaintenancePage() {
    const [records, setRecords] = useState<MaintenanceRecord[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetch(`${API}/api/maintenance/simulation`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then((json) => { setRecords(json); setLoading(false) })
            .catch((err) => { setError(err.message); setLoading(false) })
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="ml-3 text-neutral-400 text-sm">Loading maintenance simulation...</span>
            </div>
        )
    }

    if (error || !records) {
        return (
            <div>
                <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-6">
                        <p className="text-red-400 text-sm">Failed to load maintenance data: {error ?? "Unknown error"}</p>
                        <p className="text-neutral-500 text-xs mt-2">Ensure the backend is running at {API}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const totalImmediateCost = records.reduce((acc, r) => acc + r.immediateCost, 0)
    const totalDelayedCost = records.reduce((acc, r) => acc + r.delayedExpectedCost, 0)
    const pmCount = records.filter((r) => r.recommendedAction === "Preventive Maintenance" || r.recommendedAction === "Perform Preventive Maintenance").length
    const replaceCount = records.filter((r) => r.recommendedAction === "Replacement" || r.recommendedAction === "Replace Machine").length
    const continueCount = records.filter((r) => r.recommendedAction === "Continue Operation").length

    const getActionColor = (action: string) => {
        if (action.includes("Preventive") || action.includes("Maintenance")) return "bg-orange-500/20 text-orange-500"
        if (action.includes("Replace")) return "bg-red-500/20 text-red-500"
        if (action.includes("Continue")) return "bg-white/20 text-white"
        return "bg-neutral-500/20 text-neutral-300"
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-wider">MAINTENANCE STRATEGY SIMULATION</h1>
                <p className="text-sm text-neutral-400">Phase 3 — Cost comparison and recommended maintenance actions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">IMMEDIATE TOTAL COST</p>
                        <p className="text-2xl font-bold text-white font-mono">${totalImmediateCost.toLocaleString("en-US")}</p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">DELAYED EXPECTED COST</p>
                        <p className="text-2xl font-bold text-orange-500 font-mono">${totalDelayedCost.toLocaleString("en-US")}</p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">PREVENTIVE MAINT.</p>
                        <p className="text-2xl font-bold text-orange-500 font-mono">{pmCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">REPLACEMENT</p>
                        <p className="text-2xl font-bold text-red-500 font-mono">{replaceCount}</p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">CONTINUE OPS</p>
                        <p className="text-2xl font-bold text-white font-mono">{continueCount}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">COST COMPARISON SUMMARY</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-neutral-800 rounded border border-neutral-700">
                            <div className="text-xs text-neutral-400 tracking-wider mb-2">IMMEDIATE MAINTENANCE (ALL MACHINES)</div>
                            <div className="text-3xl font-bold text-white font-mono">${totalImmediateCost.toLocaleString("en-US")}</div>
                            <p className="text-xs text-neutral-500 mt-1">Perform maintenance on all machines now</p>
                        </div>
                        <div className="p-4 bg-neutral-800 rounded border border-neutral-700">
                            <div className="text-xs text-neutral-400 tracking-wider mb-2">DELAYED / RISK-ADJUSTED COST</div>
                            <div className={`text-3xl font-bold font-mono ${totalDelayedCost > totalImmediateCost ? "text-red-500" : "text-white"}`}>
                                ${totalDelayedCost.toLocaleString("en-US")}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">Expected cost if maintenance is deferred</p>
                        </div>
                    </div>
                    {totalDelayedCost > totalImmediateCost && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                            ⚠ Delayed cost exceeds immediate cost by ${(totalDelayedCost - totalImmediateCost).toLocaleString("en-US")} — proactive maintenance is recommended.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PER-MACHINE SIMULATION</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-neutral-900">
                                <tr className="border-b border-neutral-700">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">MACHINE ID</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">IMMEDIATE COST</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">DELAYED EXPECTED COST</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">RECOMMENDED ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record, index) => (
                                    <tr
                                        key={record.machineId}
                                        className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors ${index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                                            }`}
                                    >
                                        <td className="py-3 px-4 text-sm text-white font-mono">{record.machineId}</td>
                                        <td className="py-3 px-4 text-sm text-white font-mono">${record.immediateCost.toLocaleString("en-US")}</td>
                                        <td className={`py-3 px-4 text-sm font-mono ${record.delayedExpectedCost > record.immediateCost ? "text-red-500" : "text-white"}`}>
                                            ${record.delayedExpectedCost.toLocaleString("en-US")}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge className={getActionColor(record.recommendedAction)}>
                                                {record.recommendedAction.toUpperCase()}
                                            </Badge>
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
