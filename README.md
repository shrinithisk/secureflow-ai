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
   # Copy backend/.env.example to backend/.env and add your Gemini API Key:
   # GEMINI_API_KEY=your_key_here
   python -m app.main
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
