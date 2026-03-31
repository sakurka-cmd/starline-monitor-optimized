# Stage 1: Builder - install dependencies
FROM python:3.11-slim-bookworm AS builder

WORKDIR /app

# Install uv - fast Python package installer
RUN pip install --no-cache-dir uv

# Copy requirements and install dependencies
COPY requirements.txt .
RUN uv pip install --system --no-cache-dir -r requirements.txt

# Stage 2: Runtime - minimal image
FROM python:3.11-slim-bookworm

WORKDIR /app

# Create non-root user for security
RUN groupadd -r starline && useradd -r -g starline starline

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY main.py .

# Set ownership
RUN chown -R starline:starline /app

# Switch to non-root user
USER starline

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
