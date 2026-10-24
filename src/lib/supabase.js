import { createClient } from "@supabase/supabase-js";
import { inspectOfficeAuthLink } from "./auth-links.js";
export const officeAuthLink = inspectOfficeAuthLink(
  typeof window !== "undefined" ? window.location : null,
);
const url = import.meta.env.VITE_SUPABASE_URL || "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const legacyKeyRole = (() => {
  try {
    return JSON.parse(
      atob((key.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/")),
    ).role;
  } catch {
    return null;
  }
})();
let validProjectUrl = false;
try {
  const parsed = new URL(url);
  validProjectUrl =
    parsed.protocol === "https:" &&
    !!parsed.hostname &&
    !parsed.username &&
    !parsed.password &&
    (!parsed.pathname || parsed.pathname === "/") &&
    !parsed.search &&
    !parsed.hash;
} catch {}
let client = null;
if (
  validProjectUrl &&
  key &&
  !key.startsWith("sb_secret_") &&
  legacyKeyRole !== "service_role"
) {
  try {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: officeAuthLink.office,
        flowType: "implicit",
      },
    });
  } catch {
    /* Invalid setup must not prevent the public website from rendering. */
  }
}
export const supabase = client;
export const isConfigured = !!client;
export const supabaseUrl = url.replace(/\/$/, "");
export const publishableKey = key;
