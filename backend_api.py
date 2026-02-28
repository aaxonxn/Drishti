from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from final_scheduler import run_scheduler

app = FastAPI()

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
        load_weight=weights.loadWeight
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