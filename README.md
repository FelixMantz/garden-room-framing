# Garden Room Framing Designer

Garden-room wall elevations, cutting schedules, roof and construction details, and two technical PDFs: timber framing (16 pages) and sheathing, insulation and interiors (17 pages).

## Keep the app and master spec in sync

**Required:** follow [AGENTS.md](AGENTS.md) and update the relevant sections of the [master specification](https://docs.google.com/document/d/1ILhSBko2Po7cq2c5KZfn3nbhcgPIh1S5PD6NR_BnrPw/edit) whenever changing build dimensions, materials, openings, layer build-ups, cutting quantities, fixings or construction details. Verify both sources after the edit. The prominent comments in `app/framing.ts` and `app/specification.ts` repeat this requirement.

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

The production files are in `dist/`. The app is configured for `/garden-room-framing/` on GitHub Pages. Both default PDFs are generated during the build. Each has independent page numbering and a drawing key. Adjusted PDFs are generated directly in the browser without a server.

## Deploy

In repository Settings → Pages, set the source to **GitHub Actions**. The Pages workflow builds, tests and deploys each push to `main`, and can also be run manually from the Actions tab.

## Source

Migrated from Garden Room Framing Designer, version 65, source commit `d377e8227683589b11a0cd1973a6f06f22363a62`. The framing specification, geometry and technical drawings are preserved. Original server route code remains under `app/api/` for regression comparisons; GitHub Pages uses the browser PDF generator.
