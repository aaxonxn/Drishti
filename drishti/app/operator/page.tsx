"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertTriangle, CheckCircle2, Power, Wrench, WifiOff,
    PlusCircle, RotateCcw, ClipboardList, Loader2, RefreshCw
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "https://drishti-h8gn.onrender.com"

/* ─────────── Types ─────────── */
interface Alert {
    machineId: string
    failureProbability: number
    healthScore: number
    machineAge: number
    machineType: string
    currentStatus: string
}

interface LogEntry {
    timestamp: string
    action: string
    detail: string
}

const MACHINE_TYPES = ["CNC", "Lathe", "Milling", "Drilling", "Welding", "Press", "Grinder"]

const statusColors: Record<string, string> = {
    active: "text-green-400 bg-green-500/10 border-green-500/30",
    maintenance: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    offline: "text-red-400 bg-red-500/10 border-red-500/30",
}
const statusIcons: Record<string, React.ReactNode> = {
    active: <Power className="w-3 h-3" />,
    maintenance: <Wrench className="w-3 h-3" />,
    offline: <WifiOff className="w-3 h-3" />,
}

/* ─────────── Component ─────────── */
export default function OperatorPage() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [log, setLog] = useState<LogEntry[]>([])
    const [alertsLoading, setAlertsLoading] = useState(true)
    const [ackingId, setAckingId] = useState<string | null>(null)
    const [overridingId, setOverridingId] = useState<string | null>(null)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // Add Job form state
    const [jobId, setJobId] = useState("")
    const [machineType, setMachineType] = useState(MACHINE_TYPES[0])
    const [revenue, setRevenue] = useState("")
    const [processingTime, setProcessingTime] = useState("")
    const [deadline, setDeadline] = useState("")
    const [priority, setPriority] = useState("1")
    const [jobSubmitting, setJobSubmitting] = useState(false)

    // Machine override panel
    const [overrideMachineId, setOverrideMachineId] = useState("")
    const [overrideStatus, setOverrideStatus] = useState<"active" | "maintenance" | "offline">("maintenance")

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchAlerts = useCallback(() => {
        setAlertsLoading(true)
        fetch(`${API}/api/operator/alerts`)
            .then(r => r.json())
            .then(data => { setAlerts(data); setAlertsLoading(false) })
            .catch(() => setAlertsLoading(false))
    }, [])

    const fetchLog = useCallback(() => {
        fetch(`${API}/api/operator/log`)
            .then(r => r.json())
            .then(setLog)
            .catch(() => { })
    }, [])

    useEffect(() => {
        fetchAlerts()
        fetchLog()
    }, [fetchAlerts, fetchLog])

    const refresh = () => { fetchAlerts(); fetchLog() }

    /* ── Acknowledge alert ── */
    const acknowledgeAlert = (machineId: string) => {
        setAckingId(machineId)
        fetch(`${API}/api/operator/acknowledge-alert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ machineId }),
        })
            .then(r => r.json())
            .then(() => {
                showToast(`Alert for ${machineId} acknowledged`)
                fetchAlerts()
                fetchLog()
            })
            .catch(() => showToast("Failed to acknowledge", false))
            .finally(() => setAckingId(null))
    }

    /* ── Override machine status ── */
    const overrideMachine = () => {
        if (!overrideMachineId.trim()) { showToast("Enter a Machine ID", false); return }
        setOverridingId(overrideMachineId)
        fetch(`${API}/api/operator/override-machine`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ machineId: overrideMachineId.trim(), status: overrideStatus }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) { showToast(`${data.machineId} set to ${data.status.toUpperCase()}`); setOverrideMachineId("") }
                else showToast(data.error ?? "Override failed", false)
                fetchLog()
            })
            .catch(() => showToast("Failed to override", false))
            .finally(() => setOverridingId(null))
    }

    /* ── Add job ── */
    const submitJob = (e: React.FormEvent) => {
        e.preventDefault()
        if (!jobId.trim() || !revenue || !processingTime || !deadline) {
            showToast("Fill all job fields", false); return
        }
        setJobSubmitting(true)
        fetch(`${API}/api/operator/add-job`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jobId: jobId.trim(),
                requiredMachineType: machineType,
                revenuePerJob: parseFloat(revenue),
                processingTimeHours: parseFloat(processingTime),
                deadlineHours: parseFloat(deadline),
                priorityLevel: parseInt(priority),
            }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    showToast(`Job ${data.job.Job_ID} added to queue`)
                    setJobId(""); setRevenue(""); setProcessingTime(""); setDeadline(""); setPriority("1")
                } else showToast("Failed to add job", false)
                fetchLog()
            })
            .catch(() => showToast("Failed to add job", false))
            .finally(() => setJobSubmitting(false))
    }

    /* ── Reset all ── */
    const resetAll = () => {
        if (!confirm("Reset all overrides, acknowledged alerts, and custom jobs?")) return
        fetch(`${API}/api/operator/reset`, { method: "POST" })
            .then(r => r.json())
            .then(() => { showToast("Operator state reset"); fetchAlerts(); fetchLog() })
            .catch(() => showToast("Reset failed", false))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-wider">OPERATOR CONTROL PANEL</h1>
                    <p className="text-sm text-neutral-400">Real-time machine overrides, alert management &amp; job injection</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={refresh}
                        aria-label="Refresh operator data"
                        className="flex items-center gap-2 px-3 py-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" /> REFRESH
                    </button>
                    <button
                        onClick={resetAll}
                        aria-label="Reset all operator overrides"
                        className="flex items-center gap-2 px-3 py-2 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/30 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" /> RESET ALL
                    </button>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded border text-sm font-mono shadow-lg transition-all
                    ${toast.ok ? "bg-green-500/10 border-green-500/40 text-green-400" : "bg-red-500/10 border-red-500/40 text-red-400"}`}>
                    {toast.ok ? <CheckCircle2 className="inline w-4 h-4 mr-2" /> : <AlertTriangle className="inline w-4 h-4 mr-2" />}
                    {toast.msg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── LEFT COLUMN ── */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Active Alerts Panel */}
                    <Card className="bg-neutral-900 border-neutral-700">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                                <span className="text-red-400">ACTIVE ALERTS</span>
                                {alerts.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">{alerts.length}</span>
                                )}
                            </CardTitle>
                            <span className="text-xs text-neutral-500">Failure Probability &gt; 75%</span>
                        </CardHeader>
                        <CardContent>
                            {alertsLoading ? (
                                <div className="flex items-center gap-3 py-6 justify-center">
                                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                                    <span className="text-sm text-neutral-400">Loading alerts...</span>
                                </div>
                            ) : alerts.length === 0 ? (
                                <div className="py-8 text-center">
                                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                    <p className="text-sm text-neutral-400">No active alerts — all high-risk machines acknowledged</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {alerts.map(alert => (
                                        <div key={alert.machineId}
                                            className="flex items-center justify-between p-3 bg-neutral-800 rounded border border-red-500/20 hover:border-red-500/40 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                                <div className="min-w-0">
                                                    <div className="text-sm text-white font-mono">{alert.machineId}</div>
                                                    <div className="text-xs text-neutral-500">
                                                        {alert.machineType} · Age {alert.machineAge}y · Health {alert.healthScore.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-3">
                                                <div className="text-right">
                                                    <div className="text-red-400 font-mono text-sm font-bold">
                                                        {(alert.failureProbability * 100).toFixed(1)}%
                                                    </div>
                                                    <div className="text-xs text-neutral-500">fail prob</div>
                                                </div>
                                                <button
                                                    onClick={() => acknowledgeAlert(alert.machineId)}
                                                    disabled={ackingId === alert.machineId}
                                                    aria-label={`Acknowledge alert for ${alert.machineId}`}
                                                    className="px-3 py-1.5 text-xs rounded bg-neutral-700 hover:bg-green-500/20 hover:text-green-400 text-neutral-300 border border-neutral-600 hover:border-green-500/40 transition-colors disabled:opacity-50"
                                                >
                                                    {ackingId === alert.machineId
                                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                                        : "ACKNOWLEDGE"
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Machine Status Override */}
                    <Card className="bg-neutral-900 border-neutral-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-orange-500" />
                                MACHINE STATUS OVERRIDE
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-neutral-500">Force a machine into a specific state. This affects the scheduler immediately on the next optimize run.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs text-neutral-400 mb-1">MACHINE ID</label>
                                    <input
                                        type="text"
                                        value={overrideMachineId}
                                        onChange={e => setOverrideMachineId(e.target.value)}
                                        placeholder="e.g. M_001"
                                        aria-label="Machine ID for override"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-400 mb-1">STATUS</label>
                                    <select
                                        value={overrideStatus}
                                        onChange={e => setOverrideStatus(e.target.value as "active" | "maintenance" | "offline")}
                                        aria-label="Override status"
                                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:border-orange-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="offline">Offline</option>
                                    </select>
                                </div>
                            </div>

                            {/* Status preview badges */}
                            <div className="flex gap-2 flex-wrap">
                                {(["active", "maintenance", "offline"] as const).map(s => (
                                    <button key={s}
                                        onClick={() => setOverrideStatus(s)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors
                                            ${overrideStatus === s ? statusColors[s] : "border-neutral-700 text-neutral-500 bg-neutral-800 hover:border-neutral-500"}`}>
                                        {statusIcons[s]}
                                        {s.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={overrideMachine}
                                disabled={overridingId !== null}
                                aria-label="Apply machine status override"
                                className="w-full py-2 text-xs font-semibold tracking-wider rounded bg-orange-500 hover:bg-orange-600 text-black transition-colors disabled:opacity-50"
                            >
                                {overridingId ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "APPLY OVERRIDE"}
                            </button>
                        </CardContent>
                    </Card>

                    {/* Add New Job */}
                    <Card className="bg-neutral-900 border-neutral-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                                <PlusCircle className="w-4 h-4 text-orange-500" />
                                INJECT NEW JOB
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-neutral-500 mb-4">Add an urgent job to the queue. It will be included in the next schedule optimisation run.</p>
                            <form onSubmit={submitJob} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">JOB ID *</label>
                                        <input
                                            type="text"
                                            value={jobId}
                                            onChange={e => setJobId(e.target.value)}
                                            placeholder="e.g. JOB_URGENT_01"
                                            required
                                            aria-label="Job ID"
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">MACHINE TYPE *</label>
                                        <select
                                            value={machineType}
                                            onChange={e => setMachineType(e.target.value)}
                                            aria-label="Required machine type"
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:border-orange-500"
                                        >
                                            {MACHINE_TYPES.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">REVENUE (USD) *</label>
                                        <input
                                            type="number"
                                            value={revenue}
                                            onChange={e => setRevenue(e.target.value)}
                                            placeholder="e.g. 95000"
                                            min={0}
                                            required
                                            aria-label="Revenue per job"
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">PROCESSING TIME (hrs) *</label>
                                        <input
                                            type="number"
                                            value={processingTime}
                                            onChange={e => setProcessingTime(e.target.value)}
                                            placeholder="e.g. 8"
                                            min={0.5}
                                            step={0.5}
                                            required
                                            aria-label="Processing time in hours"
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">DEADLINE (hrs from now) *</label>
                                        <input
                                            type="number"
                                            value={deadline}
                                            onChange={e => setDeadline(e.target.value)}
                                            placeholder="e.g. 40"
                                            min={1}
                                            required
                                            aria-label="Deadline in hours"
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-400 mb-1">PRIORITY (1–5)</label>
                                        <select
                                            value={priority}
                                            onChange={e => setPriority(e.target.value)}
                                            aria-label="Job priority level"
                                            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:border-orange-500"
                                        >
                                            {[1, 2, 3, 4, 5].map(p => (
                                                <option key={p} value={p}>Priority {p}{p === 5 ? " (Highest)" : p === 1 ? " (Lowest)" : ""}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={jobSubmitting}
                                    aria-label="Submit new job to queue"
                                    className="w-full py-2 text-xs font-semibold tracking-wider rounded bg-orange-500 hover:bg-orange-600 text-black transition-colors disabled:opacity-50"
                                >
                                    {jobSubmitting
                                        ? <><Loader2 className="inline w-3 h-3 animate-spin mr-2" />ADDING JOB...</>
                                        : "ADD JOB TO QUEUE"
                                    }
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* ── RIGHT COLUMN — Action Log ── */}
                <div className="lg:col-span-5">
                    <Card className="bg-neutral-900 border-neutral-700 sticky top-0">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-orange-500" />
                                OPERATOR ACTION LOG
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {log.length === 0 ? (
                                <div className="py-12 text-center">
                                    <ClipboardList className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                                    <p className="text-sm text-neutral-500">No operator actions yet this session</p>
                                    <p className="text-xs text-neutral-600 mt-1">Actions appear here as you interact with the panel</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                                    {log.map((entry, i) => {
                                        const actionColors: Record<string, string> = {
                                            "ACKNOWLEDGE": "text-green-400 bg-green-500/10",
                                            "OVERRIDE": "text-orange-400 bg-orange-500/10",
                                            "ADD JOB": "text-blue-400 bg-blue-500/10",
                                            "RESET": "text-red-400 bg-red-500/10",
                                        }
                                        const colorClass = actionColors[entry.action] ?? "text-neutral-400 bg-neutral-700"
                                        return (
                                            <div key={i} className="flex items-start gap-3 p-2.5 bg-neutral-800 rounded hover:bg-neutral-750 transition-colors">
                                                <span className="text-xs text-neutral-500 font-mono shrink-0 mt-0.5">{entry.timestamp}</span>
                                                <div className="min-w-0">
                                                    <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-mono font-semibold ${colorClass} mb-1`}>
                                                        {entry.action}
                                                    </span>
                                                    <p className="text-xs text-neutral-300 break-words">{entry.detail}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
