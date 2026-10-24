# MFM SW8 Mega Region — Ijebu/Remo

A regional church website for Mountain of Fire and Miracles Ministries — **SW8 Mega-Regional Headquarters, Ijebu/Remo**. Includes eight public React pages and a separate staff CMS entry at `/admin.html` (also `/admin` on Vercel).

## Run locally

Use Node.js 22+ and npm. Each cloud task already has an isolated checkout; use `/workspace/mfmsw8` and do not create worktrees unless requested.

```sh
npm ci
npm run dev -- --port 5173
```

No backend configuration is needed to view the public website. Without Supabase, the site uses verified local leadership/gallery content and transparent empty states for unconfirmed details. Staff editing remains unavailable until connected; there is no demo password or fake login.

## Build and test

```sh
npm run build
npm test
```

Browser tests start their own production preview on port 4174, exercise the eight public routes and admin setup, eleven viewport widths, navigation, gallery focus/dialogs, reduced motion and actual playback of the new motion logo and regional film. Tests use `/usr/bin/chromium`; set `CHROMIUM_PATH` for another installation. The suite also checks staff UI flows with mocked Supabase transport and SQL authorization using local PostgreSQL emulation. These checks do not replace live Supabase acceptance tests in the setup guide.

## Deploy to Vercel

Import `AYOOTUN2008/mfmsw8`, choose Vite, build with `npm run build`, output `dist`. `vercel.json` handles the public page routes, `/admin`, and security headers. The separate `admin.html` build entry is always emitted. No private keys are needed in the browser.

The confirmed production address is `https://mfmsw8-mega-region.vercel.app/`. Canonical tags, Open Graph metadata, and the generated sitemap use this address. Set `VITE_SITE_URL` when moving to a custom HTTPS domain. Staff routes are excluded from indexing.

## Connect the church office

Follow [docs/CMS-SETUP.md](docs/CMS-SETUP.md) to create a church-owned Supabase project, apply RLS and storage SQL, approve staff accounts, configure public project values in Vercel, and verify live authorization. Use `.env.example` for local public configuration. Never put service-role keys, database passwords, or staff passwords in browser code or chat.

Features: homepage text, confirmed contact details, leadership, services, programmes, announcements, sermons via external video/audio URLs, ministries, gallery, draft/publish workflow, previews, photo uploads, and a private media library. Image uploads are limited to 5 MB and optimized to 1,800 pixels. Push notifications and direct video-file uploads are not implemented.

## Architecture and content

- `src/pages`, `src/sections`, `src/components`: public React UI.
- `src/hooks`: shared content context and motion enhancement.
- `src/admin`: separate staff UI and styles.
- `src/services`, `src/lib`: Supabase access and validation, separated from UI.
- `supabase/migrations`: database, RLS and private image storage policies.
- `public/media`: supplied and optimized regional media.

Pages are split into separate chunks. The opening follows the supplied headquarters screenshot: full-width regional photographs, dark overlay, overlaid navigation, and centred welcome text. Three photographs are selected manually with accessible arrow and dot controls; there is no automatic slideshow. GSAP adds a short entrance only, and reduced-motion mode disables it. Native browser scrolling is retained, so Lenis/WebGL/React Bits are not required. Videos load on request, and fonts are served locally.

See [CONTENT-SOURCES.md](CONTENT-SOURCES.md) and [docs/MEDIA-UPDATE.md](docs/MEDIA-UPDATE.md) for asset provenance and information awaiting confirmation. The current/new motion identity is explicitly used; the old motion logo is not shipped. This regional website links to the international MFM website as a separate denominational resource.
