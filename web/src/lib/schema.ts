import { pgTable, text, integer, timestamp, jsonb, doublePrecision, boolean } from "drizzle-orm/pg-core";
import type { TriageQuestion } from "./types";

export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  short_title: text("short_title"),
  category: text("category").notNull(),
  severity: text("severity").notNull(),
  severity_id: integer("severity_id"),
  provider: text("provider"),
  src_ip: text("src_ip").notNull(),
  dest_ip: text("dest_ip").notNull(),
  src_port: integer("src_port"),
  dest_port: integer("dest_port"),
  protocol: text("protocol"),
  sensor: text("sensor"),
  verdict: text("verdict"),
  expected_verdict: text("expected_verdict").notNull(),
  mitre_attack: jsonb("mitre_attack").$type<string[]>(),
  timestamp: text("timestamp").notNull(),
  raw_log: text("raw_log").notNull(),
  triage_questions: jsonb("triage_questions").$type<TriageQuestion[]>(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tuningRules = pgTable("tuning_rules", {
  id: text("id").primaryKey(),
  rule_id: integer("rule_id").notNull(),
  name: text("name").notNull(),
  component: text("component").notNull(),
  before_daily: integer("before_daily").notNull(),
  after_daily: integer("after_daily").notNull(),
  reduction_percent: doublePrecision("reduction_percent").notNull(),
  description: text("description").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const guestSessions = pgTable("guest_sessions", {
  sessionId: text("session_id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  triagedAlertIds: jsonb("triaged_alert_ids").$type<string[]>().default([]).notNull(),
  customRuleStates: jsonb("custom_rule_states").$type<Record<string, boolean>>().default({}).notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
});

export const triageVerdicts = pgTable("triage_verdicts", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  alertId: text("alert_id").notNull(),
  verdict: text("verdict").notNull(),
  notes: text("notes").default("").notNull(),
  rootCause: text("root_cause"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AlertRecord = typeof alerts.$inferSelect;
export type InsertAlertRecord = typeof alerts.$inferInsert;
export type TuningRuleRecord = typeof tuningRules.$inferSelect;
export type GuestSessionRecord = typeof guestSessions.$inferSelect;
export type TriageVerdictRecord = typeof triageVerdicts.$inferSelect;
