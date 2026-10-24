// Inspect only the office callback URL. Supabase owns validation of tokens and sessions.
export function inspectOfficeAuthLink(location) {
  const office = ["/admin", "/admin.html"].includes(
    (location?.pathname || "").replace(/\/$/, ""),
  );
  if (!office) return { office: false, intent: null, error: false };
  const hash = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const type = hash.get("type");
  return {
    office: true,
    intent: ["invite", "recovery"].includes(type) ? type : null,
    error: !!hash.get("error"),
  };
}
export function clearOfficeAuthFragment(
  location = window.location,
  history = window.history,
) {
  const link = inspectOfficeAuthLink(location);
  if (!link.office) return;
  const hash = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  if (
    ["access_token", "refresh_token", "error", "type"].some((key) =>
      hash.has(key),
    )
  ) {
    history.replaceState(null, "", location.pathname + location.search);
  }
}
