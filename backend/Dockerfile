# ─────────────────────────────────────────────────────────────
# SoulSync OCD Model API — Hugging Face Spaces Dockerfile
# SDK: Docker  |  Port: 7860 (required by HF Spaces)
# ─────────────────────────────────────────────────────────────

FROM python:3.10-slim

# HF Spaces runs as a non-root user — set this to avoid permission issues
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /home/user/app

# Copy and install dependencies first (layer caching)
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy all app files
COPY --chown=user . .

# HF Spaces requires port 7860
EXPOSE 7860

# Start the FastAPI server
CMD ["uvicorn", "hf_app:app", "--host", "0.0.0.0", "--port", "7860"]
