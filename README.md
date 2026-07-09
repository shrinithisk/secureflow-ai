<div align="center">

# 🛡️ SecureFlow AI

### Agentic AI-Powered DevSecOps Security Engineer

SecureFlow AI is an intelligent DevSecOps platform that automatically audits GitHub repositories, detects security vulnerabilities, analyzes CI/CD workflows, generates secure GitHub Actions pipelines, and provides AI-powered remediation recommendations.

---

### 🌐 Live Demo

**https://secureflow-ai-pksf.vercel.app/**

</div>

---

# 📖 Overview

Modern software projects heavily rely on open-source libraries, Docker containers, and GitHub Actions workflows. While existing security tools can detect vulnerabilities, developers are often required to manually interpret reports, understand security risks, and implement fixes.

**SecureFlow AI** simplifies this process by combining multiple open-source security scanners with a **LangGraph-based Multi-Agent AI System** that automatically:

- Detects vulnerabilities
- Calculates repository health
- Explains security risks
- Generates secure GitHub Actions workflows
- Suggests dependency upgrades
- Produces code remediations
- Provides an AI Security Assistant

---

# ✨ Features

- 🔐 Secret Detection using Gitleaks
- 🐳 Docker Security Analysis
- ⚙️ GitHub Actions Workflow Analysis
- 📦 Dependency Vulnerability Detection
- 💻 Static Code Security Analysis
- 🤖 AI Risk Assessment
- 📊 Repository Health Score
- 🛠️ AI Generated Secure GitHub Actions YAML
- 🔄 AI Generated Code Remediation
- 💬 Interactive AI Security Assistant
- 📁 Repository URL & ZIP Upload Support
- 📜 Complete Scan History

---

# 🚀 Live Demo

https://secureflow-ai-pksf.vercel.app/

---

# 🏗️ System Architecture

<p align="center">
<img src="images/workflow.png" width="900">
</p>

> Replace the above image path with your uploaded workflow image.

---

# 🤖 Multi-Agent Architecture

<p align="center">
<img src="images/agents.png" width="1000">
</p>

SecureFlow AI uses a **LangGraph Multi-Agent Architecture** where every AI agent has a dedicated responsibility.

| Agent | Responsibility |
|---------|---------------|
| Lead Orchestrator Agent | Coordinates the complete security pipeline |
| Repository Parser Agent | Detects languages, frameworks and project structure |
| Risk Assessment Agent | Calculates Repository Health Score and summarizes threats |
| Workflow Engineering Agent | Generates secure GitHub Actions workflows |
| Remediation Agent | Produces secure code patches and recommendations |

---

# ⚙️ Complete Workflow

<p align="center">
<img src="images/workflow.png" width="850">
</p>

The complete workflow consists of the following stages:

1. User submits a GitHub Repository URL or uploads a ZIP project.
2. FastAPI receives and validates the request.
3. Repository Parser clones/extracts the project.
4. Five security scanners execute concurrently.
5. Results are aggregated and normalized.
6. LangGraph orchestrates AI reasoning.
7. AI evaluates repository health.
8. AI generates secure GitHub Actions YAML.
9. AI generates code remediations.
10. Reports are stored inside SQLite.
11. Results are displayed on the React Dashboard.

---

# 📂 Project Structure

<p align="center">
<img src="images/project-structure.png" width="900">
</p>

```
secureflow-ai/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── orchestrator.py
│   │   └── scanners/
│   │        ├── aggregator.py
│   │        ├── gitleaks_wrapper.py
│   │        ├── hadolint_wrapper.py
│   │        ├── actionlint_wrapper.py
│   │        ├── semgrep_wrapper.py
│   │        └── osv_wrapper.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │    ├── components/
│   │    ├── App.jsx
│   │    └── config.js
│   └── vercel.json
│
└── README.md
```

---

# 💻 Technology Stack

| Category | Technology |
|------------|------------|
| Frontend | React.js |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| Programming Language | Python 3 |
| AI Framework | LangGraph |
| LLM | Google Gemini Flash |
| Database | SQLite |
| Authentication | JWT |
| Secret Detection | Gitleaks |
| Static Code Analysis | Semgrep |
| Docker Security | Hadolint |
| GitHub Actions Analysis | Actionlint |
| Dependency Analysis | Google OSV API |
| Containerization | Docker |
| Deployment | Render + Vercel |
| Version Control | Git & GitHub |

---

# 🔍 Security Analysis Pipeline

SecureFlow AI performs a complete security audit using five specialized security scanners.

## 1️⃣ Gitleaks

Detects:

- API Keys
- Passwords
- Tokens
- Secrets
- Private Keys

---

## 2️⃣ Semgrep

Performs Static Application Security Testing (SAST) to detect:

- SQL Injection
- Command Injection
- XSS
- Hardcoded Credentials
- Insecure Coding Patterns

---

## 3️⃣ Hadolint

Analyzes Dockerfiles for:

- Root User
- Latest Image Tags
- Docker Best Practices
- Layer Optimization

---

## 4️⃣ Actionlint

Audits GitHub Actions workflows for:

- Syntax Errors
- Workflow Misconfigurations
- Insecure Permissions
- CI/CD Best Practices

---

## 5️⃣ Google OSV API

Checks dependency manifests including:

- package.json
- requirements.txt
- pom.xml

to detect known CVEs.

---

# 🤖 AI Agents

## Lead Orchestrator Agent

- Coordinates every stage of the pipeline
- Maintains shared LangGraph state
- Combines outputs from all agents

---

## Repository Parser Agent

- Clones repositories
- Extracts ZIP files
- Detects project languages
- Identifies Dockerfiles and GitHub workflows

---

## Risk Assessment Agent

- Calculates Repository Health Score
- Prioritizes vulnerabilities
- Generates AI Threat Summary

---

## Workflow Engineering Agent

Automatically generates:

- Secure GitHub Actions Workflow
- Least Privilege Permissions
- Version Pinning
- Security Best Practices

---

## Remediation Agent

Produces:

- AI Code Fixes
- Secure Code Examples
- Dependency Upgrade Suggestions
- YAML Improvements

---

# 📊 Repository Health Score

The Repository Health Score ranges from **0 to 100**.

Every repository starts with a score of **100**.

Security findings deduct points based on severity.

| Severity | Penalty |
|-----------|----------|
| Critical | -25 |
| High | -15 |
| Medium | -5 |
| Low | -1 |

Formula:

```
Repository Health Score

= max(0,

100 − Σ(Severity Weight × Number of Findings))
```

This provides developers with a simple numerical representation of the overall security posture of the repository.

---

# 💾 Backend Architecture

The backend is built using **FastAPI**, **LangGraph**, and **SQLite**.

### Backend Responsibilities

- Repository cloning
- Concurrent scanner execution
- AI orchestration
- Repository scoring
- Workflow generation
- Code remediation
- Authentication
- Scan history

---

# 🖥️ Frontend

Built using React and Tailwind CSS.

Main pages include:

- Dashboard
- AI Chat
- GitHub Actions Generator
- AI Assistant

---

# 📷 Application Screenshots

## Dashboard

```
Add Dashboard Screenshot Here
```

---

## Scan Results

```
Add Scan Results Screenshot Here
```

---

## AI Assistant

```
Add AI Chat Screenshot Here
```

---

## GitHub Actions Generator

```
Add YAML Generator Screenshot Here
```

---

# 🛠️ Installation

Clone the repository

```bash
git clone https://github.com/yourusername/secureflow-ai.git
```

Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🌟 Future Enhancements

- GitHub OAuth Integration
- Automatic Pull Request Creation
- GitHub App Support
- CVSS-Based Scoring
- Multi-Repository Dashboard
- Kubernetes Security Analysis
- Terraform Security Analysis
- Cloud Security Modules
- Multi-LLM Support

---


---
## Author

**K L Aadithya**
B.Tech Computing and DataScience, Sai University, Chennai

[![GitHub](https://img.shields.io/badge/GitHub-Aadithya--kl-181717?style=flat-square&logo=github)](https://github.com/Aadithya-kl)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-k--l--aadithya-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/k-l-aadithya-62b018295)

---
**Shrinithi**
B.Tech Computing and DataScience, Sai University, Chennai

[![GitHub](https://img.shields.io/badge/GitHub-shrinithisk-181717?style=flat-square&logo=github)](https://github.com/shrinithisk)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Shrinithi-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/shrinithi-saravanakumar-04112128a/)

---
**Sankeerthana**
B.Tech Computing and DataScience, Sai University, Chennai

[![GitHub](https://img.shields.io/badge/GitHub-KoletiSankeerthana-181717?style=flat-square&logo=github)](https://github.com/KoletiSankeerthana)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sankeerthana-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/koleti-sankeerthana-a093612a4/)


---
## License

Distributed under the MIT License. See `LICENSE` for more information.
