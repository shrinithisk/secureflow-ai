# SecureFlow AI

Agentic AI DevSecOps Security Engineer & CI/CD Optimizer.

## Project Structure
* `backend/`: FastAPI Python server containing the local database, scanners, and LangGraph orchestrator.
* `frontend/`: Vite + React dashboard with visual score displays, YAML diff tools, and interactive chatbot.

## Running the Application
1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m app.main
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
