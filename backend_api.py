from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
from datetime import datetime
from final_scheduler import run_scheduler

app = FastAPI(title="DRISHTI API", version="1.0")

# --------------------------------------------
# In-Memory Operator State
# (resets on server restart — fine for demo)
# --------------------------------------------
operator_state = {
    "machine_overrides": {},   # { machineId: "offline" | "maintenance" | "active" }
    "acknowledged_alerts": set(),  # set of acknowledged machineIds
    "action_log": [],          # list of {timestamp, action, detail}
    "custom_jobs": [],         # list of extra jobs injected by operator
}

def log_action(action: str, detail: str):
    operator_state["action_log"].insert(0, {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "action": action,
        "detail": detail,
    })
    # keep last 50 actions only
    operator_state["action_log"] = operator_state["action_log"][:50]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------
# Dashboard Summary
# --------------------------------------------
@app.get("/api/dashboard/summary")
def dashboard_summary():
    schedule_data = run_scheduler()

    maintenance = pd.read_excel("outputs/Maintenance_Simulation_Results.xlsx")

    return {
        "totalJobsAssigned": schedule_data["jobsAssigned"],
        "totalJobsDeferred": schedule_data["jobsDeferred"],
        "totalRevenue": schedule_data["totalRevenue"],
        "totalRiskExposure": schedule_data["totalRisk"],
        "machinesForPM": int(
            (maintenance["Recommended_Action"] == "Perform Preventive Maintenance").sum()
        ),
        "machinesForReplacement": int(
            (maintenance["Recommended_Action"] == "Replace Machine").sum()
        ),
        "throughputPerDay": schedule_data["totalRevenue"] / 5,
        "totalDowntimeHours": float(
            maintenance["Immediate_Downtime_Hours"].sum()
        )
    }

# --------------------------------------------
# Scheduling Results
# --------------------------------------------
@app.get("/api/scheduling/results")
def scheduling_results():
    return run_scheduler()

# --------------------------------------------
# Weight Optimization
# --------------------------------------------
class WeightRequest(BaseModel):
    revenueWeight: float
    riskWeight: float
    loadWeight: float

@app.post("/api/scheduling/optimize")
def optimize_schedule(weights: WeightRequest):
    return run_scheduler(
        revenue_weight=weights.revenueWeight,
        risk_weight=weights.riskWeight,
        load_weight=weights.loadWeight,
        machine_overrides=operator_state["machine_overrides"],
        custom_jobs=operator_state["custom_jobs"],
    )

# --------------------------------------------
# Machine Health
# --------------------------------------------
@app.get("/api/machines/health")
def machine_health():
    df = pd.read_excel("outputs/Machine_Dataset_With_HealthScore.xlsx")

    result = []
    for _, row in df.iterrows():
        result.append({
            "machineId": row["Machine_ID"],
            "healthScore": float(row["Machine_Health_Score"] / 100),
            "failureProbability": float(row["Failure_Probability"]),
            "riskCategory": "High" if row["Failure_Probability"] > 0.75
                else "Medium" if row["Failure_Probability"] > 0.4
                else "Low"
        })
    return result

# --------------------------------------------
# Maintenance Simulation
# --------------------------------------------
@app.get("/api/maintenance/simulation")
def maintenance_sim():
    df = pd.read_excel("outputs/Maintenance_Simulation_Results.xlsx")

    result = []
    for _, row in df.iterrows():
        result.append({
            "machineId": row["Machine_ID"],
            "immediateCost": float(row["Immediate_Total_Cost"]),
            "delayedExpectedCost": float(row["Delayed_Total_Expected_Cost"]),
            "recommendedAction": row["Recommended_Action"]
        })
    return result

# --------------------------------------------
# Sensitivity Analysis
# --------------------------------------------
@app.get("/api/sensitivity/analysis")
def sensitivity():
    df = pd.read_excel("outputs/Weight_Sensitivity_Analysis.xlsx")

    result = []
    for _, row in df.iterrows():
        result.append({
            "weightConfig": f"({row['Revenue_Weight']:.1f} / {row['Risk_Weight']:.1f} / {row['Load_Weight']:.1f})",
            "jobsAssigned": int(row["Jobs_Assigned"]),
            "jobsDeferred": int(row["Jobs_Deferred"]),
            "totalRevenue": float(row["Total_Revenue"]),
            "totalRisk": float(row["Total_Risk"]),
            "objectiveValue": float(row["Objective_Value"])
        })
    return result

# --------------------------------------------
# Operator — Active Alerts (unacknowledged high-risk machines)
# --------------------------------------------
@app.get("/api/operator/alerts")
def operator_alerts():
    df = pd.read_excel("outputs/Machine_Dataset_With_HealthScore.xlsx")
    alerts = []
    for _, row in df.iterrows():
        mid = str(row["Machine_ID"])
        if row["Failure_Probability"] > 0.75 and mid not in operator_state["acknowledged_alerts"]:
            alerts.append({
                "machineId": mid,
                "failureProbability": round(float(row["Failure_Probability"]), 3),
                "healthScore": round(float(row["Machine_Health_Score"]), 1),
                "machineAge": int(row["Machine_Age"]) if "Machine_Age" in row.index else 0,
                "machineType": str(row["Machine_Type"]),
                "currentStatus": operator_state["machine_overrides"].get(mid, "active"),
            })
    return sorted(alerts, key=lambda x: x["failureProbability"], reverse=True)

# --------------------------------------------
# Operator — Acknowledge Alert
# --------------------------------------------
class AcknowledgeRequest(BaseModel):
    machineId: str

@app.post("/api/operator/acknowledge-alert")
def acknowledge_alert(req: AcknowledgeRequest):
    operator_state["acknowledged_alerts"].add(req.machineId)
    log_action("ACKNOWLEDGE", f"Alert acknowledged for machine {req.machineId}")
    return {"success": True, "machineId": req.machineId}

# --------------------------------------------
# Operator — Override Machine Status
# --------------------------------------------
class OverrideRequest(BaseModel):
    machineId: str
    status: str  # "active" | "maintenance" | "offline"

@app.post("/api/operator/override-machine")
def override_machine(req: OverrideRequest):
    if req.status not in ("active", "maintenance", "offline"):
        return {"success": False, "error": "Invalid status. Use: active | maintenance | offline"}
    operator_state["machine_overrides"][req.machineId] = req.status
    log_action("OVERRIDE", f"Machine {req.machineId} → {req.status.upper()}")
    return {"success": True, "machineId": req.machineId, "status": req.status}

# --------------------------------------------
# Operator — Add Custom Job to Queue
# --------------------------------------------
class AddJobRequest(BaseModel):
    jobId: str
    requiredMachineType: str
    revenuePerJob: float
    processingTimeHours: float
    deadlineHours: float
    priorityLevel: int = 1

@app.post("/api/operator/add-job")
def add_job(req: AddJobRequest):
    job = {
        "Job_ID": req.jobId,
        "Required_Machine_Type": req.requiredMachineType,
        "Revenue_Per_Job": req.revenuePerJob,
        "Processing_Time_Hours": req.processingTimeHours,
        "Deadline_Hours": req.deadlineHours,
        "Priority_Level": req.priorityLevel,
    }

    # ── 1. Keep in-memory for the current scheduler session ──
    operator_state["custom_jobs"].append(job)

    # ── 2. Persist to the actual Excel dataset so it survives restarts ──
    job_path = "data/Job_Dataset.xlsx"
    try:
        existing = pd.read_excel(job_path)
        # Guard: don't add duplicates if Job_ID already exists
        if req.jobId in existing["Job_ID"].astype(str).values:
            log_action("ADD JOB", f"Job {req.jobId} already exists in dataset — skipped duplicate write")
            return {"success": False, "error": f"Job ID '{req.jobId}' already exists in the dataset"}
        new_row = pd.DataFrame([job])
        updated = pd.concat([existing, new_row], ignore_index=True)
        updated.to_excel(job_path, index=False)
        persisted = True
    except Exception as e:
        persisted = False
        log_action("ADD JOB ERROR", f"Failed to write to dataset: {str(e)}")

    status = "saved to dataset" if persisted else "in-memory only (dataset write failed)"
    log_action("ADD JOB", f"Job {req.jobId} queued ({req.requiredMachineType}, ${req.revenuePerJob:,.0f}) — {status}")
    return {
        "success": True,
        "job": job,
        "persisted": persisted,
        "totalCustomJobs": len(operator_state["custom_jobs"])
    }


# --------------------------------------------
# Operator — Action Log
# --------------------------------------------
@app.get("/api/operator/log")
def operator_log():
    return operator_state["action_log"]

# --------------------------------------------
# Operator — Reset All Overrides & Custom Jobs
# --------------------------------------------
@app.post("/api/operator/reset")
def operator_reset():
    operator_state["machine_overrides"].clear()
    operator_state["acknowledged_alerts"].clear()
    operator_state["custom_jobs"].clear()
    log_action("RESET", "All operator overrides, alerts, and custom jobs cleared")
    return {"success": True}