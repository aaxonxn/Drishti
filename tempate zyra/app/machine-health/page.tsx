"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

interface MachineHealth {
    machineId: string
    healthScore: number
    failureProbability: number
    riskCategory: string
}

export default function MachineHealthPage() {
    const [machines, setMachines] = useState<MachineHealth[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetch(`${API}/api/machines/health`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
            .then((json) => { setMachines(json); setLoading(false) })
            .catch((err) => { setError(err.message); setLoading(false) })
    }, [])

    const getRiskColor = (risk: string) => {
        switch (risk.toLowerCase()) {
            case "high":
                return "bg-red-500/20 text-red-500"
            case "medium":
                return "bg-orange-500/20 text-orange-500"
            case "low":
                return "bg-white/20 text-white"
            default:
                return "bg-neutral-500/20 text-neutral-300"
        }
    }

    const getHealthBarColor = (score: number) => {
        if (score >= 0.85) return "bg-white"
        if (score >= 0.7) return "bg-orange-500"
        return "bg-red-500"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="ml-3 text-neutral-400 text-sm">Loading machine health data...</span>
            </div>
        )
    }

    if (error || !machines) {
        return (
            <div>
                <Card className="bg-red-500/10 border-red-500/30">
                    <CardContent className="p-6">
                        <p className="text-red-400 text-sm">Failed to load machine health: {error ?? "Unknown error"}</p>
                        <p className="text-neutral-500 text-xs mt-2">Ensure the backend is running at {API}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-wider">MACHINE HEALTH MONITORING</h1>
                <p className="text-sm text-neutral-400">Phase 2 — Real-time machine health scores and failure probabilities</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">TOTAL MACHINES</p>
                        <p className="text-2xl font-bold text-white font-mono">{machines.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">HIGH RISK</p>
                        <p className="text-2xl font-bold text-red-500 font-mono">{machines.filter((m) => m.riskCategory === "High").length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">MEDIUM RISK</p>
                        <p className="text-2xl font-bold text-orange-500 font-mono">{machines.filter((m) => m.riskCategory === "Medium").length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-neutral-900 border-neutral-700">
                    <CardContent className="p-4">
                        <p className="text-xs text-neutral-400 tracking-wider">AVG HEALTH</p>
                        <p className="text-2xl font-bold text-white font-mono">
                            {machines.length > 0 ? (machines.reduce((acc, m) => acc + m.healthScore, 0) / machines.length * 100).toFixed(1) : "0.0"}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">MACHINE HEALTH DATA</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-neutral-900">
                                <tr className="border-b border-neutral-700">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">MACHINE ID</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">HEALTH SCORE</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">FAILURE PROBABILITY</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">RISK CATEGORY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {machines.map((machine, index) => (
                                    <tr
                                        key={machine.machineId}
                                        className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors ${index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                                            }`}
                                    >
                                        <td className="py-3 px-4 text-sm text-white font-mono">{machine.machineId}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-white font-mono w-14">{(machine.healthScore * 100).toFixed(1)}%</span>
                                                <div className="w-24 bg-neutral-800 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-300 ${getHealthBarColor(machine.healthScore)}`}
                                                        style={{ width: `${machine.healthScore * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-white font-mono">{(machine.failureProbability * 100).toFixed(1)}%</td>
                                        <td className="py-3 px-4">
                                            <Badge className={getRiskColor(machine.riskCategory)}>
                                                {machine.riskCategory.toUpperCase()}
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
