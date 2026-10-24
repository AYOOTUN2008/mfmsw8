export const KINDS = [
  "event",
  "service",
  "announcement",
  "sermon",
  "ministry",
  "gallery",
  "leader",
];
export const STORAGE_PREFIX = "storage://church-media/";
export const SETTING_FIELDS = {
  hero_heading: ["Welcome heading", 200],
  hero_subheading: ["Welcome subheading", 500],
  hero_cta: ["Welcome button text", 60],
  welcome_text: ["About our region", 3000],
  contact_address: ["Confirmed street address", 500],
  contact_phone: ["Regional phone number", 80],
  contact_email: ["Regional email address", 254],
  maps_url: ["Directions link", 2048],
  youtube_url: ["YouTube profile", 2048],
  facebook_url: ["Facebook profile", 2048],
  instagram_url: ["Instagram profile", 2048],
  telegram_url: ["Telegram profile", 2048],
  audiomack_url: ["Audiomack profile", 2048],
};
export function safeUrl(value, { image = false } = {}) {
  if (!value) return "";
  const text = String(value).trim();
  if (text.length > 2048)
    throw new Error("Links must be shorter than 2,048 characters.");
  if (image && /^\/media\/[a-zA-Z0-9._/-]+$/.test(text) && !text.includes(".."))
    return text;
  if (
    image &&
    /^storage:\/\/church-media\/uploads\/[a-f0-9-]+\.(?:webp|jpg|jpeg|png)$/.test(
      text,
    )
  )
    return text;
  try {
    const url = new URL(text);
    if (url.protocol === "https:" && !url.username && !url.password)
      return url.href;
  } catch {}
  throw new Error("Use a complete secure link beginning with https://.");
}
export function validateItem(input) {
  if (!KINDS.includes(input.kind))
    throw new Error("Choose a valid content section.");
  const title = String(input.title || "").trim();
  if (!title || title.length > 160)
    throw new Error("Enter a title with 1 to 160 characters.");
  const result = { kind: input.kind, title };
  for (const [field, max] of Object.entries({
    description: 10000,
    time: 80,
    location: 500,
    speaker: 160,
    category: 120,
  })) {
    result[field] = String(input[field] || "").trim();
    if (result[field].length > max)
      throw new Error(`${field} is too long (maximum ${max} characters).`);
  }
  result.image_url = safeUrl(input.image_url, { image: true });
  result.video_url = safeUrl(input.video_url);
  result.audio_url = safeUrl(input.audio_url);
  result.date = input.date || null;
  if (result.date) {
    const parsed = new Date(result.date + "T00:00:00Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(result.date) ||
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== result.date
    )
      throw new Error("Choose a valid date.");
  }
  result.published = !!input.published;
  result.featured = !!input.featured;
  result.sort_order = Number(input.sort_order || 0);
  if (
    !Number.isSafeInteger(result.sort_order) ||
    Math.abs(result.sort_order) > 10000
  )
    throw new Error(
      "Display order must be a whole number between -10,000 and 10,000.",
    );
  if (result.kind === "gallery" && !result.image_url)
    throw new Error("Add a photograph before saving a gallery item.");
  if (result.published && result.kind === "event" && !result.date)
    throw new Error("Add a confirmed date before publishing a programme.");
  if (
    result.published &&
    result.kind === "service" &&
    (!result.category || !result.time)
  )
    throw new Error(
      "Add the confirmed day and time before publishing a service.",
    );
  if (
    result.published &&
    result.kind === "sermon" &&
    !result.video_url &&
    !result.audio_url
  )
    throw new Error("Add a video or audio link before publishing a message.");
  return result;
}
export function validateSettings(input) {
  const result = {};
  for (const [key, [label, max]] of Object.entries(SETTING_FIELDS)) {
    const value = String(input[key] || "").trim();
    if (value.length > max)
      throw new Error(`${label} is too long (maximum ${max} characters).`);
    if (key.endsWith("_url")) result[key] = safeUrl(value);
    else if (
      key === "contact_email" &&
      value &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )
      throw new Error("Enter a valid email address.");
    else result[key] = value;
  }
  return result;
}
