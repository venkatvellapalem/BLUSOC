#!/usr/bin/env python3
"""Scan version-controlled source and visible additions for known private identifiers and credential patterns."""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BINARY_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".pdf", ".pyc"}
PRIVATE_TERMS = (
    "192.168.1.", "124.123.14.", "103.211.36.",
    "soclab", "eagle1", "eagle6", "eaglematrix", "keerthi", "vellapalem", "xiaomi",
)
PUBLIC_REFERENCES = ("https://github.com/venkatvellapalem/BLUSOC",)
CREDENTIAL_PATTERNS = (
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS access key identifier"),
    (re.compile(r"ghp_[0-9a-zA-Z]{36}"), "GitHub token"),
    (re.compile(r"github_pat_[0-9a-zA-Z_]{40,}"), "GitHub fine-grained token"),
    (re.compile(r"-----BEGIN (?:(?:RSA|EC|DSA|OPENSSH) )?PRIVATE KEY-----"), "private key"),
)


def findings_for_line(line):
    public_text = line
    for reference in PUBLIC_REFERENCES:
        public_text = public_text.replace(reference, "")
    categories = []
    if any(term in public_text.lower() for term in PRIVATE_TERMS):
        categories.append("known private identifier")
    # Public links do not exempt the rest of the line from credential checks.
    categories.extend(label for pattern, label in CREDENTIAL_PATTERNS if pattern.search(line))
    return categories


def main():
    try:
        result = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
                                cwd=ROOT, capture_output=True, check=True, timeout=30)
    except (OSError, subprocess.SubprocessError):
        print("Could not enumerate repository source through Git.", file=sys.stderr)
        return 1
    findings = []
    scanned = 0
    for name in sorted(set(result.stdout.decode("utf-8").split("\0")) - {""}):
        path = ROOT / name
        if not path.is_file() or path.resolve() == Path(__file__).resolve() or path.suffix.lower() in BINARY_SUFFIXES:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        scanned += 1
        for number, line in enumerate(content.splitlines(), 1):
            findings.extend(f"{name}:{number}: {category}" for category in findings_for_line(line))
    if findings:
        # File locations and categories are sufficient; never echo a discovered secret.
        print("\n".join(findings), file=sys.stderr)
        return 1
    print(f"Checked {scanned} repository text files against known identifier and credential patterns.")
    print("No matching patterns found. This targeted check is not a complete secret scanner.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
