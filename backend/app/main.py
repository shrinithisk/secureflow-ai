import os
import shutil
import zipfile
import uuid
import json
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import git

from app.database import init_db, get_db_connection
from app.auth import get_password_hash, verify_password, create_access_token, verify_token
from app.scanners.aggregator import get_scanners_status
from app.orchestrator import run_security_pipeline, get_llm, get_chatbot_llm

app = FastAPI(title="SecureFlow AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base Paths
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLONES_DIR = os.path.join(BACKEND_DIR, "temp_clones")
UPLOADS_DIR = os.path.join(BACKEND_DIR, "temp_uploads")

os.makedirs(CLONES_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Run DB migration on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Pydantic Schemas
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ScanRequest(BaseModel):
    repo_url: str

class ChatRequest(BaseModel):
    question: str
    findings_context: List[dict]

# ================= AUTHENTICATION ROUTES =================

@app.post("/api/auth/register")
def register(user: UserRegister):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (user.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already registered")
        
    password_hash = get_password_hash(user.password)
    cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (user.username, password_hash))
    conn.commit()
    conn.close()
    return {"message": "User registered successfully"}

@app.post("/api/auth/login")
def login(user: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, password_hash FROM users WHERE username = ?", (user.username,))
    db_user = cursor.fetchone()
    conn.close()
    
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    token = create_access_token(data={"sub": user.username, "user_id": db_user["id"]})
    return {"access_token": token, "token_type": "bearer", "username": user.username}

@app.get("/api/auth/me")
def me(current_user: dict = Depends(verify_token)):
    return current_user

# ================= SCANNER STATUS ROUTE =================

@app.get("/api/scanners/status")
def scanners_status():
    return get_scanners_status()

# ================= CODE SCANNING ROUTES =================

@app.post("/api/scan/url")
async def scan_url(req: ScanRequest, current_user: dict = Depends(verify_token)):
    repo_url = req.repo_url.strip()
    if not repo_url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid repository URL. Must be http/https link.")
        
    # Generate unique folder name
    session_id = str(uuid.uuid4())
    clone_path = os.path.join(CLONES_DIR, session_id)
    repo_name = repo_url.split("/")[-1].replace(".git", "")
    
    try:
        print(f"Cloning repo: {repo_url} into {clone_path}")
        # Perform shallow clone to save time/bandwidth
        git.Repo.clone_from(repo_url, clone_path, depth=1)
        
        # Execute LangGraph Pipeline
        result = await run_security_pipeline(clone_path)
        
        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO scans (user_id, repo_url, repo_name, status, score, pipeline_score, report_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            current_user["user_id"],
            repo_url,
            repo_name,
            "Completed",
            result["health_scores"]["repo_score"],
            result["health_scores"]["pipeline_score"],
            json.dumps(result)
        ))
        conn.commit()
        conn.close()
        
        return result
    except Exception as e:
        print(f"URL Scan error: {e}")
        raise HTTPException(status_code=500, detail=f"Scanning failed: {str(e)}")
    finally:
        # Clean up cloned files
        if os.path.exists(clone_path):
            shutil.rmtree(clone_path)

@app.post("/api/scan/zip")
async def scan_zip(file: UploadFile = File(...), current_user: dict = Depends(verify_token)):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP format repositories are supported.")
        
    session_id = str(uuid.uuid4())
    zip_path = os.path.join(UPLOADS_DIR, f"{session_id}.zip")
    extract_path = os.path.join(CLONES_DIR, session_id)
    repo_name = file.filename.replace(".zip", "")
    
    try:
        # Save upload to disk
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract files
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
            
        # Check if zip contains a root folder containing the actual files and adjust path
        root_contents = os.listdir(extract_path)
        scan_target = extract_path
        if len(root_contents) == 1 and os.path.isdir(os.path.join(extract_path, root_contents[0])):
            scan_target = os.path.join(extract_path, root_contents[0])
            
        # Execute LangGraph pipeline
        result = await run_security_pipeline(scan_target)
        
        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO scans (user_id, repo_url, repo_name, status, score, pipeline_score, report_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            current_user["user_id"],
            "ZIP Upload: " + file.filename,
            repo_name,
            "Completed",
            result["health_scores"]["repo_score"],
            result["health_scores"]["pipeline_score"],
            json.dumps(result)
        ))
        conn.commit()
        conn.close()
        
        return result
    except Exception as e:
        print(f"ZIP Scan error: {e}")
        raise HTTPException(status_code=500, detail=f"Scanning failed: {str(e)}")
    finally:
        # Clean up zip and extracted folders
        if os.path.exists(zip_path):
            os.remove(zip_path)
        if os.path.exists(extract_path):
            shutil.rmtree(extract_path)

@app.get("/api/scans/history")
def get_history(current_user: dict = Depends(verify_token)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, repo_url, repo_name, status, score, pipeline_score, created_at 
        FROM scans 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    """, (current_user["user_id"],))
    scans = cursor.fetchall()
    conn.close()
    
    return [dict(scan) for scan in scans]

@app.get("/api/scans/{scan_id}")
def get_scan(scan_id: int, current_user: dict = Depends(verify_token)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT report_json FROM scans WHERE id = ? AND user_id = ?
    """, (scan_id, current_user["user_id"]))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Scan report not found")
        
    return json.loads(row["report_json"])

@app.delete("/api/scans/{scan_id}")
def delete_scan(scan_id: int, current_user: dict = Depends(verify_token)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM scans WHERE id = ? AND user_id = ?
    """, (scan_id, current_user["user_id"]))
    conn.commit()
    conn.close()
    return {"message": "Scan report deleted successfully"}

# ================= INTERACTIVE CHAT ROUTE =================

@app.post("/api/chat")
async def chat(req: ChatRequest, current_user: dict = Depends(verify_token)):
    import asyncio
    llm = get_chatbot_llm()
    if not llm:
        return {"response": "Mock Assistant Response: To ask questions, please set the GEMINI_API_KEY environment variable. Typical advice: avoid wildcard permissions and use npm ci."}
        
    prompt = f"""
    You are SecureFlow AI, an intelligent DevSecOps security assistant.
    The developer is asking a question about their code scan or CI/CD workflow security.
    
    Here is the context of current vulnerability findings:
    {json.dumps(req.findings_context, indent=2)}
    
    Developer Question: "{req.question}"
    
    Provide a clear, educational, and developer-friendly answer explaining security concepts, risks, and how to remediate them. Keep code snippets clean and concise.
    """
    
    try:
        response = await asyncio.wait_for(llm.ainvoke(prompt), timeout=12.0)
        return {"response": response.content}
    except Exception as e:
        print(f"Chatbot query failed: {e}")
        return {"response": "Sorry, I am experiencing temporary rate limits or latency issues. However, looking at your query: we recommend rotating any leaked credentials, replacing wildcard token permissions with read-only scopes, and cleaning up Docker base images."}

if __name__ == "__main__":
    import uvicorn
    # Make sure DB is initialized
    init_db()
    # Start FastAPI
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
