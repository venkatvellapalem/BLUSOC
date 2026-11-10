import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAlerts, getVerdictsBySession, getGuestSession, saveVerdict, resetGuestWorkspace, saveGuestSession } from "@/lib/db";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, generateSessionId } from "@/lib/session";
import { getGeoCountry } from "@/lib/geo";
import type { EnrichedAlert, VerdictSubmission, WorkbenchMetrics } from "@/lib/types";

export async function GET() {
  try {
    const cookieStore = cookies();
    let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    let isNewSession = false;

    if (!sessionId) {
      sessionId = generateSessionId();
      isNewSession = true;
      await saveGuestSession({
        session_id: sessionId,
        created_at: new Date().toISOString(),
        triaged_alert_ids: [],
        custom_rule_states: {},
        last_active: new Date().toISOString(),
      });
    }

    const [alerts, verdicts, guestSession] = await Promise.all([
      getAlerts(),
      getVerdictsBySession(sessionId),
      getGuestSession(sessionId),
    ]);

    const verdictMap = new Map<string, VerdictSubmission>();
    for (const v of verdicts) {
      verdictMap.set(v.alert_id, v);
    }

    const triagedSet = new Set<string>(guestSession?.triaged_alert_ids ?? []);

    const enrichedAlerts: EnrichedAlert[] = alerts.map((a) => {
      const userVerdict = verdictMap.get(a.id);
      const isClosed = Boolean(userVerdict || triagedSet.has(a.id));
      const status = isClosed ? "CLOSED" : "NEW";
      const country = getGeoCountry(a.src_ip, a.triage_questions);

      return {
        ...a,
        status,
        country,
        userVerdict: userVerdict
          ? {
              verdict: userVerdict.verdict,
              notes: userVerdict.notes,
              root_cause: userVerdict.root_cause,
              timestamp: userVerdict.timestamp,
            }
          : undefined,
      };
    });

    const triagedCount = enrichedAlerts.filter((a) => a.status === "CLOSED").length;
    const criticalCount = enrichedAlerts.filter((a) => a.severity.toUpperCase() === "CRITICAL").length;

    const metrics: WorkbenchMetrics = {
      total: enrichedAlerts.length,
      triaged: triagedCount,
      pending: enrichedAlerts.length - triagedCount,
      critical: criticalCount,
    };

    const response = NextResponse.json({
      success: true,
      alerts: enrichedAlerts,
      metrics,
      session_id: sessionId,
    });

    if (isNewSession) {
      response.cookies.set(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);
    }

    return response;
  } catch (error) {
    console.error("[BLUSOC API] GET /api/workbench error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve workbench alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    let isNewSession = false;

    if (!sessionId) {
      sessionId = generateSessionId();
      isNewSession = true;
    }

    const body = await request.json();
    const { alertId, verdict, analystNotes, rootCause } = body;

    if (!alertId || typeof alertId !== "string") {
      return NextResponse.json(
        { success: false, error: "alertId is required" },
        { status: 400 }
      );
    }

    if (!verdict || typeof verdict !== "string") {
      return NextResponse.json(
        { success: false, error: "verdict is required" },
        { status: 400 }
      );
    }

    const submission: VerdictSubmission = {
      alert_id: alertId,
      verdict,
      notes: typeof analystNotes === "string" ? analystNotes.trim() : "",
      root_cause: typeof rootCause === "string" ? rootCause.trim() : "External Threat Actor",
      timestamp: new Date().toISOString(),
      session_id: sessionId,
    };

    await saveVerdict(submission);

    const response = NextResponse.json({
      success: true,
      alertId,
      status: "CLOSED",
      verdict: submission,
    });

    if (isNewSession) {
      response.cookies.set(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);
    }

    return response;
  } catch (error) {
    console.error("[BLUSOC API] POST /api/workbench error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record alert verdict" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
      await resetGuestWorkspace(sessionId);
    }

    return NextResponse.json({
      success: true,
      message: "Workbench reset to factory state.",
    });
  } catch (error) {
    console.error("[BLUSOC API] DELETE /api/workbench error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset workbench workspace" },
      { status: 500 }
    );
  }
}
