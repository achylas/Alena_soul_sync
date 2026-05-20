"""
SoulSync OCD Model API
Hugging Face Spaces — Docker SDK

Endpoints:
  GET  /          → health check
  POST /predict   → OCD detection + severity classification
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import numpy as np
import joblib
import json

app = FastAPI(
    title="SoulSync OCD Classifier",
    description="ML-powered OCD detection and severity classification using Y-BOCS scores",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ── Load models — wrapped so startup never crashes ─────────────────────────────
BASE = Path(__file__).parent

detect_model    = None
detect_scaler   = None
severity_model  = None
severity_scaler = None
severity_classes = ["Subclinical", "Mild", "Moderate", "Severe", "Extreme"]
MODELS_LOADED   = False

try:
    detect_model    = joblib.load(BASE / "ocd_detection_model.pkl")
    detect_scaler   = joblib.load(BASE / "ocd_detection_scaler.pkl")
    severity_model  = joblib.load(BASE / "ocd_severity_model.pkl")
    severity_scaler = joblib.load(BASE / "ocd_severity_scaler.pkl")

    classes_path = BASE / "severity_classes.json"
    if classes_path.exists():
        with open(classes_path) as f:
            severity_classes = json.load(f)

    MODELS_LOADED = True
    print("✅ All models loaded successfully")

except Exception as e:
    MODELS_LOADED = False
    print(f"⚠️  Model loading failed — using rule-based fallback: {e}")


# ── Schemas ────────────────────────────────────────────────────────────────────
class OCDRequest(BaseModel):
    answers: list[int]   # exactly 10 values, each 0–4


# ── Rule-based fallback ────────────────────────────────────────────────────────
def rule_based_predict(answers: list) -> dict:
    obs_total   = sum(answers[:5])
    comp_total  = sum(answers[5:])
    total_score = obs_total + comp_total
    ocd_detected = total_score > 7

    if   total_score <= 7:  severity = "Subclinical"
    elif total_score <= 15: severity = "Mild"
    elif total_score <= 23: severity = "Moderate"
    elif total_score <= 31: severity = "Severe"
    else:                   severity = "Extreme"

    classes = ["Subclinical", "Mild", "Moderate", "Severe", "Extreme"]
    idx = classes.index(severity)
    probs = {c: round(75.0 if abs(i-idx)==0 else 15.0 if abs(i-idx)==1 else 7.0 if abs(i-idx)==2 else 3.0, 1)
             for i, c in enumerate(classes)}

    return {
        "ocd_detected":           ocd_detected,
        "ocd_confidence":         82.0 if ocd_detected else 78.0,
        "severity":               severity,
        "severity_probabilities": probs,
        "obs_total":              obs_total,
        "comp_total":             comp_total,
        "total_score":            total_score,
        "model_version":          "1.0",
        "source":                 "rule_based"
    }


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status":        "ok",
        "model":         "SoulSync OCD Classifier v1.0",
        "models_loaded": MODELS_LOADED,
        "sklearn_version": __import__("sklearn").__version__,
        "endpoints":     ["/predict"]
    }


# ── Predict ────────────────────────────────────────────────────────────────────
@app.post("/predict")
def predict(req: OCDRequest):
    if len(req.answers) != 10:
        return {"error": "Exactly 10 answers required (0–4 each)"}

    # Clamp values to valid range
    answers = [max(0, min(4, int(a))) for a in req.answers]

    if not MODELS_LOADED:
        return rule_based_predict(answers)

    obs_total   = sum(answers[:5])
    comp_total  = sum(answers[5:])
    total_score = obs_total + comp_total

    features = np.array([[obs_total, comp_total, total_score]])

    # OCD Detection
    feat_d    = detect_scaler.transform(features)
    ocd_pred  = int(detect_model.predict(feat_d)[0])
    ocd_proba = detect_model.predict_proba(feat_d)[0]
    ocd_conf  = round(float(ocd_proba[ocd_pred]) * 100, 1)

    # Severity Classification
    feat_s    = severity_scaler.transform(features)
    sev_idx   = int(severity_model.predict(feat_s)[0])
    sev_proba = severity_model.predict_proba(feat_s)[0]
    severity  = severity_classes[sev_idx]

    sev_probs = {
        severity_classes[i]: round(float(p) * 100, 1)
        for i, p in enumerate(sev_proba)
    }

    return {
        "ocd_detected":           bool(ocd_pred),
        "ocd_confidence":         ocd_conf,
        "severity":               severity,
        "severity_probabilities": sev_probs,
        "obs_total":              obs_total,
        "comp_total":             comp_total,
        "total_score":            total_score,
        "model_version":          "1.0",
        "source":                 "ml_model"
    }
