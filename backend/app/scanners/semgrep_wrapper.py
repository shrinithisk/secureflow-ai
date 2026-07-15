import os
import subprocess
import json
import shutil

def is_semgrep_available():
    return shutil.which("semgrep") is not None

def run_semgrep(repo_path):
    findings = []
    
    if not is_semgrep_available():
        print("Semgrep binary not found on local path. Skipping SAST scan.")
        return findings
        
    try:
        # Run semgrep scan with JSON output and exclude large directories to save memory
        result = subprocess.run(
            [
                "semgrep", "scan", "--json", "--quiet", "--config=auto",
                "--exclude=node_modules",
                "--exclude=.git",
                "--exclude=venv",
                "--exclude=env",
                "--exclude=dist",
                "--exclude=build"
            ],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=False
        )
        
        output = result.stdout.strip()
        if not output:
            return findings
            
        data = json.loads(output)
        results = data.get("results", [])
        
        for issue in results:
            extra = issue.get("extra", {})
            metadata = extra.get("metadata", {})
            cve_list = metadata.get("cve", [])
            cve = cve_list[0] if isinstance(cve_list, list) and cve_list else "N/A"
            if not isinstance(cve, str):
                cve = "N/A"
                
            semgrep_severity = extra.get("severity", "WARNING").upper()
            severity_map = {
                "INFO": "Low",
                "WARNING": "Medium",
                "ERROR": "High"
            }
            severity = severity_map.get(semgrep_severity, "Medium")
            
            check_id = issue.get("check_id", "semgrep-rule")
            parts = check_id.split(".")
            title_suffix = parts[-1].replace("-", " ").replace("_", " ").title()
            finding_type = f"SAST: {title_suffix}"

            findings.append({
                "id": check_id,
                "cve": cve,
                "tool": "semgrep",
                "type": finding_type,
                "severity": severity,
                "file": issue.get("path", ""),
                "line": issue.get("start", {}).get("line", 1),
                "description": extra.get("message", "Static analysis security finding"),
                "fix_suggestion": extra.get("fix", "Review security policy for this programming language")
            })
    except Exception as e:
        print(f"Error running Semgrep: {e}")
        
    return findings
