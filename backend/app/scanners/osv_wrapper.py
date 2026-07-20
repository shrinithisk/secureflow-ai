import os
import json
import httpx
import re

OSV_API_URL = "https://api.osv.dev/v1/query"

def parse_version_tuple(v_str):
    if not v_str:
        return (0, 0, 0)
    parts = []
    for part in str(v_str).split('.'):
        num_str = ""
        for char in part:
            if char.isdigit():
                num_str += char
            else:
                break
        parts.append(int(num_str) if num_str else 0)
    while len(parts) < 3:
        parts.append(0)
    return tuple(parts[:3])

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
    dependencies_list = []
    
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
        is_vuln = False
        cve_id = None
        
        if result and "vulns" in result and result["vulns"]:
            is_vuln = True
            vulns = result["vulns"]
            
            max_fix_version = None
            cves = []
            vuln_descriptions = []
            
            for vuln in vulns:
                cve = "Unknown"
                if "aliases" in vuln:
                    cve_aliases = [a for a in vuln["aliases"] if a.startswith("CVE-")]
                    if cve_aliases:
                        cve = cve_aliases[0]
                if cve not in cves:
                    cves.append(cve)
                    
                # Propose fix version
                fix_version = None
                if "affected" in vuln:
                    for affected in vuln["affected"]:
                        if affected.get("package", {}).get("name") == dep["name"]:
                            ranges = affected.get("ranges", [])
                            for r in ranges:
                                if r.get("type") in ("SEMVER", "ECOSYSTEM"):
                                    events = r.get("events", [])
                                    for e in events:
                                        if "fixed" in e:
                                            fix_version = e["fixed"]
                                            
                if fix_version and fix_version != "Check advisory":
                    if max_fix_version is None:
                        max_fix_version = fix_version
                    else:
                        if parse_version_tuple(fix_version) > parse_version_tuple(max_fix_version):
                            max_fix_version = fix_version
                            
                summary = vuln.get("summary", "No summary provided")
                vuln_descriptions.append(f"* **{cve}**: {summary}")
                
            cve_str = ", ".join(cves)
            cve_id = cves[0] if cves else "Unknown"
            
            fix_suggestion = None
            original_block = None
            patched_block = None
            
            if max_fix_version:
                if dep["ecosystem"] == "PyPI":
                    fix_suggestion = f"Upgrade `{dep['name']}` from `{dep['version']}` to `{max_fix_version}` in requirements.txt"
                    original_block = f"{dep['name']}=={dep['version']}"
                    patched_block = f"{dep['name']}=={max_fix_version}"
                elif dep["ecosystem"] == "npm":
                    fix_suggestion = f"Upgrade `{dep['name']}` from `{dep['version']}` to `{max_fix_version}` in package.json"
                    original_block = f'"{dep["name"]}": "{dep["version"]}"'
                    patched_block = f'"{dep["name"]}": "{max_fix_version}"'
                    
            desc_bullet_points = "\n".join(vuln_descriptions)
            combined_description = f"Multiple vulnerabilities ({len(vulns)}) found in package **{dep['name']}**:\n\n{desc_bullet_points}"
            
            findings.append({
                "id": f"OSV-{dep['name']}",
                "cve": cve_str,
                "tool": "osv",
                "type": f"CVE Vulnerability: {dep['name']}",
                "severity": "High",
                "package": dep["name"],
                "current_version": dep["version"],
                "fixed_version": max_fix_version or "Check advisory",
                "fix_suggestion": fix_suggestion,
                "original_block": original_block,
                "patched_block": patched_block,
                "description": combined_description,
                "file": "requirements.txt" if dep["ecosystem"] == "PyPI" else "package.json"
            })
            
        dependencies_list.append({
            "name": dep["name"],
            "version": dep["version"],
            "ecosystem": dep["ecosystem"],
            "is_vulnerable": is_vuln,
            "cve": cve_id
        })
        
    return findings, dependencies_list
