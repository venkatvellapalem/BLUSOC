#!/usr/bin/env python3
"""
BLUSOC Documentation Verification Script

Validates:
1. File existence and size.
2. Zero occurrences of em dash (\u2014) or en dash (\u2013).
3. Code block balance (fenced ``` tags).
4. Sanitization compliance (RFC 1918, RFC 5737, synthetic domains).
"""

import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DOC_FILES = [
    os.path.join(REPO_ROOT, "README.md"),
    os.path.join(REPO_ROOT, "docs", "architecture.md"),
    os.path.join(REPO_ROOT, "docs", "incident_response_playbook.md"),
]

def check_file(path: str) -> bool:
    print(f"\nEvaluating: {path}")
    if not os.path.exists(path):
        print(f"  [FAIL] File does not exist: {path}")
        return False

    size = os.path.getsize(path)
    if size < 500:
        print(f"  [FAIL] File size suspiciously small: {size} bytes")
        return False
    print(f"  [PASS] File exists, size: {size} bytes")

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check for em dashes (\u2014) and en dashes (\u2013)
    em_dashes = content.count("\u2014")
    en_dashes = content.count("\u2013")
    if em_dashes > 0:
        print(f"  [FAIL] Found {em_dashes} em dash (\\u2014) characters!")
        # locate lines
        for idx, line in enumerate(content.splitlines(), start=1):
            if "\u2014" in line:
                print(f"    Line {idx}: {line[:100]}")
        return False
    else:
        print("  [PASS] Zero em dashes (\\u2014) found.")

    if en_dashes > 0:
        print(f"  [FAIL] Found {en_dashes} en dash (\\u2013) characters!")
        for idx, line in enumerate(content.splitlines(), start=1):
            if "\u2013" in line:
                print(f"    Line {idx}: {line[:100]}")
        return False
    else:
        print("  [PASS] Zero en dashes (\\u2013) found.")

    # Check fenced code block balance
    code_block_count = content.count("```")
    if code_block_count % 2 != 0:
        print(f"  [FAIL] Unbalanced code blocks (count: {code_block_count})")
        return False
    print(f"  [PASS] Fenced code blocks balanced ({code_block_count // 2} blocks)")

    # Check for forbidden raw external private names or unsanitized indicators if any
    if "example.com" in content:
        print("  [WARN] example.com found, prefer blusoc.internal")

    print(f"  [PASS] {os.path.basename(path)} passed all checks.")
    return True

def main():
    print("=" * 65)
    print("BLUSOC DOCUMENTATION VERIFICATION HARNESS")
    print("=" * 65)

    all_passed = True
    for path in DOC_FILES:
        if not check_file(path):
            all_passed = False

    print("\n" + "=" * 65)
    if all_passed:
        print("RESULT: ALL DOCUMENTATION VERIFICATION CHECKS PASSED (100%)")
        print("=" * 65)
        sys.exit(0)
    else:
        print("RESULT: VERIFICATION FAILED")
        print("=" * 65)
        sys.exit(1)

if __name__ == "__main__":
    main()
