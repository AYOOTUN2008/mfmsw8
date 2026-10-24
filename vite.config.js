import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";
const routes = [
  "/",
  "/about",
  "/services",
  "/events",
  "/messages",
  "/ministries",
  "/media",
  "/contact",
];
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const publicKey = env.VITE_SUPABASE_ANON_KEY || "";
  let keyRole = null;
  try {
    keyRole = JSON.parse(
      Buffer.from(publicKey.split(".")[1] || "", "base64url").toString(),
    ).role;
  } catch {}
  if (
    publicKey &&
    !publicKey.startsWith("sb_publishable_") &&
    keyRole !== "anon"
  )
    throw new Error(
      "VITE_SUPABASE_ANON_KEY must be a public publishable or legacy anon key. Private keys must never enter a frontend build.",
    );
  let origin = "";
  try {
    const u = new URL(env.VITE_SITE_URL || "https://mfmsw8-mega-region.vercel.app");
    if (u.protocol === "https:" && !u.username && !u.password)
      origin = u.origin;
  } catch {}
  return {
    esbuild: { jsx: "automatic" },
    build: {
      rollupOptions: {
        input: { site: resolve("index.html"), admin: resolve("admin.html") },
      },
    },
    plugins: [
      {
        name: "site-discovery",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "robots.txt",
            source: `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin.html\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ""}`,
          });
          if (origin)
            this.emitFile({
              type: "asset",
              fileName: "sitemap.xml",
              source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${origin}${route}</loc></url>`).join("")}</urlset>`,
            });
        },
      },
    ],
  };
});
