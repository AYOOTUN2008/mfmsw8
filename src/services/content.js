import { supabase, isConfigured } from "../lib/supabase.js";
import {
  STORAGE_PREFIX,
  validateItem,
  validateSettings,
} from "../lib/validation.js";
export { isConfigured };
function ensure() {
  if (!supabase)
    throw new Error("The content service has not been connected yet.");
  return supabase;
}
function check(result) {
  if (result.error) throw result.error;
  return result.data;
}
export async function resolveImages(items) {
  const paths = [
    ...new Set(
      items
        .map((i) => i.image_url)
        .filter((v) => v?.startsWith(STORAGE_PREFIX))
        .map((v) => v.slice(STORAGE_PREFIX.length)),
    ),
  ];
  if (!paths.length) return items;
  const signed = check(
    await ensure().storage.from("church-media").createSignedUrls(paths, 3600),
  );
  const urls = new Map(signed.map((item) => [item.path, item.signedUrl || ""]));
  return items.map((item) => ({
    ...item,
    image_url: item.image_url?.startsWith(STORAGE_PREFIX)
      ? urls.get(item.image_url.slice(STORAGE_PREFIX.length)) || ""
      : item.image_url,
  }));
}
export async function getPublicContent() {
  if (!isConfigured) return { settings: null, items: [] };
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(
        new Error(
          "The content service took too long to respond. Please try again shortly.",
        ),
      );
    }, 10000);
  });
  async function request() {
    const [settings, items] = await Promise.all([
      supabase
        .from("site_settings")
        .select("data")
        .eq("id", "home")
        .maybeSingle()
        .abortSignal(controller.signal),
      supabase
        .from("content_items")
        .select("*")
        .eq("published", true)
        .order("sort_order")
        .order("created_at", { ascending: false })
        .abortSignal(controller.signal),
    ]);
    return {
      settings: check(settings)?.data || null,
      items: await resolveImages(check(items) || []),
    };
  }
  try {
    return await Promise.race([request(), deadline]);
  } finally {
    clearTimeout(timer);
  }
}
export async function isAdmin() {
  const {
    data: { user },
  } = await ensure().auth.getUser();
  if (!user) return false;
  const member = check(
    await supabase
      .from("cms_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  );
  return !!member;
}
export async function getAdminContent() {
  const [items, settings] = await Promise.all([
    ensure()
      .from("content_items")
      .select("*")
      .order("sort_order")
      .order("created_at", { ascending: false }),
    ensure()
      .from("site_settings")
      .select("data")
      .eq("id", "home")
      .maybeSingle(),
  ]);
  return { items: check(items) || [], settings: check(settings)?.data || {} };
}
export async function saveItem(value) {
  const data = validateItem(value);
  return check(
    await (
      value.id
        ? ensure().from("content_items").update(data).eq("id", value.id)
        : ensure().from("content_items").insert(data)
    )
      .select()
      .single(),
  );
}
export async function deleteItem(id) {
  check(await ensure().from("content_items").delete().eq("id", id));
}
export async function saveSettings(data) {
  check(
    await ensure()
      .from("site_settings")
      .upsert({ id: "home", data: validateSettings(data) }),
  );
}
export async function setPublished(item, published) {
  return saveItem({ ...item, published });
}
