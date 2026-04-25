# Immortal: The Lineage

A mobile-first browser game built with React + TypeScript + Vite + Tailwind CSS.

You play as an immortal patron guiding a family line through the centuries. Each year, family members live semi-independently and occasionally submit petitions asking for your intervention.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

Yes—GitHub Pages can cause this exact issue if you publish the repository root instead of the built `dist/` output.

- Do **not** deploy `index.html` from the source tree directly.
- Build first with `npm run build`.
- Publish the generated `dist/` folder.

This project now auto-detects GitHub Actions builds and sets Vite's `base` path to `/<repo-name>/` so assets resolve correctly on project pages (for example, `https://<user>.github.io/<repo>/`).

If you deploy outside GitHub Actions, you can set an explicit base path:

```bash
VITE_BASE_PATH=/your-base-path/ npm run build
```

## Project structure

```text
.
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── components
    │   ├── FamilyTree.tsx
    │   ├── Game.tsx
    │   └── PetitionCard.tsx
    └── game
        ├── logic.ts
        └── types.ts
```

## Gameplay loop

- Next Year increments the year and regenerates influence (+1 up to max 10).
- All living characters age and their health/happiness shift.
- Births and deaths are simulated.
- 1–3 petitions are generated for living eligible characters.
- You spend influence to support or decline petitions.
- State is persisted to `localStorage`.
- Game ends when no living characters remain.


