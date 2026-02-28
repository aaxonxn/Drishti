# ============================================
# ZyraAI – Phase 4 Advanced Multi-Objective Scheduler
# Competitive Version with Trade-Off Tuning
# ============================================

import pandas as pd
import os
import numpy as np

print("\nLoading Data...")

machines = pd.read_excel("outputs/Maintenance_Simulation_Results.xlsx")
jobs = pd.read_excel("data/Job_Dataset.xlsx")

print("Data Loaded Successfully")

# --------------------------------------------------
# 🔧 Adjustable Weights (TUNE THESE)
# --------------------------------------------------

W_REVENUE = 0.4
W_RISK = 0.5
W_LOAD = 0.1

# --------------------------------------------------
# 1️⃣ Planning Horizon (Reduced to Create Trade-Offs)
# --------------------------------------------------

PLANNING_DAYS = 5

machines["Weekly_Capacity"] = machines["Daily_Operating_Hours"] * PLANNING_DAYS

machines["Available_Capacity"] = machines.apply(
    lambda row:
    row["Weekly_Capacity"] - row["Adjusted_Maintenance_Duration"]
    if row["Recommended_Action"] == "Perform Preventive Maintenance"
    else row["Weekly_Capacity"],
    axis=1
)

# Remove machines marked for replacement
machines = machines[machines["Recommended_Action"] != "Replace Machine"]

# --------------------------------------------------
# 2️⃣ Normalize Job Revenue
# --------------------------------------------------

jobs["Normalized_Revenue"] = (
    jobs["Revenue_Per_Job"] - jobs["Revenue_Per_Job"].min()
) / (
    jobs["Revenue_Per_Job"].max() - jobs["Revenue_Per_Job"].min()
)

# Sort jobs by priority first
jobs = jobs.sort_values(
    by=["Priority_Level", "Revenue_Per_Job"],
    ascending=[False, False]
)

schedule = []
deferred_jobs = []

# --------------------------------------------------
# 3️⃣ Assignment Loop (Multi-Objective)
# --------------------------------------------------

for _, job in jobs.iterrows():

    eligible_machines = machines[
        machines["Machine_Type"] == job["Required_Machine_Type"]
    ]

    eligible_machines = eligible_machines[
        eligible_machines["Available_Capacity"] >= job["Processing_Time_Hours"]
    ]

    if eligible_machines.empty:
        deferred_jobs.append(job["Job_ID"])
        continue

    best_score = -np.inf
    best_machine = None

    for _, machine in eligible_machines.iterrows():

        risk_penalty = (
            machine["Failure_Probability"] *
            job["Processing_Time_Hours"]
        )

        # Normalize risk
        normalized_risk = risk_penalty / (
            jobs["Processing_Time_Hours"].max()
        )

        # Load stress penalty
        load_ratio = (
            machine["Weekly_Capacity"] -
            machine["Available_Capacity"]
        ) / machine["Weekly_Capacity"]

        score = (
            W_REVENUE * job["Normalized_Revenue"]
            - W_RISK * normalized_risk
            - W_LOAD * load_ratio
        )

        if score > best_score:
            best_score = score
            best_machine = machine

    if best_machine is None:
        deferred_jobs.append(job["Job_ID"])
        continue

    schedule.append({
        "Job_ID": job["Job_ID"],
        "Assigned_Machine": best_machine["Machine_ID"],
        "Revenue": job["Revenue_Per_Job"],
        "Score": round(best_score, 4),
        "Risk_Component": round(risk_penalty, 4)
    })

    machines.loc[
        machines["Machine_ID"] == best_machine["Machine_ID"],
        "Available_Capacity"
    ] -= job["Processing_Time_Hours"]

# --------------------------------------------------
# 4️⃣ Results
# --------------------------------------------------

schedule_df = pd.DataFrame(schedule)

total_revenue = schedule_df["Revenue"].sum()
total_jobs_assigned = len(schedule_df)
total_jobs_deferred = len(deferred_jobs)

total_risk = schedule_df["Risk_Component"].sum()

os.makedirs("outputs", exist_ok=True)
schedule_df.to_excel("outputs/Advanced_Final_Schedule.xlsx", index=False)

print("\n========== ADVANCED PHASE 4 SUMMARY ==========")
print("Jobs Assigned:", total_jobs_assigned)
print("Jobs Deferred:", total_jobs_deferred)
print("Total Revenue: ₹", total_revenue)
print("Total Risk Exposure:", round(total_risk, 2))
print("\nWeights Used:")
print("Revenue Weight:", W_REVENUE)
print("Risk Weight:", W_RISK)
print("Load Weight:", W_LOAD)

print("\nSchedule saved to outputs/Advanced_Final_Schedule.xlsx")
print("\n===== Advanced Phase 4 Completed Successfully =====\n")