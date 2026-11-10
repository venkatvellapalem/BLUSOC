#!/usr/bin/env python3
"""
BLUSOC Repository-Wide Sanitization and Em-Dash Audit Harness

Scans all source code, markup, JSON, YAML, scripts, and documentation files across the repository
(excluding .git, node_modules, .next, and build artifacts) to enforce strict enterprise sanitization
and code quality standards:
1. Zero occurrences of em dashes (\u2014 or '—').
2. Zero occurrences of legacy internal lab IPs (192.168.1., 124.123.14., 103.211.36.).
3. Zero occurrences of legacy lab hostnames (soclab, eagle1, eagle6, eaglematrix).
4. Zero occurrences of real employee records or personal identifiers (keerthi, vellapalem, xiaomi).
5. Zero unmasked production secrets, real API keys, or raw private keys.
"""

import os
import re
import sys
from typing import Dict, List, Set, Tuple

# Subdirectories and file patterns to ignore
IGNORED_DIRS: Set[str] = {
    ".git",
    "node_modules",
    ".next",
    "__pycache__",
    ".pytest_cache",
    ".vscode",
    ".idea",
    "dist",
    "build",
    "coverage",
}

IGNORED_EXTENSIONS: Set[str] = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".svg",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".pyc",
    ".tsbuildinfo",
    ".lock",
    ".zip",
    ".tar.gz",
    ".pdf",
}

# Forbidden strings with category classifications
FORBIDDEN_TERMS: Dict[str, str] = {
    "\u2014": "Em Dash (\\u2014)",
    "—": "Em Dash (UTF-8)",
    "192.168.1.": "Internal Lab IP (192.168.1.x)",
    "124.123.14.": "Internal Lab IP (124.123.14.x)",
    "103.211.36.": "Internal Lab IP (103.211.36.x)",
    "soclab": "Legacy Lab Hostname (soclab)",
    "eagle1": "Legacy Lab Hostname (eagle1)",
    "eagle6": "Legacy Lab Hostname (eagle6)",
    "eaglematrix": "Legacy Lab Identifier (eaglematrix)",
    "keerthi": "Employee Identifier (keerthi)",
    "vellapalem": "Employee Identifier (vellapalem)",
    "xiaomi": "Personal Hardware Identifier (xiaomi)",
}

# Regex patterns for active credential leaks
SUSPICIOUS_CREDENTIAL_PATTERNS: List[Tuple[str, str]] = [
    (r"AKIA[0-9A-Z]{16}", "AWS Access Key ID"),
    (r"ghp_[0-9a-zA-Z]{36}", "GitHub Personal Access Token"),
    (r"-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----", "Raw Private Key"),
]


def audit_repository(repo_root: str) -> bool:
    print("=" * 80)
    print("BLUSOC REPOSITORY-WIDE SANITIZATION & EM-DASH AUDIT")
    print("=" * 80)
    print(f"Target Repository Root: {repo_root}")

    scanned_files = 0
    violations: List[Dict[str, str]] = []

    for root, dirs, files in os.walk(repo_root):
        # Prune ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in IGNORED_EXTENSIONS:
                continue

            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, repo_root)

            # Skip this script itself when checking self-definitions of forbidden terms
            if rel_path == os.path.join("scripts", "audit_repository_sanitization.py"):
                continue

            scanned_files += 1

            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    lines = f.readlines()
            except Exception as e:
                print(f"[!] Warning: Unable to read {rel_path}: {e}")
                continue

            for line_num, line in enumerate(lines, start=1):
                # 1. Check exact forbidden terms
                lower_line = line.lower()
                for term, desc in FORBIDDEN_TERMS.items():
                    if term.lower() in lower_line:
                        violations.append({
                            "file": rel_path,
                            "line": str(line_num),
                            "category": desc,
                            "snippet": line.strip()[:120],
                        })

                # 2. Check regex patterns for active credential leaks
                for pattern, desc in SUSPICIOUS_CREDENTIAL_PATTERNS:
                    if re.search(pattern, line):
                        violations.append({
                            "file": rel_path,
                            "line": str(line_num),
                            "category": f"Credential Leak: {desc}",
                            "snippet": line.strip()[:120],
                        })

    print(f"\n[+] Total text and source files inspected: {scanned_files}")
    print("-" * 80)

    if violations:
        print(f"[FAIL] Detected {len(violations)} sanitization or code standard violation(s):")
        for v in violations:
            print(f"  - [{v['category']}] {v['file']}:{v['line']}")
            print(f"      Content: {v['snippet']}")
        print("=" * 80)
        print("AUDIT FAILED: Repository contains forbidden terms or unmasked records.")
        print("=" * 80)
        return False

    print("[PASS] 0 Em dashes (\\u2014) detected across all files.")
    print("[PASS] 0 Legacy lab internal IPs (192.168.1., 124.123.14., 103.211.36.) detected.")
    print("[PASS] 0 Legacy lab hostnames (soclab, eagle1, eagle6, eaglematrix) detected.")
    print("[PASS] 0 Real employee records or personal identifiers detected.")
    print("[PASS] 0 Production credential or private key leaks detected.")
    print("=" * 80)
    print("AUDIT SUCCESS: 100% compliance across all scanned files.")
    print("=" * 80)
    return True


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, ".."))
    success = audit_repository(repo_root)
    sys.exit(0 if success else 1)
