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

async def run_all_scans(repo_path):
    print(f"Starting aggregate scan on: {repo_path}")
    
    # Run the CPU-based CLI scanners in a thread pool so we don't block the async loop
    loop = asyncio.get_event_loop()
    
    gitleaks_task = loop.run_in_executor(None, run_gitleaks, repo_path)
    hadolint_task = loop.run_in_executor(None, run_hadolint, repo_path)
    actionlint_task = loop.run_in_executor(None, run_actionlint, repo_path)
    semgrep_task = loop.run_in_executor(None, run_semgrep, repo_path)
    
    # OSV scanner is already async
    osv_task = scan_dependencies(repo_path)
    
    # Wait for all scanners to complete
    gitleaks_res, hadolint_res, actionlint_res, semgrep_res, osv_res_tuple = await asyncio.gather(
        gitleaks_task, hadolint_task, actionlint_task, semgrep_task, osv_task
    )
    
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
            
    print(f"Aggregation complete. Found {len(deduped_findings)} unique vulnerabilities.")
    return {
        "findings": deduped_findings,
        "dependencies": osv_deps
    }
