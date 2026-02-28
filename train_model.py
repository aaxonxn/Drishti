# ============================================
# ZyraAI – Phase 2 Failure Prediction Model
# With Terminal Progress Bar (Final Version)
# ============================================

import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
from tqdm import tqdm

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    roc_curve,
    roc_auc_score
)

# --------------------------------------------------
# 1️⃣ Create Required Folders
# --------------------------------------------------

os.makedirs("outputs", exist_ok=True)
os.makedirs("models", exist_ok=True)

# --------------------------------------------------
# 2️⃣ Load Dataset
# --------------------------------------------------

print("\nLoading Machine Dataset...")
df = pd.read_excel("data/Machine_Dataset.xlsx")

print("Dataset Loaded Successfully")
print("Shape:", df.shape)

# --------------------------------------------------
# 3️⃣ Feature Selection
# --------------------------------------------------

X = df.drop(columns=[
    "Machine_ID",
    "Machine_Type",
    "Installation_Year",
    "Failure_Label"
])

y = df["Failure_Label"]

print("\nFeature Columns:")
print(list(X.columns))

# --------------------------------------------------
# 4️⃣ Train-Test Split (Stratified)
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining Samples:", len(X_train))
print("Testing Samples:", len(X_test))

# --------------------------------------------------
# 5️⃣ Train Random Forest WITH Progress Bar
# --------------------------------------------------

n_trees = 200

model = RandomForestClassifier(
    n_estimators=1,
    warm_start=True,
    random_state=42
)

print("\nTraining Random Forest Model...")

for i in tqdm(range(1, n_trees + 1)):
    model.n_estimators = i
    model.fit(X_train, y_train)

print("Training Completed Successfully!")

# --------------------------------------------------
# 6️⃣ Model Evaluation
# --------------------------------------------------

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auc_score = roc_auc_score(y_test, y_prob)

print("\n========== MODEL PERFORMANCE ==========")
print("Accuracy :", round(accuracy, 4))
print("Precision:", round(precision, 4))
print("Recall   :", round(recall, 4))
print("F1 Score :", round(f1, 4))
print("AUC Score:", round(auc_score, 4))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# --------------------------------------------------
# 7️⃣ ROC Curve Plot
# --------------------------------------------------

fpr, tpr, _ = roc_curve(y_test, y_prob)

plt.figure()
plt.plot(fpr, tpr)
plt.title(f"ROC Curve (AUC = {auc_score:.3f})")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.tight_layout()
plt.savefig("outputs/roc_curve.png")
plt.close()

print("\nROC Curve saved to outputs/roc_curve.png")

# --------------------------------------------------
# 8️⃣ Feature Importance
# --------------------------------------------------

importances = model.feature_importances_
features = X.columns

importance_df = pd.DataFrame({
    "Feature": features,
    "Importance": importances
}).sort_values(by="Importance", ascending=False)

print("\nTop Important Features:")
print(importance_df)

plt.figure()
plt.bar(importance_df["Feature"], importance_df["Importance"])
plt.xticks(rotation=90)
plt.title("Feature Importance - Random Forest")
plt.tight_layout()
plt.savefig("outputs/feature_importance.png")
plt.close()

print("Feature Importance plot saved to outputs/feature_importance.png")

# --------------------------------------------------
# 9️⃣ Generate Failure Probability & Health Score
# --------------------------------------------------

all_prob = model.predict_proba(X)[:, 1]

df["Failure_Probability"] = all_prob
df["Machine_Health_Score"] = (1 - all_prob) * 100

df.to_excel("outputs/Machine_Dataset_With_HealthScore.xlsx", index=False)

print("\nMachine Health Scores Generated!")
print("Updated dataset saved to outputs/Machine_Dataset_With_HealthScore.xlsx")

# --------------------------------------------------
# 🔟 Save Model
# --------------------------------------------------

import joblib
joblib.dump(model, "models/random_forest_model.pkl")

print("\nModel Saved Successfully to models/random_forest_model.pkl")
print("\n===== Phase 2 Completed Successfully =====\n")