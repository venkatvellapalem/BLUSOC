#!/usr/bin/env python3
"""Check maintained documentation, local links, anchors, and fenced code blocks."""
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DOCUMENTS = [
    "README.md", "CONTRIBUTING.md", "SECURITY.md", "HANDOFF.md",
    "deployment/README.md", "docs/architecture.md", "docs/web-deployment.md",
    "docs/incident_response_playbook.md",
    "integrations/README.md",
]


def slug(text):
    text = re.sub(r"[^\w\s-]", "", text.strip().lower())
    return re.sub(r"\s+", "-", text)


def check_document(name):
    path = ROOT / name
    errors = []
    if not path.is_file():
        return [f"{name}: missing file"]
    content = path.read_text(encoding="utf-8")
    fence = None
    prose = []
    for number, line in enumerate(content.splitlines(), 1):
        match = re.match(r"\s*(`{3,}|~{3,})", line)
        if match:
            marker = match[1][0]
            fence = None if fence == marker else marker if fence is None else fence
        elif fence is None:
            prose.append((number, line))
    if fence:
        errors.append(f"{name}: unclosed code fence")
    if not any(line.startswith("# ") for _, line in prose):
        errors.append(f"{name}: missing document title")
    for number, line in prose:
        for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", line):
            parsed = urlsplit(target.strip("<>"))
            if parsed.scheme or parsed.netloc:
                continue
            linked = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
            if not linked.exists():
                errors.append(f"{name}:{number}: missing local link {parsed.path}")
            elif parsed.fragment and linked.suffix == ".md":
                headings = re.findall(r"^#{1,6}\s+(.+)$", linked.read_text(encoding="utf-8"), re.MULTILINE)
                if unquote(parsed.fragment) not in {slug(heading) for heading in headings}:
                    errors.append(f"{name}:{number}: unknown anchor {parsed.fragment}")
    return errors


def main():
    errors = [error for name in DOCUMENTS for error in check_document(name)]
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"Checked {len(DOCUMENTS)} maintained documents: local links, anchors, titles, and code fences.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
