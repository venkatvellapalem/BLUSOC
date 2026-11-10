#!/usr/bin/env python3
"""
BLUSOC Detection Engineering: Wazuh Rule Validation and Simulation Harness
Validates XML syntax, rule ID uniqueness, level ranges, em dash absence,
and evaluates sample events against suppression and threat detection rules.
"""

import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def get_nested_field(data: Dict[str, Any], field_path: str) -> Optional[Any]:
    """Retrieve value from a nested dictionary using dot-separated keys."""
    if field_path in data:
        return data[field_path]
    parts = field_path.split(".")
    curr: Any = data
    for part in parts:
        if isinstance(curr, dict) and part in curr:
            curr = curr[part]
        else:
            return None
    return curr


class WazuhRule:
    """Represents a parsed Wazuh XML rule definition."""

    def __init__(self, element: ET.Element, file_path: str, parent_group: str):
        self.element = element
        self.file_path = file_path
        self.parent_group = parent_group
        self.id = element.attrib.get("id", "").strip()
        self.level = int(element.attrib.get("level", "-1"))
        self.overwrite = element.attrib.get("overwrite", "no").lower() == "yes"
        self.if_sid = element.findtext("if_sid", "").strip() or None

        desc_elem = element.find("description")
        self.description = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else ""

        match_elem = element.find("match")
        self.match_pattern = match_elem.text.strip() if match_elem is not None and match_elem.text else None

        self.fields: List[Tuple[str, str, bool]] = []
        for field_elem in element.findall("field"):
            field_name = field_elem.attrib.get("name", "").strip()
            pattern = field_elem.text.strip() if field_elem.text else ""
            negate = field_elem.attrib.get("negate", "no").lower() == "yes"
            self.fields.append((field_name, pattern, negate))

        group_elem = element.find("group")
        self.rule_group = group_elem.text.strip() if group_elem is not None and group_elem.text else ""

        self.mitre_ids: List[str] = []
        mitre_elem = element.find("mitre")
        if mitre_elem is not None:
            for id_elem in mitre_elem.findall("id"):
                if id_elem.text:
                    self.mitre_ids.append(id_elem.text.strip())

    def matches(self, event: Dict[str, Any]) -> bool:
        """Evaluate if an event payload matches this rule's conditions."""
        # Check match pattern against log text or full event string
        if self.match_pattern:
            log_text = str(event.get("log", ""))
            if not log_text:
                log_text = json.dumps(event)
            if not re.search(self.match_pattern, log_text, re.IGNORECASE):
                return False

        # Check field conditions
        for field_name, pattern, negate in self.fields:
            val = get_nested_field(event, field_name)
            str_val = "" if val is None else str(val)

            # Fallback for IP fields
            if val is None and field_name == "office365.ClientIP" and "src_ip" in event:
                str_val = str(event["src_ip"])
            elif val is None and field_name == "src_ip" and "office365.ClientIP" in str(event):
                val_o365 = get_nested_field(event, "office365.ClientIP")
                if val_o365:
                    str_val = str(val_o365)

            matched = bool(re.search(pattern, str_val, re.IGNORECASE)) if pattern else True

            if negate:
                if matched and str_val != "":
                    return False
            else:
                if not matched:
                    return False

        return True


class DetectionHarness:
    """Validation harness for Wazuh rulesets and simulation against test events."""

    def __init__(self, root_dir: Path):
        self.root_dir = root_dir
        self.rules_dir = root_dir / "detection-engineering" / "wazuh" / "rules"
        self.tests_dir = root_dir / "detection-engineering" / "wazuh" / "tests"
        self.docs_dir = root_dir / "detection-engineering" / "docs"
        self.sample_events_path = self.tests_dir / "sample_events.json"

        self.rules: List[WazuhRule] = []
        self.rule_map: Dict[str, WazuhRule] = {}
        self.validation_errors: List[str] = []

    def check_em_dashes(self) -> int:
        """Verify zero occurrences of em dash characters across all files."""
        print("[CHECK 1] Scanning for em dash (\\u2014) occurrences...")
        em_dash_char = "\u2014"
        violations: List[str] = []

        scan_dirs = [self.rules_dir, self.tests_dir, self.docs_dir]
        for s_dir in scan_dirs:
            if not s_dir.exists():
                continue
            for path in s_dir.rglob("*"):
                if path.is_file() and path.suffix in [".xml", ".json", ".py", ".md", ".txt"]:
                    try:
                        content = path.read_text(encoding="utf-8")
                        lines = content.splitlines()
                        for line_num, line in enumerate(lines, start=1):
                            if em_dash_char in line:
                                violations.append(f"{path.relative_to(self.root_dir)}:{line_num} contains em dash")
                    except Exception as e:
                        violations.append(f"Failed to read {path}: {e}")

        if violations:
            for v in violations:
                print(f"  FAIL: {v}")
            self.validation_errors.extend(violations)
            return len(violations)

        print("  PASS: 0 em dashes found across all detection engineering files.")
        return 0

    def load_and_validate_xml_rules(self) -> bool:
        """Parse all XML rule files and validate syntax, IDs, and level ranges."""
        print("\n[CHECK 2] Parsing Wazuh XML rule files...")
        if not self.rules_dir.exists():
            self.validation_errors.append(f"Rules directory not found: {self.rules_dir}")
            return False

        xml_files = sorted(list(self.rules_dir.glob("*.xml")))
        if not xml_files:
            self.validation_errors.append(f"No XML rule files found in {self.rules_dir}")
            return False

        seen_ids: Dict[str, str] = {}

        for xml_file in xml_files:
            rel_path = xml_file.relative_to(self.root_dir)
            try:
                tree = ET.parse(xml_file)
                root = tree.getroot()
                if root.tag != "group":
                    self.validation_errors.append(f"{rel_path}: Root tag must be <group>, found <{root.tag}>")
                    continue

                parent_group = root.attrib.get("name", "")
                rule_count_in_file = 0

                for rule_elem in root.findall("rule"):
                    rule_id = rule_elem.attrib.get("id")
                    level_str = rule_elem.attrib.get("level")

                    if not rule_id or not rule_id.isdigit():
                        self.validation_errors.append(f"{rel_path}: Invalid or missing rule id: {rule_id}")
                        continue

                    if not level_str or not level_str.isdigit():
                        self.validation_errors.append(f"{rel_path}: Invalid or missing rule level for id {rule_id}")
                        continue

                    level = int(level_str)
                    if level < 0 or level > 16:
                        self.validation_errors.append(
                            f"{rel_path}: Rule {rule_id} level {level} outside valid range [0, 16]"
                        )
                        continue

                    if rule_id in seen_ids:
                        self.validation_errors.append(
                            f"Duplicate rule ID {rule_id} in {rel_path} (previously seen in {seen_ids[rule_id]})"
                        )
                        continue

                    rule = WazuhRule(rule_elem, str(rel_path), parent_group)
                    if not rule.description:
                        self.validation_errors.append(f"{rel_path}: Rule {rule_id} missing <description> tag")

                    seen_ids[rule_id] = str(rel_path)
                    self.rules.append(rule)
                    self.rule_map[rule_id] = rule
                    rule_count_in_file += 1

                print(f"  Loaded {xml_file.name}: {rule_count_in_file} valid rules.")

            except ET.ParseError as e:
                self.validation_errors.append(f"{rel_path}: XML parse error: {e}")
            except Exception as e:
                self.validation_errors.append(f"{rel_path}: Unexpected error: {e}")

        print(f"  PASS: Total {len(self.rules)} rules successfully parsed without syntax errors.")
        return len(self.validation_errors) == 0

    def evaluate_event(self, event_payload: Dict[str, Any]) -> Tuple[Optional[str], int]:
        """Simulate Wazuh rule matching against an event payload."""
        matched_rule_id: Optional[str] = None
        matched_level: int = 0

        # Evaluate rules in sequence: first-match / specific child match
        for rule in self.rules:
            if rule.matches(event_payload):
                matched_rule_id = rule.id
                matched_level = rule.level
                # If specific high fidelity rule matches, take it
                break

        return matched_rule_id, matched_level

    def run_simulation_tests(self) -> bool:
        """Run simulation tests using sample_events.json."""
        print("\n[CHECK 3] Simulating rule evaluation against sample events...")
        if not self.sample_events_path.exists():
            self.validation_errors.append(f"Sample events file not found: {self.sample_events_path}")
            return False

        try:
            with open(self.sample_events_path, "r", encoding="utf-8") as f:
                events = json.load(f)
        except Exception as e:
            self.validation_errors.append(f"Failed to read sample events JSON: {e}")
            return False

        print(f"  Found {len(events)} test scenarios in sample_events.json")
        passed = 0
        failed = 0

        for event in events:
            test_id = event.get("test_id", "UNKNOWN")
            desc = event.get("description", "")
            exp_id = str(event.get("expected_rule_id", ""))
            exp_level = int(event.get("expected_level", -1))
            payload = event.get("payload", {})

            matched_id, matched_level = self.evaluate_event(payload)

            if matched_id == exp_id and matched_level == exp_level:
                status_icon = "PASS"
                passed += 1
                if exp_level == 0:
                    note = "Level 0 (Suppressed)"
                else:
                    note = f"Level {matched_level} (Alert Triggered)"
                print(f"    [{status_icon}] {test_id}: {desc} -> Rule {matched_id} {note}")
            else:
                status_icon = "FAIL"
                failed += 1
                err_msg = (
                    f"Test {test_id} ({desc}) failed: "
                    f"expected Rule {exp_id} (Level {exp_level}), "
                    f"got Rule {matched_id} (Level {matched_level})"
                )
                print(f"    [{status_icon}] {err_msg}")
                self.validation_errors.append(err_msg)

        print(f"\n  Simulation Results: {passed} passed, {failed} failed out of {len(events)} tests.")
        return failed == 0

    def run_all(self) -> int:
        """Execute all validation stages and return status code."""
        print("=" * 70)
        print("BLUSOC DETECTION ENGINEERING: WAZUH RULES VALIDATION HARNESS")
        print("=" * 70)

        em_dash_violations = self.check_em_dashes()
        xml_ok = self.load_and_validate_xml_rules()
        tests_ok = self.run_simulation_tests() if xml_ok else False

        print("\n" + "=" * 70)
        print("VALIDATION SUMMARY")
        print("=" * 70)
        print(f"Total Rules Parsed:       {len(self.rules)}")
        print(f"Unique Rule IDs:          {len(self.rule_map)}")
        print(f"Em Dash Violations:       {em_dash_violations}")
        print(f"Validation Status:        {'SUCCESS' if (len(self.validation_errors) == 0) else 'FAILED'}")

        if self.validation_errors:
            print("\nErrors encountered:")
            for err in self.validation_errors:
                print(f"  - {err}")
            return 1

        print("\nAll Wazuh detection engineering rules verified successfully.")
        return 0


def main():
    root = Path(__file__).resolve().parent.parent.parent.parent
    harness = DetectionHarness(root)
    sys.exit(harness.run_all())


if __name__ == "__main__":
    main()
