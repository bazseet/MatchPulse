# MatchPulse AI

**MatchPulse AI** is a synthetic football match intelligence demo built for the Microsoft Inside the Game developer hackathon. It simulates a match from a reproducible seed, compares generated performance metrics, and presents evidence-linked tactical findings for fans, analysts, or broadcasters.

> **Data notice:** all match events and metrics in this build are synthetic. They are not official Premier League results, tracking data, or statistics.

## Current capabilities

- React + Vite + TypeScript dashboard with responsive layouts.
- Express + TypeScript API with Zod request validation.
- Seeded match simulation so the same seed reproduces the same generated events and metrics.
- Match scoreline, possession, shots, expected-goals estimate, pass completion, and an event timeline.
- Tactical insight cards with evidence and an explicit caution about what the synthetic metrics can and cannot establish.
- Audience-specific recap generation for fans, analysts, and broadcasters, with a deterministic fallback.
- Health endpoint and server-side environment validation.

## Architecture

```text
React + Vite dashboard
        │  /api/health and POST /api/matches/simulate
        ▼
Express + TypeScript API
        ├── Zod input validation
        ├── Seeded synthetic event / metric generator
        ├── Evidence-linked deterministic insight rules
        └── Audience-specific recap templates
```

### Microsoft Foundry status

Microsoft Foundry integration is implemented as an **optional server-side provider adapter** using an OpenAI-compatible Chat Completions endpoint. When configured, the API sends only the synthetic match payload and asks the deployed model to produce a cautious, evidence-grounded recap. When credentials are absent or the model call fails, the API returns the deterministic template recap. The UI labels which path produced the recap. The integration is code-complete but remains **unverified against a live Azure deployment until you supply a deployed endpoint, key, and model/deployment name**.

## Requirements

- Node.js 22 LTS or newer
- npm 10 or newer
- Git

## Install on Windows PowerShell

From the `MatchPulse` project root:

```powershell
npm install
Copy-Item server/.env.example server/.env
```

If `server/.env` already exists, do not overwrite it. It contains local development settings only and must not be committed.

## Run locally

Open two PowerShell terminals at the project root.

**Terminal 1 — API**

```powershell
npm run dev:server
```

**Terminal 2 — frontend**

```powershell
npm run dev:client
```

Open <http://localhost:5173>.

API endpoints:

- `GET http://localhost:4000/api/health`
- `POST http://localhost:4000/api/matches/simulate`

Example request body:

```json
{
  "homeTeam": "Northbridge FC",
  "awayTeam": "Harbour City",
  "seed": 42,
  "audience": "fan"
}
```

`audience` accepts `fan`, `analyst`, or `broadcast`.

## Checks

```powershell
npm run typecheck
npm run build
Invoke-RestMethod http://localhost:4000/api/health
```

The typecheck passes in the packaged source. Build verification should be repeated after a clean `npm install` on the target machine because `node_modules` is intentionally excluded from the deliverable.

## Hackathon priorities still outstanding

1. Configure and verify the optional Microsoft Foundry provider against a real deployed model.
2. Add automated tests for seeded determinism, score/stat consistency, input validation, and API failure paths.
3. Improve the simulation model and label approximations clearly; current xG is illustrative, not calibrated to a real event dataset.
4. Deploy the application and confirm environment variables, CORS, and production health checks.
5. Record a public demo video under two minutes and prepare a public GitHub repository plus project pitch.

See [`HACKATHON_READINESS.md`](./HACKATHON_READINESS.md) for the code audit, rubric scorecard, risks, and prioritized execution plan.
