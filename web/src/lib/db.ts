import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import type { Alert, GuestSession, TuningRule, VerdictSubmission } from "./types";

const databaseUrl = process.env.DATABASE_URL;

export const db = databaseUrl
  ? drizzle(neon(databaseUrl), { schema })
  : null;

export function isDatabaseConnected(): boolean {
  return Boolean(db);
}

const memorySessions = new Map<string, GuestSession>();
const memoryVerdicts = new Map<string, VerdictSubmission[]>();

const DEFAULT_TUNING_RULES: TuningRule[] = [
  {
    id: "rule_100010",
    rule_id: 100010,
    name: "CrowdStrike Null-Hostname Heartbeat Storm Suppression",
    component: "Wazuh / CrowdStrike Falcon",
    before_daily: 8420,
    after_daily: 12,
    reduction_percent: 99.85,
    description: "Suppresses repetitive registration heartbeat floods from unassigned agent hosts by filtering empty hostname attributes at ingestion.",
    enabled: true,
  },
  {
    id: "rule_91578",
    rule_id: 91578,
    name: "Office 365 Egress Proxy IP Correlation and Filtering",
    component: "Wazuh / M365",
    before_daily: 3140,
    after_daily: 42,
    reduction_percent: 98.66,
    description: "Exempts corporate egress proxy IP block 198.51.100.0/24 from brute-force alert threshold to eliminate false positives while preserving legitimate credential stuffing alerts.",
    enabled: true,
  },
  {
    id: "rule_86611",
    rule_id: 86611,
    name: "Suricata 802.1ad Ethertype (0x88a8) Noise Filter",
    component: "Suricata DPI",
    before_daily: 1890,
    after_daily: 0,
    reduction_percent: 100.0,
    description: "Filters non-routable QinQ VLAN encapsulation packet noise at edge sensors to prevent SIEM buffer saturation.",
    enabled: true,
  },
  {
    id: "rule_100550",
    rule_id: 100550,
    name: "Cloudflare Edge Validation Loop Threshold Tuning",
    component: "Cloudflare WAF / Syslog",
    before_daily: 830,
    after_daily: 130,
    reduction_percent: 84.34,
    description: "Adjusts frequency thresholds for repetitive edge validation probes from legitimate CDN health-check nodes.",
    enabled: true,
  },
];

let cachedLocalAlerts: Alert[] | null = null;

export function getLocalSeedAlerts(): Alert[] {
  if (cachedLocalAlerts) {
    return cachedLocalAlerts;
  }

  const candidatePaths = [
    path.join(process.cwd(), "src", "data", "alerts_sanitized.json"),
    path.join(process.cwd(), "data", "alerts_sanitized.json"),
    path.join(process.cwd(), "..", "data", "alerts_sanitized.json"),
  ];

  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw) as Alert[];
        cachedLocalAlerts = parsed;
        return parsed;
      } catch (err) {
        console.warn(`[BLUSOC DB] Error reading alerts from ${filePath}:`, err);
      }
    }
  }

  console.warn("[BLUSOC DB] Warning: Could not locate alerts_sanitized.json in candidate paths, returning empty array.");
  return [];
}

export async function getAlerts(options?: {
  category?: string;
  severity?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Alert[]> {
  let alertsList: Alert[] = [];

  if (db) {
    try {
      const records = await db.select().from(schema.alerts);
      if (records && records.length > 0) {
        alertsList = records.map((r) => ({
          id: r.id,
          title: r.title,
          short_title: r.short_title ?? undefined,
          category: r.category,
          severity: r.severity,
          severity_id: r.severity_id ?? undefined,
          provider: r.provider ?? undefined,
          src_ip: r.src_ip,
          dest_ip: r.dest_ip,
          src_port: r.src_port ?? undefined,
          dest_port: r.dest_port ?? undefined,
          protocol: r.protocol ?? undefined,
          sensor: r.sensor ?? undefined,
          verdict: r.verdict ?? undefined,
          expected_verdict: r.expected_verdict,
          mitre_attack: r.mitre_attack ?? [],
          timestamp: r.timestamp,
          raw_log: r.raw_log,
          triage_questions: r.triage_questions ?? [],
        }));
      } else {
        alertsList = getLocalSeedAlerts();
      }
    } catch (err) {
      console.warn("[BLUSOC DB] Database query failed, falling back to local dataset:", err);
      alertsList = getLocalSeedAlerts();
    }
  } else {
    alertsList = getLocalSeedAlerts();
  }

  let filtered = [...alertsList];

  if (options?.category && options.category !== "ALL") {
    filtered = filtered.filter(
      (a) => a.category.toLowerCase() === options.category?.toLowerCase()
    );
  }

  if (options?.severity && options.severity !== "ALL") {
    filtered = filtered.filter(
      (a) => a.severity.toUpperCase() === options.severity?.toUpperCase()
    );
  }

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        (a.short_title && a.short_title.toLowerCase().includes(q)) ||
        a.src_ip.toLowerCase().includes(q) ||
        a.dest_ip.toLowerCase().includes(q) ||
        (a.provider && a.provider.toLowerCase().includes(q))
    );
  }

  const offset = options?.offset ?? 0;
  if (options?.limit) {
    return filtered.slice(offset, offset + options.limit);
  }

  return filtered.slice(offset);
}

export async function getAlertById(id: string): Promise<Alert | null> {
  const allAlerts = await getAlerts();
  const alert = allAlerts.find((a) => a.id === id);
  return alert ?? null;
}

export async function getTuningRules(): Promise<TuningRule[]> {
  if (db) {
    try {
      const records = await db.select().from(schema.tuningRules);
      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          rule_id: r.rule_id,
          name: r.name,
          component: r.component,
          before_daily: r.before_daily,
          after_daily: r.after_daily,
          reduction_percent: r.reduction_percent,
          description: r.description,
          enabled: r.enabled,
        }));
      }
    } catch (err) {
      console.warn("[BLUSOC DB] Database query for tuning rules failed, using defaults:", err);
    }
  }
  return DEFAULT_TUNING_RULES;
}

export async function getGuestSession(sessionId: string): Promise<GuestSession | null> {
  if (db) {
    try {
      const records = await db
        .select()
        .from(schema.guestSessions)
        .where(eq(schema.guestSessions.sessionId, sessionId));
      if (records && records.length > 0) {
        const r = records[0];
        return {
          session_id: r.sessionId,
          created_at: r.createdAt.toISOString(),
          triaged_alert_ids: r.triagedAlertIds ?? [],
          custom_rule_states: r.customRuleStates ?? {},
          last_active: r.lastActive.toISOString(),
        };
      }
    } catch (err) {
      console.warn("[BLUSOC DB] Error getting guest session, checking memory store:", err);
    }
  }

  return memorySessions.get(sessionId) ?? null;
}

export async function saveGuestSession(session: GuestSession): Promise<void> {
  memorySessions.set(session.session_id, session);

  if (db) {
    try {
      await db
        .insert(schema.guestSessions)
        .values({
          sessionId: session.session_id,
          triagedAlertIds: session.triaged_alert_ids,
          customRuleStates: session.custom_rule_states,
          lastActive: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.guestSessions.sessionId,
          set: {
            triagedAlertIds: session.triaged_alert_ids,
            customRuleStates: session.custom_rule_states,
            lastActive: new Date(),
          },
        });
    } catch (err) {
      console.warn("[BLUSOC DB] Could not persist session to Neon database:", err);
    }
  }
}

export async function saveVerdict(submission: VerdictSubmission): Promise<void> {
  const sessionId = submission.session_id ?? "anonymous";
  const existing = memoryVerdicts.get(sessionId) ?? [];
  const updated = existing.filter((v) => v.alert_id !== submission.alert_id);
  updated.push(submission);
  memoryVerdicts.set(sessionId, updated);

  const guest = memorySessions.get(sessionId);
  if (guest) {
    if (!guest.triaged_alert_ids.includes(submission.alert_id)) {
      guest.triaged_alert_ids.push(submission.alert_id);
    }
    guest.last_active = new Date().toISOString();
  }

  if (db) {
    try {
      const submissionId = `${sessionId}_${submission.alert_id}_${Date.now()}`;
      await db.insert(schema.triageVerdicts).values({
        id: submissionId,
        sessionId: sessionId,
        alertId: submission.alert_id,
        verdict: submission.verdict,
        notes: submission.notes,
        rootCause: submission.root_cause,
        timestamp: new Date(submission.timestamp || Date.now()),
      });
    } catch (err) {
      console.warn("[BLUSOC DB] Could not persist verdict to Neon database:", err);
    }
  }
}

export async function getVerdictsBySession(sessionId: string): Promise<VerdictSubmission[]> {
  if (db) {
    try {
      const records = await db
        .select()
        .from(schema.triageVerdicts)
        .where(eq(schema.triageVerdicts.sessionId, sessionId));
      if (records && records.length > 0) {
        return records.map((r) => ({
          alert_id: r.alertId,
          verdict: r.verdict,
          notes: r.notes,
          root_cause: r.rootCause ?? undefined,
          timestamp: r.timestamp.toISOString(),
          session_id: r.sessionId,
        }));
      }
    } catch (err) {
      console.warn("[BLUSOC DB] Error getting verdicts from DB, checking memory store:", err);
    }
  }

  return memoryVerdicts.get(sessionId) ?? [];
}

export async function resetGuestWorkspace(sessionId: string): Promise<void> {
  memoryVerdicts.delete(sessionId);
  const session = memorySessions.get(sessionId);
  if (session) {
    session.triaged_alert_ids = [];
    session.custom_rule_states = {};
    session.last_active = new Date().toISOString();
  }

  if (db) {
    try {
      await db
        .delete(schema.triageVerdicts)
        .where(eq(schema.triageVerdicts.sessionId, sessionId));
      await db
        .update(schema.guestSessions)
        .set({
          triagedAlertIds: [],
          customRuleStates: {},
          lastActive: new Date(),
        })
        .where(eq(schema.guestSessions.sessionId, sessionId));
    } catch (err) {
      console.warn("[BLUSOC DB] Error resetting guest workspace in DB:", err);
    }
  }
}
