# 14PointPitch

A multiplayer implementation of our house variant of 14 point pitch, for four
players. No fixed teams — teammates are determined each round by who holds
the trump Ace and trump 2, and nobody is told who they are; you have to
figure it out from how people play.

## Stack

- **shared/** — game rules and types (deck, dealing, bidding, trick
  resolution, scoring), plain TypeScript with no AWS dependency. This is the
  part worth reading first if you want to understand the rules as code —
  see `shared/src/engine/`.
- **backend/** — AWS SAM app: DynamoDB (games, players, live connections),
  an HTTP API (create/look up a game, stats/leaderboard) and a WebSocket API
  (live gameplay — bidding, choosing trump, playing cards), all Lambda +
  TypeScript. No login system — a game has a join code, and your name is
  your identity within that game (re-enter it to reconnect).
- **frontend/** — React + Vite + MUI, deployed as a static site behind
  CloudFront (private S3 bucket, Origin Access Control).
- **.github/workflows/** — GitHub Actions: push to `main` deploys the
  backend SAM stack, then the frontend SAM stack, baking the backend's API
  URLs into the frontend build.

## Local development

```
npm install
npm run build:shared
npm run dev:frontend      # http://localhost:5173
```

The frontend needs `frontend/.env` (or `.env.local`) with:

```
VITE_API_BASE_URL=https://<http-api-id>.execute-api.<region>.amazonaws.com
VITE_WS_URL=wss://<websocket-api-id>.execute-api.<region>.amazonaws.com/prod
```

pointing at a deployed backend stack — there's no local API emulation set up.

## Deploying

Deploys run via GitHub Actions on push to `main` (see `.github/workflows/`).
Requires `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` repo secrets with
permission to deploy the SAM stacks (Lambda, API Gateway, DynamoDB, S3,
CloudFront, IAM).

To deploy by hand: `sam build && sam deploy` from `backend/`, then the same
from `frontend/` (after writing `frontend/.env.production` with that
backend's stack outputs and running `npm run build:frontend`).
