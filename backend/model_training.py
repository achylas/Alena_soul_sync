"""
SoulSync OCD Model Training
Run this in Google Colab after loading ocd_patient_dataset.csv

Two models:
1. OCD Detection    — binary: OCD present (score > 7) vs not
2. Severity Classifier — 5-class: Subclinical/Mild/Moderate/Severe/Extreme

Input features (what the user answers in the app):
  obs_q1..obs_q5   = obsession subscale answers (0-4 each)
  comp_q1..comp_q5 = compulsion subscale answers (0-4 each)
  obs_total        = sum of obs answers (0-20)
  comp_total       = sum of comp answers (0-20)
  total_score      = obs_total + comp_total (0-40)
"""

# ── CELL 1: Install & imports ──────────────────────────────────────────────────
import pandas as pd
import numpy as np
import joblib
import json
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

print("✅ Imports done")

# ── CELL 2: Load & prepare ─────────────────────────────────────────────────────
df = pd.read_csv('ocd_patient_dataset.csv')

# Compute totals
df['obs_total']   = df['Y-BOCS Score (Obsessions)']
df['comp_total']  = df['Y-BOCS Score (Compulsions)']
df['total_score'] = df['obs_total'] + df['comp_total']

# ── Severity label (from your notebook's function) ──
def get_severity(score):
    if score <= 7:  return 'Subclinical'
    elif score <= 15: return 'Mild'
    elif score <= 23: return 'Moderate'
    elif score <= 31: return 'Severe'
    else:             return 'Extreme'

df['severity_label'] = df['total_score'].apply(get_severity)

# ── OCD detection label: score > 7 = OCD present ──
# (Subclinical = no clinical OCD, everything else = OCD present)
df['ocd_present'] = (df['total_score'] > 7).astype(int)

print("Class distribution - OCD Present:")
print(df['ocd_present'].value_counts())
print("\nSeverity distribution:")
print(df['severity_label'].value_counts())

# ── CELL 3: Feature engineering ───────────────────────────────────────────────
# Since the dataset has total scores (not individual Q answers),
# we simulate the 10 individual answers by distributing the subscale scores.
# In production, the app sends the actual 10 answers.

# For training: use obs_total, comp_total, total_score as features
# (The app will send these computed from the 10 answers)

FEATURES = ['obs_total', 'comp_total', 'total_score']
X = df[FEATURES].values

# ── CELL 4: Train OCD Detection Model ─────────────────────────────────────────
y_detect = df['ocd_present'].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y_detect, test_size=0.2, random_state=42, stratify=y_detect
)

scaler_detect = StandardScaler()
X_train_s = scaler_detect.fit_transform(X_train)
X_test_s  = scaler_detect.transform(X_test)

detect_model = RandomForestClassifier(
    n_estimators=100, max_depth=8, random_state=42, class_weight='balanced'
)
detect_model.fit(X_train_s, y_train)

y_pred = detect_model.predict(X_test_s)
print("\n── OCD DETECTION MODEL ──")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.3f}")
print(classification_report(y_test, y_pred, target_names=['No OCD', 'OCD Present']))

# Cross-validation
cv_scores = cross_val_score(detect_model, scaler_detect.transform(X), y_detect, cv=5)
print(f"5-fold CV accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# ── CELL 5: Train Severity Classification Model ────────────────────────────────
le = LabelEncoder()
y_severity = le.fit_transform(df['severity_label'].values)
severity_classes = le.classes_.tolist()
print(f"\nSeverity classes: {severity_classes}")

X_train2, X_test2, y_train2, y_test2 = train_test_split(
    X, y_severity, test_size=0.2, random_state=42, stratify=y_severity
)

scaler_sev = StandardScaler()
X_train2_s = scaler_sev.fit_transform(X_train2)
X_test2_s  = scaler_sev.transform(X_test2)

severity_model = RandomForestClassifier(
    n_estimators=200, max_depth=10, random_state=42, class_weight='balanced'
)
severity_model.fit(X_train2_s, y_train2)

y_pred2 = severity_model.predict(X_test2_s)
print("\n── SEVERITY CLASSIFICATION MODEL ──")
print(f"Accuracy: {accuracy_score(y_test2, y_pred2):.3f}")
print(classification_report(y_test2, y_pred2, target_names=severity_classes))

# ── CELL 6: Confusion matrix plots ────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

cm1 = confusion_matrix(y_test, y_pred)
sns.heatmap(cm1, annot=True, fmt='d', ax=axes[0],
            xticklabels=['No OCD','OCD'], yticklabels=['No OCD','OCD'],
            cmap='Blues')
axes[0].set_title('OCD Detection — Confusion Matrix')

cm2 = confusion_matrix(y_test2, y_pred2)
sns.heatmap(cm2, annot=True, fmt='d', ax=axes[1],
            xticklabels=severity_classes, yticklabels=severity_classes,
            cmap='Oranges')
axes[1].set_title('Severity Classification — Confusion Matrix')
plt.tight_layout()
plt.savefig('confusion_matrices.png', dpi=150)
plt.show()
print("✅ Saved confusion_matrices.png")

# ── CELL 7: Save models ────────────────────────────────────────────────────────
joblib.dump(detect_model,   'ocd_detection_model.pkl')
joblib.dump(scaler_detect,  'ocd_detection_scaler.pkl')
joblib.dump(severity_model, 'ocd_severity_model.pkl')
joblib.dump(scaler_sev,     'ocd_severity_scaler.pkl')

# Save class labels for the API
with open('severity_classes.json', 'w') as f:
    json.dump(severity_classes, f)

print("✅ Models saved:")
print("   ocd_detection_model.pkl")
print("   ocd_detection_scaler.pkl")
print("   ocd_severity_model.pkl")
print("   ocd_severity_scaler.pkl")
print("   severity_classes.json")

# ── CELL 8: Quick test ─────────────────────────────────────────────────────────
# Simulate a user who answered all 10 questions
# obs answers: [3,3,3,2,2] = 13, comp answers: [3,3,2,2,2] = 12, total = 25

test_obs   = [3, 3, 3, 2, 2]
test_comp  = [3, 3, 2, 2, 2]
obs_total  = sum(test_obs)
comp_total = sum(test_comp)
total      = obs_total + comp_total

features = np.array([[obs_total, comp_total, total]])

# Detection
feat_s = scaler_detect.transform(features)
ocd_prob = detect_model.predict_proba(feat_s)[0][1]
ocd_pred = detect_model.predict(feat_s)[0]
print(f"\n── TEST PREDICTION ──")
print(f"Obs total: {obs_total}, Comp total: {comp_total}, Total: {total}")
print(f"OCD Present: {'Yes' if ocd_pred else 'No'} (confidence: {ocd_prob:.1%})")

# Severity
feat_s2 = scaler_sev.transform(features)
sev_pred = severity_model.predict(feat_s2)[0]
sev_proba = severity_model.predict_proba(feat_s2)[0]
print(f"Severity: {severity_classes[sev_pred]}")
print(f"Probabilities: { {severity_classes[i]: f'{p:.1%}' for i,p in enumerate(sev_proba)} }")
