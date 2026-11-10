#!/usr/bin/env python3
"""
BLUSOC Dataset Integrity and Sanitization Verification Suite
Validates schema compliance, threat telemetry fields, and sanitization boundaries.
"""

import sys
import os
import json
import re

def verify_dataset(repo_root):
    data_dir = os.path.join(repo_root, "data")
    assert os.path.isdir(data_dir), f"Data directory missing at {data_dir}"
    
    json_files = [f for f in os.listdir(data_dir) if f.endswith(".json")]
    assert len(json_files) >= 3, f"Expected at least 3 JSON files in data/, found: {json_files}"
    
    print(f"[*] Discovered {len(json_files)} data files: {json_files}")
    
    # 1. Verify JSON syntax and check for forbidden strings across all files in data/
    for jf in json_files:
        fpath = os.path.join(data_dir, jf)
        with open(fpath, "r", encoding="utf-8") as f:
            raw_text = f.read()
            
        # Parse JSON
        try:
            parsed = json.loads(raw_text)
            print(f"  [+] {jf}: Valid JSON ({len(parsed)} top-level elements)")
        except json.JSONDecodeError as e:
            print(f"  [!] {jf}: Invalid JSON syntax: {e}")
            sys.exit(1)
            
        # Em dash check (\u2014)
        if "\u2014" in raw_text:
            print(f"  [!] {jf}: Forbidden em dash (\\u2014) detected!")
            sys.exit(1)
            
        # En dash check (\u2013)
        if "\u2013" in raw_text:
            print(f"  [!] {jf}: Forbidden en dash (\\u2013) detected!")
            sys.exit(1)
            
        # RFC 1918 internal lab IP leak check (e.g. 192.168.x.x)
        if re.search(r"192\.168\.\d+\.", raw_text):
            print(f"  [!] {jf}: Forbidden RFC 1918 IP leak detected!")
            sys.exit(1)

    # 2. Specific validation for data/alerts_sanitized.json
    alerts_path = os.path.join(data_dir, "alerts_sanitized.json")
    with open(alerts_path, "r", encoding="utf-8") as f:
        alerts = json.load(f)
        
    assert isinstance(alerts, list), "alerts_sanitized.json must be a JSON array"
    total_alerts = len(alerts)
    print(f"[*] Validating {total_alerts} alerts in alerts_sanitized.json...")
    assert total_alerts >= 67, f"Expected at least 67 alerts, got {total_alerts}"
    
    required_fields = [
        "id", "title", "category", "severity", "timestamp",
        "src_ip", "dest_ip", "raw_log", "triage_questions"
    ]
    
    categories = set()
    severities = set()
    
    for idx, alert in enumerate(alerts):
        for field in required_fields:
            if field not in alert or alert[field] is None:
                print(f"  [!] Alert index {idx} (ID: {alert.get('id')}) missing required field: {field}")
                sys.exit(1)
                
        # Validate triage questions
        questions = alert["triage_questions"]
        if not isinstance(questions, list) or len(questions) < 1:
            print(f"  [!] Alert index {idx} has invalid or empty triage_questions")
            sys.exit(1)
            
        for q in questions:
            for qf in ["num", "text", "answer"]:
                if qf not in q or q[qf] is None:
                    print(f"  [!] Alert index {idx} question missing {qf}")
                    sys.exit(1)
                    
        categories.add(alert["category"])
        severities.add(alert["severity"])
        
    print(f"  [+] Categories present: {sorted(list(categories))}")
    print(f"  [+] Severities present: {sorted(list(severities))}")
    
    expected_categories = {"malicious_ip", "reconnaissance", "malware", "phishing"}
    missing_cats = expected_categories - categories
    assert not missing_cats, f"Missing required categories: {missing_cats}"
    
    # 3. Specific validation for data/enterprise_topology.json
    topo_path = os.path.join(data_dir, "enterprise_topology.json")
    with open(topo_path, "r", encoding="utf-8") as f:
        topo = json.load(f)
    assert "assets" in topo and len(topo["assets"]) >= 5, "enterprise_topology.json missing assets"
    assert "subnets" in topo and len(topo["subnets"]) >= 3, "enterprise_topology.json missing subnets"
    print(f"  [+] Topology verified: {len(topo['assets'])} assets, {len(topo['subnets'])} subnets")
    
    # 4. Specific validation for data/alert_taxonomy.json
    tax_path = os.path.join(data_dir, "alert_taxonomy.json")
    with open(tax_path, "r", encoding="utf-8") as f:
        tax = json.load(f)
    assert "severity_scale" in tax, "alert_taxonomy.json missing severity_scale"
    assert "categories" in tax, "alert_taxonomy.json missing categories"
    assert "mitre_attack_matrix" in tax, "alert_taxonomy.json missing mitre_attack_matrix"
    print(f"  [+] Taxonomy verified: {len(tax['severity_scale']['levels'])} severity levels, {len(tax['categories'])} categories, {len(tax['mitre_attack_matrix'])} MITRE techniques")

    print("\n[SUCCESS] All BLUSOC dataset validation and sanitization checks passed 100% cleanly.")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(script_dir, ".."))
    verify_dataset(repo_root)
