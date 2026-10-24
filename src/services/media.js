import { supabase, supabaseUrl, publishableKey } from "../lib/supabase.js";
import { STORAGE_PREFIX } from "../lib/validation.js";
const accepted = ["image/jpeg", "image/png", "image/webp"];
export async function optimizeImage(file) {
  if (!accepted.includes(file.type))
    throw new Error("Choose a JPG, PNG or WebP photograph.");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Choose a photograph smaller than 5 MB.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This photograph could not be read. Choose another file.");
  });
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width * bitmap.height > 40000000
    )
      throw new Error("Choose a photograph below 40 megapixels.");
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas
      .getContext("2d")
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.86),
    );
    if (!blob || blob.size > 5 * 1024 * 1024)
      throw new Error(
        "This image is too large after processing. Choose a smaller photograph.",
      );
    return blob;
  } finally {
    bitmap.close();
  }
}
export async function uploadImage(file, onProgress = () => {}) {
  const blob = await optimizeImage(file);
  const ext = blob.type === "image/webp" ? "webp" : "png";
  const path = `uploads/${crypto.randomUUID()}.${ext}`;
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session)
    throw new Error("Please sign in again before uploading.");
  await new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.timeout = 60000;
    request.open(
      "POST",
      `${supabaseUrl}/storage/v1/object/church-media/${path}`,
    );
    request.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    request.setRequestHeader("apikey", publishableKey);
    request.setRequestHeader("Content-Type", blob.type);
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    request.onerror = () =>
      reject(
        new Error("Upload interrupted. Check your connection and try again."),
      );
    request.ontimeout = () =>
      reject(
        new Error(
          "The upload took too long. Check your connection or choose a smaller photograph.",
        ),
      );
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(
            new Error(
              "The photograph could not be uploaded. Check your account permissions and try again.",
            ),
          );
    request.send(blob);
  });
  return STORAGE_PREFIX + path;
}
export async function imagePreview(reference) {
  if (!reference?.startsWith(STORAGE_PREFIX)) return reference || "";
  const { data, error } = await supabase.storage
    .from("church-media")
    .createSignedUrl(reference.slice(STORAGE_PREFIX.length), 3600);
  if (error) throw error;
  return data.signedUrl;
}
export async function listMedia(offset = 0) {
  const { data, error } = await supabase.storage
    .from("church-media")
    .list("uploads", {
      limit: 40,
      offset,
      sortBy: { column: "created_at", order: "desc" },
    });
  if (error) throw error;
  const files = data.filter((file) => file.id);
  return Promise.all(
    files.map(async (file) => ({
      ...file,
      reference: STORAGE_PREFIX + "uploads/" + file.name,
      url: await imagePreview(STORAGE_PREFIX + "uploads/" + file.name),
    })),
  );
}
export async function deleteMedia(reference) {
  if (!reference.startsWith(STORAGE_PREFIX))
    throw new Error("Only uploaded library images can be deleted here.");
  const { data, error } = await supabase
    .from("content_items")
    .select("id")
    .eq("image_url", reference)
    .limit(1);
  if (error) throw error;
  if (data.length)
    throw new Error(
      "This photograph is used by a content item. Remove or replace it in that item first.",
    );
  const result = await supabase.storage
    .from("church-media")
    .remove([reference.slice(STORAGE_PREFIX.length)]);
  if (result.error) throw result.error;
}
