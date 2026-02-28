# ============================================
# ZyraAI – Phase 3 Maintenance Simulation
# Fully Industrial, No Weakness Version
# ============================================

import pandas as pd
import os

print("\nLoading Machine Health Data...")

df = pd.read_excel("outputs/Machine_Dataset_With_HealthScore.xlsx")
cost_df = pd.read_excel("data/Maintenance_Cost_Parameters.xlsx")

print("Cost Parameters Loaded Successfully")

# --------------------------------------------------
# Extract Cost Parameters
# --------------------------------------------------

preventive_cost = cost_df.loc[
    cost_df["Parameter"] == "Preventive_Maintenance_Cost",
    "Value_INR_or_Hours"
].values[0]

corrective_cost = cost_df.loc[
    cost_df["Parameter"] == "Corrective_Maintenance_Cost",
    "Value_INR_or_Hours"
].values[0]

downtime_cost_per_hour = cost_df.loc[
    cost_df["Parameter"] == "Downtime_Cost_Per_Hour",
    "Value_INR_or_Hours"
].values[0]

replacement_cost = cost_df.loc[
    cost_df["Parameter"] == "Replacement_Cost",
    "Value_INR_or_Hours"
].values[0]

base_maintenance_duration = cost_df.loc[
    cost_df["Parameter"] == "Standard_Maintenance_Duration_Hours",
    "Value_INR_or_Hours"
].values[0]

# --------------------------------------------------
# 1️⃣ Dynamic Preventive Maintenance
# --------------------------------------------------

df["Adjusted_Preventive_Cost"] = (
    preventive_cost
    * (1 + 0.5 * df["Failure_Probability"])
    * (1 + 0.02 * df["Machine_Age"])
)

df["Adjusted_Maintenance_Duration"] = (
    base_maintenance_duration
    * (1 + 0.3 * df["Failure_Probability"])
)

df["Immediate_Downtime_Hours"] = df["Adjusted_Maintenance_Duration"]

df["Immediate_Production_Loss_Units"] = (
    df["Immediate_Downtime_Hours"] * df["Capacity_Per_Hour"]
)

df["Immediate_Downtime_Cost"] = (
    df["Immediate_Downtime_Hours"] * downtime_cost_per_hour
)

df["Immediate_Total_Cost"] = (
    df["Adjusted_Preventive_Cost"] +
    df["Immediate_Downtime_Cost"]
)

# --------------------------------------------------
# 2️⃣ Delayed Maintenance (Risk-Weighted)
# --------------------------------------------------

df["Adjusted_Corrective_Cost"] = (
    corrective_cost * (1 + df["Failure_Probability"])
)

df["Expected_Breakdown_Downtime_Hours"] = (
    df["Failure_Probability"]
    * df["Adjusted_Maintenance_Duration"]
    * 1.5
)

df["Expected_Production_Loss_Units"] = (
    df["Expected_Breakdown_Downtime_Hours"]
    * df["Capacity_Per_Hour"]
)

df["Expected_Corrective_Cost"] = (
    df["Failure_Probability"]
    * df["Adjusted_Corrective_Cost"]
)

df["Expected_Downtime_Cost"] = (
    df["Expected_Breakdown_Downtime_Hours"]
    * downtime_cost_per_hour
)

df["Delayed_Total_Expected_Cost"] = (
    df["Expected_Corrective_Cost"]
    + df["Expected_Downtime_Cost"]
)

# --------------------------------------------------
# 3️⃣ Replacement Decision Layer
# --------------------------------------------------

df["Replacement_Triggered"] = (
    (df["Failure_Probability"] > 0.85) &
    (df["Machine_Age"] > 15)
)

df.loc[df["Replacement_Triggered"], "Delayed_Total_Expected_Cost"] += replacement_cost

# --------------------------------------------------
# 4️⃣ Cost Comparison
# --------------------------------------------------

df["Cost_Difference"] = (
    df["Delayed_Total_Expected_Cost"]
    - df["Immediate_Total_Cost"]
)

df["Recommended_Action"] = df.apply(
    lambda row:
    "Replace Machine"
    if row["Replacement_Triggered"]
    else (
        "Perform Preventive Maintenance"
        if row["Cost_Difference"] > 0
        else "Delay Maintenance"
    ),
    axis=1
)

# --------------------------------------------------
# 5️⃣ Risk Categorization
# --------------------------------------------------

def categorize_risk(prob):
    if prob >= 0.75:
        return "High Risk"
    elif prob >= 0.4:
        return "Medium Risk"
    else:
        return "Low Risk"

df["Risk_Category"] = df["Failure_Probability"].apply(categorize_risk)

# --------------------------------------------------
# Save Results
# --------------------------------------------------

os.makedirs("outputs", exist_ok=True)
df.to_excel("outputs/Maintenance_Simulation_Results.xlsx", index=False)

print("\nMaintenance Simulation Completed!")

print("\n========== PHASE 3 SUMMARY ==========")
print("Preventive:", (df["Recommended_Action"] == "Perform Preventive Maintenance").sum())
print("Delay:", (df["Recommended_Action"] == "Delay Maintenance").sum())
print("Replacement:", (df["Recommended_Action"] == "Replace Machine").sum())

print("\nTotal Immediate Cost: ₹", round(df["Immediate_Total_Cost"].sum(), 2))
print("Total Delayed Expected Cost: ₹", round(df["Delayed_Total_Expected_Cost"].sum(), 2))

print("\n===== Fully Industrial Phase 3 Completed =====\n")