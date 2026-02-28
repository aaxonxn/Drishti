# ============================================
# ZyraAI – Phase 4 Smart Risk-Aware Scheduler
# Heuristic Version
# ============================================

import pandas as pd
import os

print("\nLoading Data...")

machines = pd.read_excel("outputs/Maintenance_Simulation_Results.xlsx")
jobs = pd.read_excel("data/Job_Dataset.xlsx")

print("Data Loaded Successfully")

# --------------------------------------------------
# 1️⃣ Calculate Weekly Available Capacity
# --------------------------------------------------

machines["Weekly_Capacity"] = machines["Daily_Operating_Hours"] * 7

# Reduce capacity if preventive maintenance recommended
machines["Available_Capacity"] = machines.apply(
    lambda row:
    row["Weekly_Capacity"] - row["Adjusted_Maintenance_Duration"]
    if row["Recommended_Action"] == "Perform Preventive Maintenance"
    else row["Weekly_Capacity"],
    axis=1
)

# Exclude machines marked for replacement
machines = machines[machines["Recommended_Action"] != "Replace Machine"]

# --------------------------------------------------
# 2️⃣ Sort Jobs by Priority and Revenue
# --------------------------------------------------

jobs = jobs.sort_values(
    by=["Priority_Level", "Revenue_Per_Job"],
    ascending=[False, False]
)

schedule = []
deferred_jobs = []

# --------------------------------------------------
# 3️⃣ Assignment Loop
# --------------------------------------------------

for _, job in jobs.iterrows():

    eligible_machines = machines[
        machines["Machine_Type"] == job["Required_Machine_Type"]
    ]

    # Filter machines with enough capacity
    eligible_machines = eligible_machines[
        eligible_machines["Available_Capacity"] >= job["Processing_Time_Hours"]
    ]

    if eligible_machines.empty:
        deferred_jobs.append(job["Job_ID"])
        continue

    # Choose healthiest machine
    selected_machine = eligible_machines.sort_values(
        by="Machine_Health_Score",
        ascending=False
    ).iloc[0]

    # Calculate risk penalty
    risk_penalty = (
        selected_machine["Failure_Probability"]
        * job["Processing_Time_Hours"]
    )

    schedule.append({
        "Job_ID": job["Job_ID"],
        "Assigned_Machine": selected_machine["Machine_ID"],
        "Revenue": job["Revenue_Per_Job"],
        "Risk_Penalty": risk_penalty
    })

    # Reduce capacity
    machines.loc[
        machines["Machine_ID"] == selected_machine["Machine_ID"],
        "Available_Capacity"
    ] -= job["Processing_Time_Hours"]

# --------------------------------------------------
# 4️⃣ Results
# --------------------------------------------------

schedule_df = pd.DataFrame(schedule)

total_revenue = schedule_df["Revenue"].sum()
total_risk = schedule_df["Risk_Penalty"].sum()

os.makedirs("outputs", exist_ok=True)
schedule_df.to_excel("outputs/Final_Schedule.xlsx", index=False)

print("\n========== PHASE 4 SUMMARY ==========")
print("Total Jobs Assigned:", len(schedule_df))
print("Total Jobs Deferred:", len(deferred_jobs))
print("Total Revenue Generated: ₹", total_revenue)
print("Total Risk Exposure:", round(total_risk, 2))

print("\nSchedule saved to outputs/Final_Schedule.xlsx")
print("\n===== Phase 4 Completed Successfully =====\n")