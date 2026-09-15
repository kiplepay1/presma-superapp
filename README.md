# PRESMA SuperApp — Restaurant Onboarding Command Centre

An AI-assisted operations command centre for the PRESMA restaurant onboarding lifecycle, built on Green Packet's 18-step SOP.

## What this is

A working prototype (React + TypeScript + Tailwind, static site) covering:
- Command Centre executive dashboard (Operations / Executive view toggle)
- Restaurant Master database + Restaurant 360° profile (13 tabs: Overview, Onboarding, Documents, Due Diligence, Technical, Vendor, UAT, Training, Go-Live, Hypercare, Tasks, Activity Log, AI Insights)
- 18-step Onboarding Pipeline visualisation grouped by SOP phase
- AI Agent Hub — 9 rule-based agents (Onboarding Controller, Document Agent, SLA Guardian, Due Diligence Agent, Technical Readiness Agent, Vendor Coordination Agent, UAT Copilot, Go-Live Copilot, Hypercare Monitor) computing real recommendations from the mock dataset
- Documents, Approvals, Technical & Integration, UAT (66 test cases / 13 categories), Go-Live readiness, Hypercare monitoring, Tasks & SLA, Reports & Analytics, Settings/RBAC
- Global Cmd/Ctrl+K command bar with natural-language query matching over the live dataset
- 30 realistic mock restaurants seeded with 8 deliberate demo scenarios (healthy, missing docs, high-risk, technical-blocked, UAT defect, go-live-ready, hypercare issue, SLA-breached)

## Why the AI agents are rule-based, not a live LLM

This is a **static site** with no backend — safe to host on GitHub Pages with no server and no exposed API keys. The 9 agents run deterministic logic over the mock data (real SLA math, risk scoring, bottleneck detection, readiness checks per the SOP), which is why recommendations feel intelligent without calling an external model. Swapping in a live LLM later requires a small backend (Vercel/Cloudflare function, etc.) to hold an API key — a separate step from this deployment.

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In `vite.config.ts`, `base` is already set to `'./'` (relative paths) and the app uses `HashRouter`, so it works correctly on GitHub Pages without any server-side rewrite rules — no extra config needed.
3. Easiest path — GitHub Actions:
   - Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   - Add `.github/workflows/deploy.yml`:
     ```yaml
     name: Deploy to GitHub Pages
     on:
       push:
         branches: [main]
     permissions:
       contents: read
       pages: write
       id-token: write
     jobs:
       build:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v4
           - uses: actions/setup-node@v4
             with: { node-version: 20 }
           - run: npm install
           - run: npm run build
           - uses: actions/upload-pages-artifact@v3
             with: { path: dist }
       deploy:
         needs: build
         runs-on: ubuntu-latest
         environment:
           name: github-pages
           url: ${{ steps.deployment.outputs.page_url }}
         steps:
           - id: deployment
             uses: actions/deploy-pages@v4
     ```
   - Push to `main` — it builds and deploys automatically.
4. Alternative — manual: run `npm run build`, then push the contents of `dist/` to a `gh-pages` branch (or use the `gh-pages` npm package), and set Pages source to that branch.

## Data model

`src/types/index.ts` is grounded in the actual SOP (18 stages, per-stage SLA/escalation days, RACI owners, risk scoring bands, UAT catalogue). `src/data/mockRestaurants.ts` generates the 30 mock restaurants deterministically (same seed → same data every load). To connect a real backend later, replace the imports from `src/data/mockRestaurants.ts` with API calls — the rest of the app (agents, pages, components) reads from the same `Restaurant[]` shape and doesn't need to change.
