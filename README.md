# 🛡️ SecureFlow AI
### Agentic DevSecOps Security Engineer

SecureFlow AI is an AI-powered DevSecOps platform that automatically analyzes GitHub repositories for security vulnerabilities, insecure CI/CD workflows, leaked secrets, vulnerable dependencies, and Docker misconfigurations. Using a multi-agent architecture powered by LangGraph and Google Gemini, it not only identifies security issues but also generates secure GitHub Actions workflows, remediation suggestions, and AI-driven security reports.

---

## 🚀 Features

- 🔍 Scan GitHub repositories using Repository URL or ZIP upload
- 🤖 Multi-Agent AI architecture using LangGraph
- 🛡️ Detect hardcoded secrets and credentials
- 📦 Scan open-source dependencies for known vulnerabilities
- 🐳 Audit Dockerfiles for security best practices
- ⚙️ Analyze GitHub Actions workflows
- 📊 Repository Health Score (0–100)
- 📝 AI-generated security summaries
- 🔧 Secure GitHub Actions YAML generation
- 💡 AI-powered remediation recommendations
- 💬 Interactive AI Security Assistant

---

# 🏗️ System Architecture

```
                        User
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
 Repository URL                     ZIP Upload
        │                                   │
        └─────────────────┬─────────────────┘
                          │
                  Repository Parser Agent
                          │
                          ▼
              Lead Orchestrator Agent
                     (LangGraph)
                          │
     ┌──────────────┬──────────────┬──────────────┐
     │              │              │              │
     ▼              ▼              ▼              ▼
SAST Engine   Risk Assessment  Workflow AI  Remediation AI
     │
     ├── Gitleaks
     ├── Semgrep
     ├── Hadolint
     ├── Actionlint
     └── OSV Scanner
                          │
                          ▼
                   SQLite Database
                          │
                          ▼
                 React Dashboard
```

---

# 🤖 Multi-Agent Architecture

### 1. Lead Orchestrator Agent
- Coordinates the complete security pipeline.
- Maintains shared pipeline state.
- Controls execution order of all agents.

### 2. Repository Parser Agent
- Clones GitHub repositories or extracts ZIP uploads.
- Detects programming languages and frameworks.
- Identifies Dockerfiles, workflows, and dependency files.

### 3. Risk Assessment Agent
- Aggregates scanner results.
- Calculates Repository Health Score.
- Generates AI security summaries.

### 4. Workflow Engineering Agent
- Creates secure GitHub Actions workflows.
- Applies DevSecOps best practices.
- Generates production-ready YAML pipelines.

### 5. Remediation Agent
- Generates vulnerability fixes.
- Suggests secure code replacements.
- Produces AI-powered remediation recommendations.

---

# 🔍 Security Analysis Tools

| Tool | Purpose |
|------|----------|
| Gitleaks | Detects hardcoded secrets and API keys |
| Semgrep | Static Application Security Testing (SAST) |
| Hadolint | Dockerfile Security Analysis |
| Actionlint | GitHub Actions Workflow Analysis |
| OSV Scanner | Dependency Vulnerability Detection |

---

# 📊 Repository Health Score

Every repository starts with a score of **100**.

Security findings reduce the score based on their severity.

```
Repository Health Score

= max(0,100 − Total Deduction)
```

Where,

```
Total Deduction

= (Critical × 25)

+ (High × 15)

+ (Medium × 5)

+ (Low × 1)
```

| Severity | Penalty |
|----------|----------|
| Critical | -25 |
| High | -15 |
| Medium | -5 |
| Low | -1 |

---

# 💻 Technology Stack

## Frontend

- React.js
- Tailwind CSS
- Axios

## Backend

- FastAPI
- Python
- LangGraph
- LangChain
- Asyncio

## AI

- Google Gemini Flash

## Database

- SQLite

## Deployment

- Docker
- Render

---

# 📂 Project Structure

```
SecureFlow-AI
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── backend
│   ├── app
│   │
│   ├── scanners
│   │
│   ├── orchestrator.py
│   ├── database.py
│   ├── main.py
│   └── Dockerfile
│
├── README.md
└── requirements.txt
```

---

# 🖥️ Application Pages

## 🏠 Home Page

**Screenshot**

> *(Add Homepage Screenshot Here)*

Features:

- Platform Overview
- Navigation
- Feature Highlights

---

## 🔍 Repository Analysis

**Screenshot**

> *(Add Repository Scan Screenshot Here)*

Features:

- Repository URL Input
- ZIP Upload
- Scan Trigger

---

## 📊 Security Dashboard

**Screenshot**

> *(Add Results Dashboard Screenshot Here)*

Displays:

- Repository Health Score
- Severity Distribution
- Security Findings
- AI Threat Summary

---

## 💬 AI Security Assistant

**Screenshot**

> *(Add AI Chat Screenshot Here)*

Features:

- Interactive Security Chat
- Security Explanations
- Best Practice Recommendations

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/SecureFlow-AI.git
```

---

## Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🔗 API Endpoints

## Authentication

```
POST /api/register

POST /api/login
```

---

## Repository Scanning

```
POST /api/scan/url

POST /api/scan/zip
```

---

## AI Assistant

```
POST /api/chat
```

---

# 📸 Demo

## Repository Scan

> *(Add Scan Demo Screenshot)*

---

## Security Dashboard

> *(Add Dashboard Screenshot)*

---

## Generated GitHub Actions Workflow

> *(Add YAML Screenshot)*

---

## AI Remediation Suggestions

> *(Add Remediation Screenshot)*

---

## AI Chat Assistant

> *(Add Chat Screenshot)*

---

# 🚀 Future Enhancements

- GitHub OAuth Integration
- Pull Request Security Reviews
- Automatic Pull Request Generation
- Git Patch Downloads
- Team Collaboration
- Real-Time Security Monitoring
- Multi-Repository Dashboard
- Security Notifications

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
