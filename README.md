# MFM SW8 Mega Region — Ijebu/Remo

Responsive regional church website, built with Vite and plain JavaScript. This represents SW8 Mega-Regional Headquarters, Ijebu/Remo; it does not represent the international headquarters.

## Development

Requires Node.js 22 or later and npm.

```sh
cd /workspace/mfmsw8
npm ci
npm run dev -- --port 5173
```

## Production and validation

```sh
npm run build
npm test
npm run preview -- --port 4173
```

The browser tests start their own production preview on port 4174. Build first. Tests use `/usr/bin/chromium`; set `CHROMIUM_PATH` if Chromium is elsewhere. They verify content and image loading, anchor targets, mobile menu interactions, overflow at five viewport widths, and actual regional video playback. Fonts and media are locally served. No API keys or external services are needed to run this website.

## Content and supplied assets

See [CONTENT-SOURCES.md](CONTENT-SOURCES.md) for provenance and details awaiting confirmation. Edit content in `src/main.js` and styles in `src/style.css`. Public media is in `public/media`. The hero and gallery use the supplied regional service photographs; the messages section uses the supplied Bible-and-cross worship artwork. The official ministry link opens an external denominational resource; it is not a regional contact link.

The build output in `dist` can be deployed to any static host. Deployment has not been performed.
