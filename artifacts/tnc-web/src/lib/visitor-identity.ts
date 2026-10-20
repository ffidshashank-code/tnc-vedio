import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { clearUser } from "@/lib/auth";

const VISITOR_ID_KEY = "tnc_visitor_id";
const VISITOR_NAME_KEY = "tnc_visitor_name";
const IDENTITY_VERSION_KEY = "tnc_visitor_identity_version";
const IDENTITY_VERSION = "v2";

let visitorIdPromise: Promise<string> | null = null;

export function initializeVisitorIdentity(): Promise<string> {
  if (visitorIdPromise) return visitorIdPromise;

  visitorIdPromise = (async () => {
    let previousVisitorId = "";
    try {
      if (localStorage.getItem(IDENTITY_VERSION_KEY) !== IDENTITY_VERSION) {
        localStorage.removeItem(VISITOR_ID_KEY);
        localStorage.removeItem(VISITOR_NAME_KEY);
        clearUser();
        localStorage.setItem(IDENTITY_VERSION_KEY, IDENTITY_VERSION);
      }
      previousVisitorId = localStorage.getItem(VISITOR_ID_KEY) ?? "";
    } catch {
      // Continue with a non-persistent fallback if storage is unavailable.
    }

    try {
      const agent = await FingerprintJS.load();
      const { visitorId } = await agent.get();
      const fingerprintId = `fp_${IDENTITY_VERSION}_${visitorId}`;
      localStorage.setItem(VISITOR_ID_KEY, fingerprintId);
      return fingerprintId;
    } catch {
      const fallbackId = previousVisitorId || `local_${IDENTITY_VERSION}_${crypto.randomUUID()}`;
      try {
        localStorage.setItem(VISITOR_ID_KEY, fallbackId);
      } catch {
        // The in-memory fallback still lets this visit continue.
      }
      return fallbackId;
    }
  })();

  return visitorIdPromise;
}