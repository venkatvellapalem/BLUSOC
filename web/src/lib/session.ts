import { cookies } from "next/headers";
import { getGuestSession, saveGuestSession } from "./db";
import type { GuestSession } from "./types";

export const SESSION_COOKIE_NAME = "blusoc_session_id";

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
};

export function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `guest_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;
  }
  return `guest_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
}

export async function getSessionId(): Promise<string> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (sessionCookie && sessionCookie.value) {
    return sessionCookie.value;
  }
  return generateSessionId();
}

export async function getOrCreateSession(): Promise<GuestSession> {
  const sessionId = await getSessionId();
  let session = await getGuestSession(sessionId);

  if (!session) {
    session = {
      session_id: sessionId,
      created_at: new Date().toISOString(),
      triaged_alert_ids: [],
      custom_rule_states: {},
      last_active: new Date().toISOString(),
    };
    await saveGuestSession(session);
  }

  return session;
}
