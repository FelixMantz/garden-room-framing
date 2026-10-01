# Garden Room Framing Designer

Garden-room wall elevations, cutting schedules, roof and construction details, and a 17-page technical PDF.

## Run locally

Requires Node.js 22.13 or later.

```sh
npm ci
npm run dev
```

## Build and check

```sh
npm test
npm run preview
```

The production files are in `dist/`. The app is configured for `/garden-room-framing/` on GitHub Pages. The default PDF is generated during the build. Adjusted PDFs are generated directly in the browser without a server.

## Deploy

In repository Settings → Pages, set the source to **GitHub Actions**. The Pages workflow builds, tests and deploys each push to `main`, and can also be run manually from the Actions tab.

## Source

Migrated from Garden Room Framing Designer, version 65, source commit `d377e8227683589b11a0cd1973a6f06f22363a62`. The framing specification, geometry and technical drawings are preserved. Original server route code remains under `app/api/` for regression comparisons; GitHub Pages uses the browser PDF generator.
