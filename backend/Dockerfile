FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Gitleaks
RUN curl -L https://github.com/gitleaks/gitleaks/releases/download/v8.18.2/gitleaks_8.18.2_linux_x64.tar.gz -o gitleaks.tar.gz \
    && tar -xzf gitleaks.tar.gz gitleaks \
    && mv gitleaks /usr/local/bin/ \
    && rm gitleaks.tar.gz

# Install Hadolint
RUN curl -L https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64 -o /usr/local/bin/hadolint \
    && chmod +x /usr/local/bin/hadolint

# Install Actionlint
RUN curl -L https://github.com/rhysd/actionlint/releases/download/v1.6.27/actionlint_1.6.27_linux_amd64.tar.gz -o actionlint.tar.gz \
    && tar -xzf actionlint.tar.gz actionlint \
    && mv actionlint /usr/local/bin/ \
    && rm actionlint.tar.gz

# Install OSV-Scanner (Open Source Vulnerability Scanner)
RUN curl -L https://github.com/google/osv-scanner/releases/download/v1.7.0/osv-scanner_1.7.0_linux_amd64 -o /usr/local/bin/osv-scanner \
    && chmod +x /usr/local/bin/osv-scanner

# Set working directory
WORKDIR /app

# Install Python dependencies (includes Semgrep!)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application files
COPY . .

# Expose port
EXPOSE 8000

# Start FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
