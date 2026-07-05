import os
import subprocess
import json
import shutil

def is_hadolint_available():
    return shutil.which("hadolint") is not None

def run_hadolint(repo_path):
    findings = []
    
    if not is_hadolint_available():
        print("Hadolint binary not found on local path. Skipping Docker scan.")
        return findings
        
    dockerfiles = []
    # Locate all Dockerfiles in repo
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in ["node_modules", ".git", "venv", "__pycache__"]]
        for file in files:
            if file == "Dockerfile" or file.endswith(".dockerfile"):
                dockerfiles.append(os.path.join(root, file))
                
    for dockerfile in dockerfiles:
        relative_path = os.path.relpath(dockerfile, repo_path)
        try:
            # hadolint output in json format
            result = subprocess.run(
                ["hadolint", "--format", "json", dockerfile],
                capture_output=True,
                text=True,
                check=False
            )
            
            # Hadolint outputs findings via stdout, even with non-zero exit codes if warnings exist
            output = result.stdout.strip()
            if not output:
                continue
                
            issues = json.loads(output)
            for issue in issues:
                severity_map = {
                    "info": "Low",
                    "style": "Low",
                    "warning": "Medium",
                    "error": "High"
                }
                hadolint_severity = issue.get("level", "warning").lower()
                severity = severity_map.get(hadolint_severity, "Medium")
                
                findings.append({
                    "id": issue.get("code", "DL0000"),
                    "cve": "N/A",
                    "tool": "hadolint",
                    "type": f"Dockerfile Lint: {issue.get('code', 'DL0000')}",
                    "severity": severity,
                    "file": relative_path,
                    "line": issue.get("line", 1),
                    "description": issue.get("message", "Dockerfile configuration issue"),
                    "fix_suggestion": f"Check Hadolint rule reference: https://github.com/hadolint/hadolint/wiki/{issue.get('code')}"
                })
        except Exception as e:
            print(f"Error scanning Dockerfile {relative_path} with Hadolint: {e}")
            
    return findings
