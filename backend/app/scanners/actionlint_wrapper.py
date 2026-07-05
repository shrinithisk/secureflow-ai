import os
import subprocess
import shutil
import re

def is_actionlint_available():
    return shutil.which("actionlint") is not None

def run_actionlint(repo_path):
    findings = []
    
    if not is_actionlint_available():
        print("Actionlint binary not found on local path. Skipping CI/CD scan.")
        return findings
        
    workflow_dir = os.path.join(repo_path, ".github", "workflows")
    if not os.path.isdir(workflow_dir):
        return findings
        
    try:
        # Run actionlint in the repository context
        result = subprocess.run(
            ["actionlint", "-oneline"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=False
        )
        
        output = result.stdout.strip()
        if not output:
            return findings
            
        # Parse lines like: .github/workflows/build.yml:12:3: message [rule-id]
        pattern = re.compile(r"^(.github/workflows/[a-zA-Z0-9_\-\.]+):(\d+):(\d+):\s*(.*?)\s*\[([^\]]+)\]$")
        
        for line in output.splitlines():
            match = pattern.match(line)
            if match:
                file_path, line_num, col_num, message, rule = match.groups()
                
                # Grade severity
                severity = "Medium"
                if "permission" in message.lower() or "inject" in message.lower():
                    severity = "High"
                
                findings.append({
                    "id": rule,
                    "cve": "N/A",
                    "tool": "actionlint",
                    "type": f"Workflow Lint: {rule}",
                    "severity": severity,
                    "file": file_path,
                    "line": int(line_num),
                    "description": message,
                    "fix_suggestion": f"Check GitHub Actions security guidelines or correct rule: {rule}"
                })
    except Exception as e:
        print(f"Error scanning workflows with Actionlint: {e}")
        
    return findings
