# Deploying the OCD Model to Hugging Face Spaces

## What you'll have after this
A free public API at `https://your-username-soulsync-ocd.hf.space/predict`
that your React app calls to get ML-powered OCD detection + severity classification.

---

## Step 1 — Train the model in Google Colab

1. Go to [colab.research.google.com](https://colab.research.google.com)
2. Upload `Alena_OCD.ipynb` (File → Upload notebook)
3. Upload `ocd_patient_dataset.csv` (Files panel → Upload)
4. Run all cells in `Alena_OCD.ipynb` first (your existing notebook)
5. Then create a new cell and paste the contents of `model_training.py`
6. Run it — it will produce these files:
   - `ocd_detection_model.pkl`
   - `ocd_detection_scaler.pkl`
   - `ocd_severity_model.pkl`
   - `ocd_severity_scaler.pkl`
   - `severity_classes.json`
   - `confusion_matrices.png`
7. Download all 5 `.pkl` and `.json` files to your computer

---

## Step 2 — Create a Hugging Face account

1. Go to [huggingface.co](https://huggingface.co) → Sign Up (free)
2. Verify your email

---

## Step 3 — Create a new Space

1. Click your profile → **New Space**
2. Fill in:
   - **Space name**: `soulsync-ocd`
   - **License**: MIT
   - **SDK**: **Docker** ← important, not Gradio
   - **Visibility**: Public
3. Click **Create Space**

---

## Step 4 — Upload files to the Space

In your new Space, click **Files** tab → **Add file** → Upload:

Upload ALL of these files:
```
hf_app.py              ← the FastAPI app
requirements.txt       ← dependencies
ocd_detection_model.pkl
ocd_detection_scaler.pkl
ocd_severity_model.pkl
ocd_severity_scaler.pkl
severity_classes.json
```

Then create one more file called `Dockerfile` with this content:

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 7860
CMD ["uvicorn", "hf_app:app", "--host", "0.0.0.0", "--port", "7860"]
```

---

## Step 5 — Wait for build (~3-5 minutes)

Hugging Face will automatically build and deploy your Space.
You'll see a green **Running** badge when it's ready.

---

## Step 6 — Test your API

Your API URL will be:
```
https://YOUR-USERNAME-soulsync-ocd.hf.space
```

Test it in your browser:
```
https://YOUR-USERNAME-soulsync-ocd.hf.space/
```
Should return: `{"status":"ok","model":"SoulSync OCD Classifier v1.0"}`

Test a prediction with curl:
```bash
curl -X POST "https://YOUR-USERNAME-soulsync-ocd.hf.space/predict" \
  -H "Content-Type: application/json" \
  -d '{"answers": [3,3,2,2,1,3,2,2,1,1]}'
```

Expected response:
```json
{
  "ocd_detected": true,
  "ocd_confidence": 91.2,
  "severity": "Moderate",
  "severity_probabilities": {
    "Subclinical": 2.1,
    "Mild": 8.4,
    "Moderate": 71.3,
    "Severe": 15.8,
    "Extreme": 2.4
  },
  "obs_total": 11,
  "comp_total": 9,
  "total_score": 20,
  "model_version": "1.0"
}
```

---

## Step 7 — Connect to your React app

Open `.env` in your project and set:
```
VITE_HF_OCD_API=https://YOUR-USERNAME-soulsync-ocd.hf.space
```

Restart your dev server:
```bash
npm run dev
```

Now when a user completes the OCD assessment, the app will:
1. Send the 10 answers to your HF model
2. Get back OCD detection (Yes/No + confidence %)
3. Get back severity classification with probability distribution
4. Display it all on the results page

---

## What happens if the API is down?

The app automatically falls back to rule-based Y-BOCS scoring.
The results page shows "Rule-based" badge instead of "ML Model".
No errors shown to the user.

---

## Expected model accuracy (from training)

| Model | Expected Accuracy |
|---|---|
| OCD Detection (binary) | ~85-92% |
| Severity Classification (5-class) | ~78-86% |

These numbers will appear in your Colab output after training.
Screenshot them for your FYP report.
