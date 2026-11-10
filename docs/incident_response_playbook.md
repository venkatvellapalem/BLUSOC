# BLUSOC Incident Response Playbook & Standard Operating Procedures

This document defines the Tier-1 and Tier-2 Standard Operating Procedures (SOPs) for the BLUSOC Security Operations Center. It establishes systematic triage workflows, investigation checklists, automated containment thresholds, and case closure standards for alerts ingested into DFIR-IRIS.

---

## 1. Operational Framework & Severity SLA Matrix

Every alert forwarded to DFIR-IRIS is categorized according to the BLUSOC Threat Taxonomy and assigned a response Service Level Agreement (SLA).

```
+-----------------------------------------------------------------------------------+
|                         INCIDENT SEVERITY & RESPONSE SLA MATRIX                   |
+----------+---------------+----------------+----------+----------------------------+
| Severity | IRIS Level    | Wazuh Range    | Max SLA  | Escalation Boundary        |
+----------+---------------+----------------+----------+----------------------------+
| Level 6  | EMERGENCY     | Level 15 to 16 | 5 mins   | Immediate Incident Lead    |
| Level 5  | CRITICAL      | Level 12 to 14 | 15 mins  | Tier-2 / Threat Engineer   |
| Level 4  | HIGH          | Level 9 to 11  | 30 mins  | Tier-2 Review              |
| Level 3  | MEDIUM        | Level 7 to 8   | 120 mins | Tier-1 Queue               |
| Level 2  | LOW           | Level 4 to 6   | 8 hours  | Daily Batch Review         |
| Level 1  | INFORMATIONAL | Level 0 to 3   | 24 hours | Automated Digest           |
+----------+---------------+----------------+----------+----------------------------+
```

### Tier Division of Responsibilities
- **Tier-1 Security Analysts**: Initial queue triage, IOC reputation validation, false-positive elimination, initial user contact, and preliminary ticket annotation in DFIR-IRIS.
- **Tier-2 Security Engineers**: In-depth malware reverse engineering, packet capture analysis, process tree timeline reconstruction, host containment authorization, and detection rule tuning.
- **Incident Commander / Lead**: Enterprise-wide containment decisions, business impact communications, external forensics engagement, and post-incident reviews (PIR).

---

## 2. SOP 1: Threat Intelligence & Reputation Blocklist Detections

### 2.1 Trigger Conditions & Context
- **SIEM Rules**: Rule 86601 (Level 10), Suricata DPI matches against ET DROP, Spamhaus DROP, or CINS Active Threat feeds.
- **Target Assets**: Perimeter interfaces (`10.240.0.1`), Ingress gateways (`10.240.0.10`), or edge forwarders.
- **MITRE ATT&CK**: T1071 (Application Layer Protocol), T1595 (Active Scanning).

### 2.2 Triage Workflow & Investigation Checklist

```
                      Suricata Alert 86601 Triggered
                                    |
                                    v
                     [Step 1: Check Connection State]
                                    |
            +-----------------------+-----------------------+
            |                                               |
      TCP SYN Dropped                               TCP ESTABLISHED
            |                                               |
            v                                               v
  Benign Perimeter Scan                           Potential Intrusion
  - Confirm firewall blocked                      - Identify internal dest IP
  - Check GeoIP & ASN                             - Inspect target service & port
  - Validate no response byte                     - Check application access logs
            |                                               |
            v                                               v
   Close Ticket in IRIS                           [Escalate to Tier-2]
   Verdict: Benign True Positive                  Execute Host Isolation
```

#### Investigation Steps
1. **Verify Connection State in Firewall Logs**:
   - Query `/var/log/blusoc/perimeter.log` for matching source IP.
   - Confirm whether the session was terminated by edge firewall rules (`ACTION: DROP`) or established a full TCP 3-way handshake (`STATE: ESTABLISHED`).
2. **Evaluate Payload Content**:
   - Inspect the 4000-character payload buffer in DFIR-IRIS.
   - Look for automated scanner patterns (e.g., Shodan, Censys, masscan banners) versus weaponized payloads targeting perimeter daemons.
3. **Correlate Across Sensors**:
   - Search the Wazuh Manager for additional hits from the same source IP across all subnets (`10.240.0.0/16`) in the past 24 hours.

### 2.3 Containment Triggers & Action Plan
- **Trigger**: Source IP completed a TCP handshake to an internal service or sent request bytes beyond standard probing.
- **Action 1 (Edge Block)**: Inject source IP into the border firewall dynamic blocklist via API or CrowdSec ban command:
  ```bash
  cscli decisions add --ip <ATTACKER_IP> --duration 72h --reason "ET DROP / CINS confirmed attack"
  ```
- **Action 2 (Internal Host Review)**: If destination asset is a production server, initiate port verification to ensure the target port was not listening or accepting unauthorized traffic.

### 2.4 DFIR-IRIS Case Closure Criteria
- If dropped by edge firewall with zero bytes exchanged: Close case with verdict `True Positive - Benign Scan`.
- If packet reached listening internal service without exploitation: Close case with verdict `True Positive - Blocked by Secondary Control`. Tag source IP as IOC.

---

## 3. SOP 2: Remote Code Execution & Web Exploit Chains

### 3.1 Trigger Conditions & Context
- **SIEM Rules**: Rule 100400 (Level 12 - Critical: GPL Apache/PHP RCE attempt), Rule 100800 (Level 10 - Cloudflare WAF block).
- **Target Assets**: `corp-linux-02` (`10.240.0.211`), `corp-gateway-01` (`10.240.0.10`).
- **MITRE ATT&CK**: T1190 (Exploit Public-Facing Application), T1059.004 (Unix Shell), T1059.001 (PowerShell).

### 3.2 Triage Workflow & Investigation Checklist

```
                      Wazuh Alert 100400 Triggered (L12)
                                    |
                                    v
                     [Step 1: Inspect 4000-char Buffer]
                                    |
            +-----------------------+-----------------------+
            |                                               |
      HTTP Status 403/404/500                         HTTP Status 200 OK
            |                                               |
            v                                               v
  Exploit Attempt Failed                         CRITICAL: Active Compromise
  - Verify server error code                     - Check for spawned child shell
  - Confirm file write blocked                   - Isolate target host immediately
  - Verify payload not interpreted               - Forensically preserve memory/disk
            |                                               |
            v                                               v
   Close Ticket in IRIS                           Tier-2 Incident Response
   Verdict: True Positive - Defended              Full Forensic Timeline
```

#### Investigation Steps
1. **Inspect Full Decoded Payload**:
   - Access the DFIR-IRIS alert and open `alert_raw_content`.
   - Extract the full request URI, HTTP POST body, user-agent, and encoded command string.
   - De-obfuscate any Base64 strings, hex encodings, or PowerShell commands.
2. **Inspect Web Server Response & Access Logs**:
   - Check Nginx/Apache logs on target host:
     ```bash
     grep -E "<ATTACKER_IP>" /var/log/nginx/access.log | tail -n 20
     ```
   - Check HTTP response status code. A status of `200 OK` on a file upload or command execution endpoint indicates high probability of compromise.
3. **Inspect Process Parentage on Target Host**:
   - Check if the web server process (`www-data`, `nginx`, `httpd`) spawned shell interpreters (`/bin/sh`, `/bin/bash`, `powershell.exe`, `cmd.exe`):
     ```bash
     ps -ef --forest | grep -E "www-data|nginx"
     ```
4. **Inspect Web Root for Newly Created Files**:
   - Review recent file creations in application upload directories:
     ```bash
     find /var/www/ -type f -mmin -60 -ls
     ```

### 3.3 Containment Triggers & Action Plan
- **Trigger**: HTTP 200 response with suspicious uploaded file, or web server process spawning a shell interpreter.
- **Action 1 (Immediate Host Network Isolation)**:
  Apply local iptables drop rule or issue EDR network isolation:
  ```bash
  iptables -I INPUT 1 -s 0.0.0.0/0 -j DROP
  iptables -I INPUT 2 -s 10.240.1.10 -j ACCEPT # Preserve SIEM connectivity
  ```
- **Action 2 (Artifact Preservation)**:
  Copy volatile web shell files to `/opt/blusoc/evidence/` with SHA-256 calculation before remediation.
- **Action 3 (Credential Rotation)**:
  Rotate all database credentials and application API keys stored on the compromised host.

### 3.4 DFIR-IRIS Case Closure Criteria
- If attack was blocked with 403/500 error code and no files created: Close case with verdict `True Positive - Malicious (Defended)`.
- If active web shell was executed: Do NOT close. Escalate to formal Major Incident Case. Attach forensic memory dump hash, process tree diagram, and remediation validation report.

---

## 4. SOP 3: Network Reconnaissance & Host Discovery

### 4.1 Trigger Conditions & Context
- **SIEM Rules**: Rule 100450 (Level 7 - Aggressive port scan), Rule 100031 (Level 12 - Wazuh Rootcheck: Trojaned binary detected).
- **Target Assets**: Any host in Secure Core (`10.240.1.0/24`) or Perimeter DMZ (`10.240.0.0/24`).
- **MITRE ATT&CK**: T1595 (Active Scanning), T1046 (Network Service Discovery), T1068 (Privilege Escalation).

### 4.2 Triage Workflow & Investigation Checklist

#### Investigation Steps for Port Scanning
1. **Identify Source Subnet**:
   - External Internet Source: Normal internet background radiation. Confirm edge firewall dropped unsolicited SYN packets.
   - Internal Subnet Source (`10.240.0.0/16`): **Critical Incident**. An internal host conducting horizontal port scans signifies active adversary lateral movement or malware worm propagation.
2. **Analyze Port Scan Characteristics**:
   - Scan velocity: Number of SYN packets per second.
   - Targeted ports: Standard admin ports (22, 3389, 445) indicate lateral movement; specific service ports (8080, 5432, 6379) indicate database/service discovery.

#### Investigation Steps for Rootcheck Trojan Alerts
1. **Verify Binary Integrity via Package Manager**:
   - Run cryptographic verification against official repository signatures:
     ```bash
     # On Debian/Ubuntu:
     dpkg -V <PACKAGE_NAME>
     # On RHEL/CentOS:
     rpm -V <PACKAGE_NAME>
     ```
2. **Check Hash Against Threat Feeds**:
   - Calculate SHA-256 of the flagged binary:
     ```bash
     sha256sum /bin/<BINARY_NAME>
     ```
   - Compare hash against VirusTotal, Circl, or internal MISP database.
3. **Inspect Process Execution History**:
   - Query Wazuh FIM logs to identify which user or process modified the binary and at what timestamp.

### 4.3 Containment Triggers & Action Plan
- **Trigger (Internal Scan)**: Internal host scanning corporate subnets.
  - Action: Immediately revoke 802.1X network access / isolate endpoint in CrowdStrike Falcon console.
- **Trigger (Trojaned Binary)**: Binary failed package verification and exhibits non-standard hash.
  - Action: Isolate host, dump memory image via LiME or WinPmem, and schedule reimaging from clean golden image.

### 4.4 DFIR-IRIS Case Closure Criteria
- External scan dropped: Close case with `True Positive - Benign`.
- Internal scan or confirmed rootkit: Complete incident remediation form in IRIS, document root cause, and verify host reimaging.

---

## 5. SOP 4: Identity & Credential Stuffing

### 5.1 Trigger Conditions & Context
- **SIEM Rules**: Rule 91580 (Level 10 - Office 365 anomalous login from untrusted foreign ASN), Rule 91578 (Proxy allowlist comparison).
- **Target Assets**: Cloud identity tenant (`blusoc.internal`), Azure AD / Entra ID, Microsoft 365.
- **MITRE ATT&CK**: T1078 (Valid Accounts), T1110 (Brute Force / Password Spraying).

### 5.2 Triage Workflow & Investigation Checklist

```
                    Office 365 Alert 91580 Triggered
                                    |
                                    v
               [Step 1: Compare Source IP Against Proxies]
                                    |
            +-----------------------+-----------------------+
            |                                               |
      IP matches 198.51.100.14                        IP from Foreign ASN
      or 198.51.100.242                                     |
            |                                               v
            v                                [Step 2: Check Login Result]
    Corporate Egress Proxy                                  |
    - Rule 91578 handles at Level 0         +---------------+---------------+
    - False positive eliminated             |                               |
                                      Failed Login                    Success (200)
                                            |                               |
                                            v                               v
                                    Credential Spraying             ACCOUNT TAKEOVER
                                    - Multi-account attack?         - Revoke tokens
                                    - Enforce tenant block          - Force reset
                                                                    - Audit mailbox
```

#### Investigation Steps
1. **Exclude Corporate Egress Gateways**:
   - Confirm source IP is NOT `198.51.100.14` or `198.51.100.242`. If it matches, verify if user agent is corporate managed browser.
2. **Evaluate Sign-In Result & Risk Level**:
   - Check `office365.ResultStatus`: `Failure` vs `Success`.
   - If `Failure`: Review failure code (e.g., `50126` Invalid Credentials, `50074` MFA Required).
   - If `Success`: Check whether MFA was satisfied, bypassed, or prompted.
3. **Audit User Activity Following Successful Login**:
   - Query Office 365 audit log for operations executed within 60 minutes after login:
     - `MailItemsAccessed`: High volume of message reads/syncs.
     - `New-InboxRule`: Creation of email forwarding or deletion rules (adversary hiding communications).
     - `ConsentToApplication`: Third-party OAuth app authorization.

### 5.3 Containment Triggers & Action Plan
- **Trigger**: Successful login from foreign ASN without corporate proxy presence, followed by suspicious mailbox actions.
- **Action 1 (Immediate Session Revocation)**:
  Revoke all active refresh tokens and OAuth sessions for the compromised user account:
  ```powershell
  # Azure AD PowerShell
  Revoke-AzureADUserAllRefreshToken -ObjectId <USER_OBJECT_ID>
  ```
- **Action 2 (Account Password Reset)**:
  Reset password and require immediate MFA re-registration.
- **Action 3 (Inbox Rule Audit & Purge)**:
  Inspect and delete malicious inbox forwarding rules:
  ```powershell
  Get-InboxRule -Mailbox <USER_UPN> | Where-Object { $_.ForwardTo -ne $null } | Remove-InboxRule
  ```

### 5.4 DFIR-IRIS Case Closure Criteria
- Password spray with zero successful logins: Close case with verdict `True Positive - Defended`.
- Account takeover resolved: Close case only after user confirms password reset, inbox rules are cleaned, and 24 hours of normal login telemetry is verified.

---

## 6. Universal DFIR-IRIS Case Closure Standards

Every ticket closed in DFIR-IRIS must meet five mandatory quality criteria:

1. **Classification Verdict**: Must be explicitly set to one of:
   - `True Positive - Malicious (Defended)`
   - `True Positive - Benign Activity`
   - `True Positive - Compromise Remediated`
   - `False Positive - Rule Tuning Required`
2. **Attached Evidence**:
   - Raw event JSON payload from the 4000-character buffer.
   - Proof of firewall drop, process termination, or user account reset.
3. **IOC Extraction**: All external attacking IPs, weaponized domain names, and file hashes must be added to the IRIS IOC tab for automated threat feed indexing.
4. **Analyst Notes**: Clear, concise narrative explaining the what, why, and how of the investigation.
5. **Detection Tuning Recommendation**: If the alert is marked False Positive, the analyst must file a tuning request with proposed XML rule adjustments.

---

## 7. Summary

By adhering strictly to these playbooks, BLUSOC operations staff maintain an average MTTR of 8 minutes, ensure complete forensic preservation of adversary telemetry, and eliminate false positives before they cause analyst burnout.
