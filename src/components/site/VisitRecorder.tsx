import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { collectSiteVisitFn } from "@/lib/dashboard-functions";
import { publicVisitPath } from "@/lib/dashboard-contract";
import { SITE_ORIGIN } from "@/lib/seo";

const KEY = "noir.visit.v1";
type Identity = {
  visitor: string;
  session: string;
  started: number;
  visitorStarted: number;
  last: number;
};
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;

export function VisitRecorder() {
  const path = useRouterState({ select: (s) => publicVisitPath(s.location.pathname) });
  const current = useRef({ path: "", event: "" });
  useEffect(() => {
    const preview =
      import.meta.env["VITE_DASHBOARD_PREVIEW"] === "true" &&
      ["127.0.0.1", "localhost"].includes(location.hostname);
    if (!path || (location.origin !== SITE_ORIGIN && !preview)) return;
    if (current.current.path !== path) current.current = { path, event: crypto.randomUUID() };
    let stopped = false,
      pendingView = true,
      inFlight = false,
      failures = 0,
      next = 0;
    let identity: Identity | null = null;
    async function tick() {
      if (
        stopped ||
        inFlight ||
        document.visibilityState !== "visible" ||
        Date.now() < next ||
        navigator.doNotTrack === "1" ||
        (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
      )
        return;
      const now = Date.now();
      try {
        const saved = localStorage.getItem(KEY);
        if (saved && saved.length < 1024) identity = JSON.parse(saved) as Identity;
      } catch {
        /* Memory fallback. */
      }
      const valid =
        identity &&
        UUID.test(identity.visitor) &&
        UUID.test(identity.session) &&
        [identity.last, identity.started, identity.visitorStarted].every(Number.isFinite) &&
        now >= identity.last;
      const old = valid ? identity : null;
      const visitorExpired = !old || now - old.visitorStarted >= 90 * 86400000;
      const sessionExpired =
        visitorExpired || !old || now - old.last >= 1800000 || now - old.started >= 86400000;
      identity = {
        visitor: visitorExpired ? crypto.randomUUID() : old!.visitor,
        session: sessionExpired ? crypto.randomUUID() : old!.session,
        visitorStarted: visitorExpired ? now : old!.visitorStarted,
        started: sessionExpired ? now : old!.started,
        last: now,
      };
      if (sessionExpired) {
        pendingView = true;
        current.current.event = crypto.randomUUID();
      }
      try {
        localStorage.setItem(KEY, JSON.stringify(identity));
      } catch {
        /* Recording cannot break shopping. */
      }
      let referrerHost = "";
      try {
        const url = new URL(document.referrer);
        if (/^https?:$/.test(url.protocol) && url.origin !== location.origin)
          referrerHost = url.hostname.toLowerCase().slice(0, 120);
      } catch {
        /* Direct visit. */
      }
      inFlight = true;
      try {
        const result = await collectSiteVisitFn({
          data: {
            eventId: pendingView ? current.current.event : crypto.randomUUID(),
            visitorId: identity.visitor,
            sessionId: identity.session,
            kind: pendingView ? "view" : "heartbeat",
            path: path!,
            device: innerWidth < 768 ? "mobile" : innerWidth < 1024 ? "tablet" : "desktop",
            referrerHost,
          },
        });
        if (!result.collected) {
          pendingView = true;
          throw Error("Measurement unavailable");
        }
        pendingView = false;
        failures = 0;
        next = now + 30000;
      } catch {
        failures = Math.min(failures + 1, 4);
        next = now + Math.min(300000, 30000 * 2 ** failures);
      } finally {
        inFlight = false;
      }
    }
    void tick();
    const timer = window.setInterval(() => void tick(), 30000);
    const visible = () => void tick();
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [path]);
  return null;
}
