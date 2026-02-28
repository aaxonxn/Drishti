# ============================================
# ZyraAI – Weight Sensitivity Analysis Engine
# Phase 4 Competitive Upgrade
# ============================================

import pandas as pd
import numpy as np
import os

print("\nLoading Data...")

base_machines = pd.read_excel("outputs/Maintenance_Simulation_Results.xlsx")
base_jobs = pd.read_excel("data/Job_Dataset.xlsx")

print("Data Loaded Successfully")

PLANNING_DAYS = 5

weight_configs = [
    (0.7, 0.2, 0.1),
    (0.6, 0.3, 0.1),
    (0.5, 0.4, 0.1),
    (0.4, 0.5, 0.1),
    (0.3, 0.6, 0.1),
]

results = []

for W_REVENUE, W_RISK, W_LOAD in weight_configs:

    machines = base_machines.copy()
    jobs = base_jobs.copy()

    machines["Weekly_Capacity"] = machines["Daily_Operating_Hours"] * PLANNING_DAYS

    machines["Available_Capacity"] = machines.apply(
        lambda row:
        row["Weekly_Capacity"] - row["Adjusted_Maintenance_Duration"]
        if row["Recommended_Action"] == "Perform Preventive Maintenance"
        else row["Weekly_Capacity"],
        axis=1
    )

    machines = machines[machines["Recommended_Action"] != "Replace Machine"]

    jobs["Normalized_Revenue"] = (
        jobs["Revenue_Per_Job"] - jobs["Revenue_Per_Job"].min()
    ) / (
        jobs["Revenue_Per_Job"].max() - jobs["Revenue_Per_Job"].min()
    )

    jobs = jobs.sort_values(
        by=["Priority_Level", "Revenue_Per_Job"],
        ascending=[False, False]
    )

    total_revenue = 0
    total_risk = 0
    assigned_jobs = 0
    deferred_jobs = 0

    for _, job in jobs.iterrows():

        eligible_machines = machines[
            machines["Machine_Type"] == job["Required_Machine_Type"]
        ]

        eligible_machines = eligible_machines[
            eligible_machines["Available_Capacity"] >= job["Processing_Time_Hours"]
        ]

        if eligible_machines.empty:
            deferred_jobs += 1
            continue

        best_score = -np.inf
        best_machine = None

        for _, machine in eligible_machines.iterrows():

            risk_penalty = (
                machine["Failure_Probability"]
                * job["Processing_Time_Hours"]
            )

            normalized_risk = risk_penalty / jobs["Processing_Time_Hours"].max()

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
                best_risk = risk_penalty

        if best_machine is None:
            deferred_jobs += 1
            continue

        machines.loc[
            machines["Machine_ID"] == best_machine["Machine_ID"],
            "Available_Capacity"
        ] -= job["Processing_Time_Hours"]

        total_revenue += job["Revenue_Per_Job"]
        total_risk += best_risk
        assigned_jobs += 1

    objective_value = (
        W_REVENUE * total_revenue
        - W_RISK * total_risk
    )

    results.append({
        "Revenue_Weight": W_REVENUE,
        "Risk_Weight": W_RISK,
        "Load_Weight": W_LOAD,
        "Jobs_Assigned": assigned_jobs,
        "Jobs_Deferred": deferred_jobs,
        "Total_Revenue": total_revenue,
        "Total_Risk": round(total_risk, 2),
        "Objective_Value": round(objective_value, 2)
    })

results_df = pd.DataFrame(results)

os.makedirs("outputs", exist_ok=True)
results_df.to_excel("outputs/Weight_Sensitivity_Analysis.xlsx", index=False)

print("\n========== WEIGHT SENSITIVITY RESULTS ==========")
print(results_df)

print("\nResults saved to outputs/Weight_Sensitivity_Analysis.xlsx")
print("\n===== Sensitivity Analysis Completed =====\n")