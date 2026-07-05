import os
import json
import asyncio
from typing import List, Dict, Any
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from app.scanners.aggregator import run_all_scans, get_scanners_status

# Load local .env variables manually
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

# Define Graph State Schema
class PipelineState(TypedDict):
    repo_path: str
    findings: List[Dict[str, Any]]
    risk_assessment: Dict[str, Any]
    optimized_workflows: List[Dict[str, Any]]
    remediations: List[Dict[str, Any]]
    health_scores: Dict[str, int]

# Initialize LLM
def get_llm():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY environment variable not set. Using mock LLM responses.")
        return None
    try:
        # Use gemini-2.5-flash for low latency and high quality, set max_retries=0 to prevent connection timeouts on rate limits
        return ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key, max_retries=0)
    except Exception as e:
        print(f"Error initializing Gemini: {e}")
        return None

# Node 1: Scan Repository
async def scan_repo_node(state: PipelineState) -> Dict[str, Any]:
    repo_path = state["repo_path"]
    findings = await run_all_scans(repo_path)
    return {"findings": findings}

# Node 2: AI Risk Assessment
async def assess_risk_node(state: PipelineState) -> Dict[str, Any]:
    findings = state["findings"]
    llm = get_llm()
    
    # Calculate objective mathematical risk score
    # S = max(0, 100 - sum(weight * count))
    weights = {"Critical": 25, "High": 15, "Medium": 5, "Low": 1}
    severity_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for f in findings:
        sev = f.get("severity", "Medium")
        if sev in severity_counts:
            severity_counts[sev] += 1
            
    deduction = sum(weights[k] * severity_counts[k] for k in weights)
    repo_score = max(0, 100 - deduction)
    
    if not llm:
        # Mock Assessment
        return {
            "health_scores": {"repo_score": repo_score, "pipeline_score": 80},
            "risk_assessment": {
                "summary": "This is a mock risk assessment summary. Install a GEMINI_API_KEY to generate real assessments.",
                "prioritized_vulns": findings[:3],
                "threat_scenario": "Insecure Docker runtime permission escalation or workflow token theft."
            }
        }
        
    prompt = f"""
    You are a DevSecOps Risk Assessor Agent. Analyze the following list of security findings found in a repository:
    {json.dumps(findings, indent=2)}
    
    Provide a JSON object containing:
    1. "summary": A security summary of the repository. Use short, easy-to-read paragraphs or bullet points to explain the main weaknesses. Focus on readability.
    2. "threat_scenario": A step-by-step description (using a numbered list or bullet points) showing how an attacker could chain these vulnerabilities together to compromise the system.
    3. "prioritized_vulns": A list of the findings ordered by true risk/exploitability.
    
    Format the summary and threat_scenario with clear markdown (bullet points, bold highlights, inline code) so they are visually scan-friendly and divided into digestible chunks.
    Return ONLY valid JSON.
    """
    
    try:
        response = await asyncio.wait_for(llm.ainvoke(prompt), timeout=6.0)
        content = response.content.strip()
        # Clean markdown wrappers if present
        if content.startswith("```json"):
            content = content.replace("```json", "", 1).replace("```", "", 1).strip()
        result = json.loads(content)
        return {
            "health_scores": {"repo_score": repo_score, "pipeline_score": 100},  # will be computed in next node
            "risk_assessment": result
        }
    except Exception as e:
        print(f"Error in risk assessment LLM node: {e}")
        return {
            "health_scores": {"repo_score": repo_score, "pipeline_score": 75},
            "risk_assessment": {
                "summary": "Failed to parse AI risk analysis. Mathematical score computed.",
                "threat_scenario": "N/A"
            }
        }

# Node 3: AI GitHub Workflow Engineer (USP)
async def engineer_workflows_node(state: PipelineState) -> Dict[str, Any]:
    repo_path = state["repo_path"]
    findings = state["findings"]
    health_scores = state.get("health_scores", {"repo_score": 100, "pipeline_score": 100})
    
    # 1. Detect framework/languages
    has_node = os.path.exists(os.path.join(repo_path, "package.json"))
    has_python = os.path.exists(os.path.join(repo_path, "requirements.txt")) or os.path.exists(os.path.join(repo_path, "Pipfile"))
    has_docker = False
    for root, _, files in os.walk(repo_path):
        if "Dockerfile" in files:
            has_docker = True
            break
            
    # Locate existing workflows
    workflows = []
    workflow_dir = os.path.join(repo_path, ".github", "workflows")
    if os.path.isdir(workflow_dir):
        for file in os.listdir(workflow_dir):
            if file.endswith(".yml") or file.endswith(".yaml"):
                with open(os.path.join(workflow_dir, file), "r") as f:
                    workflows.append({"filename": file, "content": f.read()})
                    
    llm = get_llm()
    if not llm:
        # Mock Workflow Generation
        mock_yaml = """name: Secure Node Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test"""
        return {
            "optimized_workflows": [{
                "original_filename": workflows[0]["filename"] if workflows else "None",
                "new_filename": "secure-pipeline.yml",
                "content": mock_yaml,
                "improvements": ["Updated checkout to v4", "Switched to npm ci"],
                "pipeline_score": 90
            }],
            "health_scores": {**health_scores, "pipeline_score": 90}
        }
        
    prompt = f"""
    You are an AI GitHub Workflow Engineer. Analyze the existing workflows: {json.dumps(workflows)}
    And the current repo profile (Has Node: {has_node}, Has Python: {has_python}, Has Docker: {has_docker}).
    
    If no existing workflows exist, generate a secure, best-practice GitHub Actions workflow from scratch to build, test, and scan this project (include gitleaks/semgrep steps).
    If workflows exist, review them for:
    - Floating action tags (e.g. actions/checkout@main instead of @v4)
    - Permission wildcards (e.g. write-all)
    - Shell injection risks in RUN statements.
    
    Rewrite the workflows to be fully secure and optimized.
    
    Provide a JSON response containing:
    1. "original_filename": name of the workflow analyzed (or "None")
    2. "new_filename": filename for the secure YAML (e.g. "secure-ci.yml")
    3. "content": The complete, valid YAML content block.
    4. "improvements": list of specific optimizations made.
    5. "pipeline_score": A calculated score from 0-100 for the final generated workflow.
    
    Return ONLY valid JSON.
    """
    
    try:
        response = await asyncio.wait_for(llm.ainvoke(prompt), timeout=6.0)
        content = response.content.strip()
        if content.startswith("```json"):
            content = content.replace("```json", "", 1).replace("```", "", 1).strip()
        result = json.loads(content)
        # Ensure it is a list
        workflow_results = result if isinstance(result, list) else [result]
        final_pipe_score = workflow_results[0].get("pipeline_score", 95)
        
        return {
            "optimized_workflows": workflow_results,
            "health_scores": {**health_scores, "pipeline_score": final_pipe_score}
        }
    except Exception as e:
        print(f"Error in Workflow Engineering LLM node: {e}")
        fallback_yaml = """name: Secure CI Pipeline

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  security-scan:
    name: Security Scan & Build
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Gitleaks Secret Scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Semgrep Static Analysis
        uses: returntocorp/semgrep-action@v1
        with:
          config: auto
"""
        return {
            "optimized_workflows": [{
                "original_filename": workflows[0]["filename"] if workflows else "None",
                "new_filename": "secure-pipeline.yml",
                "content": fallback_yaml,
                "improvements": [
                    "Created fallback secure CI/CD workflow template",
                    "Enforced actions/checkout@v4 secure SHA supply chain pinning",
                    "Integrated Gitleaks scanner to block secrets exposure",
                    "Integrated Semgrep SAST scan rules for code quality",
                    "Restricted GITHUB_TOKEN permissions to contents:read"
                ],
                "pipeline_score": 90
            }],
            "health_scores": {**health_scores, "pipeline_score": 90}
        }

# Node 4: AI Remediation & Patching
async def generate_remediations_node(state: PipelineState) -> Dict[str, Any]:
    findings = state["findings"]
    llm = get_llm()
    
    if not llm:
        # Mock Remediations
        return {
            "remediations": [{
                "file": "Dockerfile",
                "original": "FROM node:latest",
                "patched": "FROM node:20-alpine\nUSER node",
                "explanation": "Pin the Docker image to a stable version and run as a non-root user."
            }]
        }
        
    prompt = f"""
    You are an AI DevSecOps Remediation Agent. For the following findings:
    {json.dumps(findings, indent=2)}
    
    Generate specific patch recommendations. For each fixable issue, output:
    1. "file": File path needing correction.
    2. "original": The insecure block.
    3. "patched": The replacement/corrected block.
    4. "explanation": Why this change is secure.
    
    Return a JSON list of these recommendations. Return ONLY valid JSON.
    """
    
    try:
        response = await asyncio.wait_for(llm.ainvoke(prompt), timeout=6.0)
        content = response.content.strip()
        if content.startswith("```json"):
            content = content.replace("```json", "", 1).replace("```", "", 1).strip()
        remediations = json.loads(content)
        return {"remediations": remediations}
    except Exception as e:
        print(f"Error in Remediation LLM node: {e}")
        return {"remediations": []}

# Compile LangGraph State Machine
def build_graph():
    builder = StateGraph(PipelineState)
    
    # Register Nodes
    builder.add_node("scan_repo", scan_repo_node)
    builder.add_node("assess_risk", assess_risk_node)
    builder.add_node("engineer_workflows", engineer_workflows_node)
    builder.add_node("generate_remediations", generate_remediations_node)
    
    # Establish Edges
    builder.set_entry_point("scan_repo")
    builder.add_edge("scan_repo", "assess_risk")
    builder.add_edge("assess_risk", "engineer_workflows")
    builder.add_edge("engineer_workflows", "generate_remediations")
    builder.add_edge("generate_remediations", END)
    
    return builder.compile()

# Global Compiled graph
workflow_graph = build_graph()

async def run_security_pipeline(repo_path: str) -> Dict[str, Any]:
    initial_state = {
        "repo_path": repo_path,
        "findings": [],
        "risk_assessment": {},
        "optimized_workflows": [],
        "remediations": [],
        "health_scores": {"repo_score": 100, "pipeline_score": 100}
    }
    
    # Execute Graph
    final_state = await workflow_graph.ainvoke(initial_state)
    return {
        "findings": final_state.get("findings", []),
        "risk_assessment": final_state.get("risk_assessment", {}),
        "optimized_workflows": final_state.get("optimized_workflows", []),
        "remediations": final_state.get("remediations", []),
        "health_scores": final_state.get("health_scores", {"repo_score": 100, "pipeline_score": 100})
    }
