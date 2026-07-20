import asyncio
from app.scanners.gitleaks_wrapper import run_gitleaks, is_gitleaks_available
from app.scanners.hadolint_wrapper import run_hadolint, is_hadolint_available
from app.scanners.actionlint_wrapper import run_actionlint, is_actionlint_available
from app.scanners.semgrep_wrapper import run_semgrep, is_semgrep_available
from app.scanners.osv_wrapper import scan_dependencies

def get_scanners_status():
    return {
        "gitleaks": is_gitleaks_available(),
        "hadolint": is_hadolint_available(),
        "actionlint": is_actionlint_available(),
        "semgrep": is_semgrep_available(),
        "osv": True # Always active (uses python parsing + free API)
    }

def extract_line_content(repo_path, relative_file_path, line_number):
    import os
    try:
        # Resolve absolute path safely and check bounds
        abs_path = os.path.abspath(os.path.join(repo_path, relative_file_path))
        if not abs_path.startswith(os.path.abspath(repo_path)):
            return None
        if os.path.exists(abs_path) and os.path.isfile(abs_path):
            with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                if 0 < line_number <= len(lines):
                    return lines[line_number - 1].strip()
    except Exception as e:
        print(f"Error extracting line snippet: {e}")
    return None

# Active Scanner Status & Percentage Tracking State
current_scanner_status = "Idle"
current_scanner_percentage = 0

def get_current_status():
    global current_scanner_status
    return current_scanner_status

def get_current_percentage():
    global current_scanner_percentage
    return current_scanner_percentage

def set_current_status(status, percentage=0):
    global current_scanner_status, current_scanner_percentage
    current_scanner_status = status
    current_scanner_percentage = percentage

async def run_all_scans(repo_path):
    print(f"Starting aggregate scan on: {repo_path}")
    
    # Run the CPU-based CLI scanners sequentially to avoid memory spike OOMs
    loop = asyncio.get_event_loop()
    
    set_current_status("Gitleaks: Auditing Git commit history and files for leaked secrets...", 20)
    print("Executing Gitleaks scan...")
    gitleaks_res = await loop.run_in_executor(None, run_gitleaks, repo_path)
    
    set_current_status("Hadolint: Verifying Dockerfile container base image instructions...", 30)
    print("Executing Hadolint scan...")
    hadolint_res = await loop.run_in_executor(None, run_hadolint, repo_path)
    
    set_current_status("Actionlint: Validating GitHub Actions workflows in .github/workflows/...", 40)
    print("Executing Actionlint scan...")
    actionlint_res = await loop.run_in_executor(None, run_actionlint, repo_path)
    
    set_current_status("Semgrep: Analyzing Python/JS code modules for application vulnerabilities...", 50)
    print("Executing Semgrep scan...")
    semgrep_res = await loop.run_in_executor(None, run_semgrep, repo_path)
    
    set_current_status("OSV Scanner: Auditing external package dependencies in requirements.txt / package.json...", 60)
    print("Executing OSV dependency scan...")
    osv_res_tuple = await scan_dependencies(repo_path)
    
    osv_findings, osv_deps = osv_res_tuple
    
    raw_findings = []
    raw_findings.extend(gitleaks_res)
    raw_findings.extend(hadolint_res)
    raw_findings.extend(actionlint_res)
    raw_findings.extend(semgrep_res)
    raw_findings.extend(osv_findings)
    
    # Deduplicate findings
    deduped_findings = []
    seen = set()
    
    for f in raw_findings:
        # Create a uniqueness signature
        sig = (f.get("tool"), f.get("file"), f.get("line"), f.get("description", "")[:50])
        if sig not in seen:
            seen.add(sig)
            
            # Extract actual code snippet line
            file_path = f.get("file", "")
            line_num = f.get("line")
            if file_path and line_num is not None:
                snippet = extract_line_content(repo_path, file_path, int(line_num))
                if snippet:
                    f["code_snippet"] = snippet
                    
            deduped_findings.append(f)
            
    # Sort findings: Severity first (Critical -> High -> Medium -> Low), then group by File, then by Line
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    def get_sorting_key(item):
        sev = item.get("severity", "Medium")
        sev_val = severity_order.get(sev, 2)
        file_path = item.get("file", "")
        # Handle string or None lines safely
        try:
            line_val = int(item.get("line", 0))
        except (ValueError, TypeError):
            line_val = 0
        return (sev_val, file_path, line_val)
        
    deduped_findings.sort(key=get_sorting_key)
    
    # Define regex-based credential masking helper
    import re
    def mask_credentials_in_text(text: str) -> str:
        if not text:
            return text
        # Mask private keys
        text = re.sub(
            r'-----BEGIN[ A-Z0-9_-]+PRIVATE KEY-----\s*[\s\S]+?\s*-----END[ A-Z0-9_-]+PRIVATE KEY-----',
            '-----BEGIN PRIVATE KEY-----\n****************************************\n-----END PRIVATE KEY-----',
            text
        )
        # Mask GitHub Personal Access Tokens
        text = re.sub(
            r'(ghp_[a-zA-Z0-9_]{4})[a-zA-Z0-9_]{20,255}',
            r'\1************************',
            text
        )
        # Mask AWS Access Keys
        text = re.sub(
            r'(AKIA[0-9A-Z]{4})[0-9A-Z]{12}',
            r'\1************',
            text
        )
        # Mask Slack webhook URLs
        text = re.sub(
            r'(https://hooks\.slack\.com/services/T[A-Z0-9_]+/B[A-Z0-9_]+/)[a-zA-Z0-9_]+',
            r'\1************************',
            text
        )
        # Mask raw variable assignments in code snippets
        keywords = r'(password|passwd|secret|token|api_key|apikey|access_key|private_key|key|pwd)'
        text = re.sub(
            rf'({keywords}\s*[:=]\s*")[^"]{{8,}}(")',
            r'\1********\2',
            text,
            flags=re.IGNORECASE
        )
        text = re.sub(
            rf"({keywords}\s*[:=]\s*')[^']{{8,}}(')",
            r"\1********\2",
            text,
            flags=re.IGNORECASE
        )
        return text

    # Centralized cleansing loop for SOC 2 compliance
    for f in deduped_findings:
        for field in ["description", "code_snippet", "original_block", "patched_block"]:
            if f.get(field):
                f[field] = mask_credentials_in_text(f[field])
             
    print(f"Aggregation complete. Found {len(deduped_findings)} unique vulnerabilities.")
    return {
        "findings": deduped_findings,
        "dependencies": osv_deps
    }
