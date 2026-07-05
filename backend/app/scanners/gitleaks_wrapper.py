import os
import subprocess
import json
import shutil
import tempfile

def is_gitleaks_available():
    return shutil.which("gitleaks") is not None

def run_gitleaks(repo_path):
    findings = []
    
    if not is_gitleaks_available():
        print("Gitleaks binary not found on local path. Skipping secret scan.")
        return findings
        
    # Set up a temporary file for the report
    fd, report_path = tempfile.mkstemp(suffix=".json")
    os.close(fd)
    
    try:
        has_git = os.path.isdir(os.path.join(repo_path, ".git"))
        
        cmd = ["gitleaks", "detect", "--source", repo_path, "--report-format", "json", "--report-path", report_path]
        if not has_git:
            cmd.append("--no-git")
            
        # Run gitleaks CLI - it returns exit code 1 if leaks are found, which is normal behavior
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False
        )
        
        # If the report file is non-empty, we have leaks
        if os.path.exists(report_path) and os.path.getsize(report_path) > 0:
            with open(report_path, "r") as f:
                raw_findings = json.load(f)
                for leak in raw_findings:
                    relative_path = os.path.relpath(leak.get("File", ""), repo_path)
                    findings.append({
                        "id": "leak-detected",
                        "cve": "N/A",
                        "tool": "gitleaks",
                        "type": "Hardcoded Secret",
                        "severity": "Critical",
                        "file": relative_path,
                        "line": leak.get("StartLine", 1),
                        "description": f"Potential leak of {leak.get('RuleID', 'credential')} (Secret: {leak.get('Secret', '')[:10]}...)",
                        "fix_suggestion": "Revoke the exposed token/key immediately, delete it from file configuration, and rotate credentials."
                    })
    except Exception as e:
        print(f"Error executing Gitleaks: {e}")
    finally:
        # Clean up temp file
        if os.path.exists(report_path):
            os.remove(report_path)
            
    return findings
