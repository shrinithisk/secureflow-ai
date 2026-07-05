import os
import json
import httpx
import re

OSV_API_URL = "https://api.osv.dev/v1/query"

def parse_requirements_txt(filepath):
    dependencies = []
    if not os.path.exists(filepath):
        return dependencies
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Match package==version
            match = re.match(r"^([a-zA-Z0-9_\-\[\]]+)==([0-9a-zA-Z\.\-\+]+)", line)
            if match:
                name, version = match.groups()
                dependencies.append({"name": name, "version": version, "ecosystem": "PyPI"})
    return dependencies

def parse_package_json(filepath):
    dependencies = []
    if not os.path.exists(filepath):
        return dependencies
    try:
        with open(filepath, "r") as f:
            data = json.load(f)
            # Combine dependencies and devDependencies
            deps = data.get("dependencies", {})
            dev_deps = data.get("devDependencies", {})
            all_deps = {**deps, **dev_deps}
            for name, version_range in all_deps.items():
                # Clean version (strip caret/tilde/stars)
                version = re.sub(r"[~\^>=<*]", "", version_range).strip()
                if version:
                    dependencies.append({"name": name, "version": version, "ecosystem": "npm"})
    except Exception as e:
        print(f"Error parsing package.json: {e}")
    return dependencies

async def query_osv(package_name, version, ecosystem):
    payload = {
        "version": version,
        "package": {
            "name": package_name,
            "ecosystem": ecosystem
        }
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(OSV_API_URL, json=payload, timeout=10.0)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"OSV query error for {package_name}: {e}")
    return {}

async def scan_dependencies(repo_path):
    findings = []
    dependencies = []
    
    # Locate package files
    for root, dirs, files in os.walk(repo_path):
        # Exclude common large dirs
        dirs[:] = [d for d in dirs if d not in ["node_modules", ".git", "venv", "__pycache__"]]
        for file in files:
            if file == "requirements.txt":
                dependencies.extend(parse_requirements_txt(os.path.join(root, file)))
            elif file == "package.json":
                dependencies.extend(parse_package_json(os.path.join(root, file)))
                
    # Query OSV for each dependency
    for dep in dependencies:
        result = await query_osv(dep["name"], dep["version"], dep["ecosystem"])
        if result and "vulns" in result:
            for vuln in result["vulns"]:
                summary = vuln.get("summary", "No summary provided")
                details = vuln.get("details", "")
                cve = "Unknown"
                if "aliases" in vuln:
                    cves = [a for a in vuln["aliases"] if a.startswith("CVE-")]
                    if cves:
                        cve = cves[0]
                
                # Propose fix version
                fix_version = None
                if "affected" in vuln:
                    for affected in vuln["affected"]:
                        if affected.get("package", {}).get("name") == dep["name"]:
                            ranges = affected.get("ranges", [])
                            for r in ranges:
                                if r.get("type") == "SEMVER":
                                    events = r.get("events", [])
                                    for e in events:
                                        if "fixed" in e:
                                            fix_version = e["fixed"]
                
                findings.append({
                    "id": vuln.get("id"),
                    "cve": cve,
                    "tool": "osv",
                    "type": f"CVE Vulnerability: {dep['name']}",
                    "severity": "High",  # OSV API doesn't always contain a simple severity string, so we default to High
                    "package": dep["name"],
                    "current_version": dep["version"],
                    "fixed_version": fix_version or "Check advisory",
                    "description": f"{summary}\n\n### Details\n{details}" if details else summary,
                    "file": "requirements.txt" if dep["ecosystem"] == "PyPI" else "package.json"
                })
    return findings
