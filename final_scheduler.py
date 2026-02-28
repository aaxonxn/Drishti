# ============================================
# ZyraAI – Dynamic Scheduler Engine
# Multi-Objective + Capacity + Deadline
# With Deferred Reasons
# ============================================

import pandas as pd
import numpy as np

PLANNING_DAYS = 5

def run_scheduler(revenue_weight=0.5, risk_weight=0.4, load_weight=0.1):

    machines = pd.read_excel("outputs/Maintenance_Simulation_Results.xlsx")
    jobs = pd.read_excel("data/Job_Dataset.xlsx")

    machines["Weekly_Capacity"] = machines["Daily_Operating_Hours"] * PLANNING_DAYS

    machines["Available_Capacity"] = machines.apply(
        lambda row:
        row["Weekly_Capacity"] - row["Adjusted_Maintenance_Duration"]
        if row["Recommended_Action"] == "Perform Preventive Maintenance"
        else row["Weekly_Capacity"],
        axis=1
    )

    machines["Current_Load"] = 0
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

    schedule = []
    deferred_jobs = []

    for _, job in jobs.iterrows():

        eligible_machines = machines[
            machines["Machine_Type"] == job["Required_Machine_Type"]
        ]

        if eligible_machines.empty:
            deferred_jobs.append({
                "jobId": job["Job_ID"],
                "reason": "No Compatible Machine"
            })
            continue

        eligible_machines = eligible_machines[
            eligible_machines["Available_Capacity"] >= job["Processing_Time_Hours"]
        ]

        if eligible_machines.empty:
            deferred_jobs.append({
                "jobId": job["Job_ID"],
                "reason": "Capacity Exceeded"
            })
            continue

        best_score = -np.inf
        best_machine_index = None
        best_risk = None
        deadline_failed = False

        for idx, machine in eligible_machines.iterrows():

            projected_finish_time = (
                machine["Current_Load"] + job["Processing_Time_Hours"]
            )

            if projected_finish_time > job["Deadline_Hours"]:
                deadline_failed = True
                continue

            risk_penalty = (
                machine["Failure_Probability"]
                * job["Processing_Time_Hours"]
            )

            normalized_risk = risk_penalty / jobs["Processing_Time_Hours"].max()

            load_ratio = (
                machine["Current_Load"]
                / machine["Weekly_Capacity"]
            )

            score = (
                revenue_weight * job["Normalized_Revenue"]
                - risk_weight * normalized_risk
                - load_weight * load_ratio
            )

            if score > best_score:
                best_score = score
                best_machine_index = idx
                best_risk = risk_penalty

        if best_machine_index is None:
            reason = "Deadline Violated" if deadline_failed else "Capacity Exceeded"
            deferred_jobs.append({
                "jobId": job["Job_ID"],
                "reason": reason
            })
            continue

        machines.loc[best_machine_index, "Available_Capacity"] -= job["Processing_Time_Hours"]
        machines.loc[best_machine_index, "Current_Load"] += job["Processing_Time_Hours"]

        schedule.append({
            "jobId": job["Job_ID"],
            "assignedMachine": machines.loc[best_machine_index, "Machine_ID"],
            "revenue": float(job["Revenue_Per_Job"]),
            "riskComponent": float(best_risk),
            "finishTime": float(machines.loc[best_machine_index, "Current_Load"])
        })

    return {
        "jobsAssigned": len(schedule),
        "jobsDeferred": len(deferred_jobs),
        "totalRevenue": sum(j["revenue"] for j in schedule),
        "totalRisk": sum(j["riskComponent"] for j in schedule),
        "jobs": schedule,
        "deferredJobs": deferred_jobs
    }