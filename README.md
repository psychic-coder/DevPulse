<div align="center">

# 🔮 DevPulse

### The AI-powered developer intelligence platform

**Track your GitHub activity, understand your coding patterns, and discover the perfect open-source project to contribute to — all in one place.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)

</div>

---

## 📖 Table of Contents

- [What is DevPulse?](#-what-is-devpulse)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [OS Finder — Deep Dive](#-os-finder--deep-dive)
- [AI Features](#-ai-features)
- [Database Schema](#-database-schema)

---

## 🤔 What is DevPulse?

DevPulse is a full-stack developer intelligence platform that connects to your GitHub account and gives you deep insights about your own engineering activity. Beyond analytics, it features **OS Finder** — an AI-powered open-source contribution discovery engine that understands your actual skill level, language preferences, and experience to surface perfectly-matched repositories for you to contribute to.

Think of it as your personal developer co-pilot: it knows what you write, how often you write it, and what open-source projects would be a realistic, rewarding next step for your growth.

---

## ✨ Features

### 📊 GitHub Activity Dashboard
- Syncs your entire GitHub history — repositories, commits, and pull requests
- Visual commit heatmap and streak tracker
- Language distribution charts and coding pattern analysis
- Commit frequency by day-of-week and hour-of-day breakdowns
- Live sync status via **WebSocket** (Socket.IO)

### 🧠 AI Weekly Digest
- Every week, an AI generates a personalised markdown digest of your coding activity
- Highlights what you built, patterns in your workflow, and what to focus on next
- Backed by OpenRouter (GPT-4o-mini) with a friendly, senior-dev tone

### ⭐ PR Quality Scoring
- Every pull request you make is automatically scored **1–10** by AI
- The score is based on title clarity, body completeness, and professionalism
- Score and reason are stored and surfaced in your dashboard

### 🔍 OS Finder — Open Source Discovery Engine
- Describe what you want to contribute to in plain English, or use advanced filters
- AI parses your query into structured GitHub search filters
- Repos are ranked by a custom **NCF (New Contributor Friendliness) Score**
- Filters include: language, difficulty, domain, repo size, license, activity recency
- Watchlist system to save, track, and annotate repos you're planning to contribute to

### 📝 Community Posts
- Create, edit, and delete developer posts with comments
- Markdown-style content support

### 🔐 Authentication
- GitHub OAuth 2.0 via Passport.js
- JWT access tokens (15 min) + refresh tokens (7 days)
- Silent refresh on token expiry — no repeated logins

### ⚡ Real-time Updates
- WebSocket gateway (Socket.IO) for live sync progress events

---

## 🏗 Architecture

DevPulse is a **monorepo** with three independent services orchestrated via Docker Compose:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Compose                          │
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │   Frontend  │───▶│   Backend    │───▶│    Analytics      │  │
│  │  (Next.js)  │    │  (NestJS)    │    │   (Flask/Python)  │  │
│  │  Port 3001  │    │  Port 3000   │    │   Port 5001       │  │
│  └─────────────┘    └──────┬───────┘    └───────────────────┘  │
│                            │                                    │
│                    ┌───────┴────────┐                           │
│                    │               │                            │
│             ┌──────▼──────┐ ┌──────▼──────┐                   │
│             │  PostgreSQL  │ │    Redis    │                   │
│             │  Port 5433  │ │  Port 6379  │                   │
│             └─────────────┘ └─────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

**Communication:**
- **Frontend → Backend**: HTTP rewrites via Next.js proxy + custom API routes for long-running AI calls
- **Backend → Analytics**: Internal HTTP (service URL via env)
- **Backend → GitHub**: REST API v3 with encrypted token storage per user
- **Backend → OpenRouter**: AI completions for digests, PR scoring, and OS Finder queries
- **Backend ↔ Frontend**: WebSocket (Socket.IO) for real-time sync events

---

## 🛠 Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| **Next.js 14** | React framework, SSR pages, API routes |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Page and component animations |
| **Socket.IO Client** | Real-time sync progress |

### Backend
| Tool | Purpose |
|------|---------|
| **NestJS 11** | Modular Node.js framework |
| **TypeScript** | Type safety |
| **TypeORM** | ORM + migrations |
| **PostgreSQL** | Primary database |
| **Redis (ioredis)** | Caching layer (search results, saved repos, issues) |
| **Passport.js** | GitHub OAuth + JWT strategy |
| **Socket.IO** | Real-time WebSocket gateway |
| **OpenRouter API** | AI inference (GPT-4o-mini) |
| **node-cron** | Scheduled jobs (GitHub sync every 6h, weekly digests) |
| **class-validator** | DTO validation |
| **crypto-js** | Encrypted GitHub token storage |

### Analytics Microservice
| Tool | Purpose |
|------|---------|
| **Python 3 / Flask** | Lightweight HTTP microservice |
| **Custom analysers** | Commit pattern & language distribution analysis |

### Infrastructure
| Tool | Purpose |
|------|---------|
| **Docker + Docker Compose** | Containerised dev and production environment |
| **PostgreSQL 15** | Relational data store |
| **Redis 7** | Caching and rate-limit protection |

---

## 📂 Project Structure

```
DevPulse/
├── docker-compose.yml              # Orchestrates all services
├── apps/
│   ├── backend/                    # NestJS API server
│   │   ├── src/
│   │   │   ├── auth/               # GitHub OAuth + JWT (Passport)
│   │   │   ├── users/              # User entity and profile
│   │   │   ├── github/             # GitHub API client
│   │   │   ├── github-sync/        # Sync engine (repos, commits, PRs) + cron
│   │   │   │   └── pr-score.service.ts   # AI PR quality scoring
│   │   │   ├── os-finder/          # 🔍 Open Source Discovery Engine
│   │   │   │   ├── os-finder.service.ts        # Core search logic
│   │   │   │   ├── ai-query-builder.service.ts # NL → filters via AI
│   │   │   │   ├── github-query-builder.ts     # Filter → GitHub query string
│   │   │   │   ├── ncf-scorer.service.ts       # NCF Score computation
│   │   │   │   ├── repo-health.service.ts      # Repository health flags
│   │   │   │   ├── os-finder-cache.service.ts  # Redis cache layer
│   │   │   │   └── entities/                   # SavedRepo, OsFinderSearch
│   │   │   ├── digests/            # AI weekly digest generation + cron
│   │   │   ├── posts/              # Community posts
│   │   │   ├── comments/           # Post comments
│   │   │   ├── analytics/          # Analytics microservice bridge
│   │   │   ├── realtime/           # Socket.IO WebSocket gateway
│   │   │   ├── shared/
│   │   │   │   └── ai.service.ts   # OpenRouter AI client (shared)
│   │   │   ├── common/             # Guards, decorators, cache module, utils
│   │   │   └── database/
│   │   │       └── migrations/     # 10 TypeORM migration files
│   │   └── packages/
│   │       └── shared-types/       # Shared TypeScript interfaces (OS Finder)
│   │
│   ├── frontend/                   # Next.js 14 app
│   │   ├── pages/
│   │   │   ├── index.tsx           # Landing page
│   │   │   ├── api/
│   │   │   │   └── os-finder-ai-search.ts  # Long-running AI proxy route
│   │   │   ├── auth/callback.tsx   # OAuth callback handler
│   │   │   └── dashboard/
│   │   │       ├── index.tsx       # Main dashboard
│   │   │       ├── commits.tsx     # Commit analytics
│   │   │       ├── prs.tsx         # Pull request history + scores
│   │   │       ├── digest.tsx      # Weekly AI digest viewer
│   │   │       ├── settings.tsx    # User settings
│   │   │       └── os-finder/
│   │   │           ├── index.tsx           # OS Finder search UI
│   │   │           ├── saved.tsx           # Watchlist manager
│   │   │           └── [owner]/[repo].tsx  # Repo detail + issues
│   │   ├── components/             # Reusable UI components
│   │   ├── context/AuthContext.tsx # Auth state + fetchWithAuth
│   │   ├── hooks/                  # Custom React hooks
│   │   └── next.config.js          # Proxy rewrites to backend
│   │
│   └── analytics/                  # Python Flask microservice
│       ├── app.py                  # Commit + language analysis endpoints
│       └── services/               # CommitAnalyser, LanguageAnalyser
│
└── load-tests/                     # Load testing scripts
```

---

## 🚀 Local Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Node.js 20+](https://nodejs.org/) *(only needed for local non-Docker dev)*
- A GitHub OAuth App (for auth)
- An [OpenRouter](https://openrouter.ai/) API key (for AI features)

### 1. Clone the Repository

```bash
git clone https://github.com/psychic-coder/DevPulse.git
cd DevPulse
```

### 2. Configure Environment Variables

Copy and fill in the backend environment file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` — see the [Environment Variables](#-environment-variables) section below for all required values.

### 3. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set:
   - **Homepage URL**: `http://localhost:3001`
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
4. Copy the **Client ID** and **Client Secret** into your `.env`

### 4. Start with Docker Compose

```bash
# Build and start all services (first time takes a few minutes)
docker compose up --build

# Or run in background
docker compose up --build -d
```

This starts:
| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3001 |
| **Backend API** | http://localhost:3000 |
| **Analytics** | http://localhost:5001 |
| **PostgreSQL** | localhost:5433 |
| **Redis** | localhost:6379 |

> **Note:** Database migrations run automatically on backend startup via TypeORM `migrationsRun: true`.

### 5. Trigger a GitHub Sync

After logging in via GitHub OAuth, your data won't appear until you trigger a sync:

```bash
# Via the dashboard Settings page → "Sync GitHub Data" button
# Or via API:
curl -X POST http://localhost:3000/sync/github \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔑 Environment Variables

All variables go in `apps/backend/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | `development` \| `production` \| `test` |
| `PORT` | ✅ | Backend port (default: `3000`) |
| `APP_URL` | ✅ | Frontend URL (e.g. `http://localhost:3001`) |
| `BACKEND_URL` | ✅ | Backend URL (e.g. `http://localhost:3000`) |
| `GITHUB_CLIENT_ID` | ✅ | From your GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | ✅ | From your GitHub OAuth App |
| `GITHUB_CALLBACK_URL` | ✅ | e.g. `http://localhost:3000/auth/github/callback` |
| `JWT_SECRET` | ✅ | Min 32-char random string |
| `JWT_EXPIRY` | ✅ | Access token lifetime (e.g. `15m`) |
| `JWT_REFRESH_SECRET` | ✅ | Min 32-char random string |
| `JWT_REFRESH_EXPIRY` | ✅ | Refresh token lifetime (e.g. `7d`) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `ENCRYPTION_SECRET` | ✅ | Min 32-char string — encrypts stored GitHub tokens |
| `REDIS_URL` | ⬜ | Redis connection URL (defaults to no cache) |
| `OPENROUTER_API_KEY` | ⬜ | For AI features (digest, PR scoring, OS Finder AI search) |
| `OPENROUTER_MODEL` | ⬜ | Model name (default: `gpt-4o-mini`) |
| `ANALYTICS_SERVICE_URL` | ⬜ | Python analytics service (default: `http://localhost:5001`) |
| `DATABASE_SYNCHRONIZE` | ⬜ | `true` for auto-sync schema in dev (use migrations in prod) |

> **Tip:** Generate secrets with: `openssl rand -hex 32`

---

## 📡 API Overview

All API routes are prefixed by the backend base URL and require a JWT `Authorization: Bearer <token>` header unless noted.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/github` | Initiate GitHub OAuth flow |
| `GET` | `/auth/github/callback` | OAuth callback (redirects with JWT) |
| `POST` | `/auth/refresh` | Exchange refresh token for new access token |
| `GET` | `/auth/session` | Validate current session |

### GitHub Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/sync/github` | Trigger full GitHub data sync for current user |
| `GET` | `/sync/github` | Get current sync status |
| `GET` | `/sync/github/streaks` | Get commit streak data |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/me` | Get full analytics for current user |

### Digests
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/digests/me` | Get weekly AI digest for current user |

### OS Finder
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/os-finder/search` | Standard filtered repository search |
| `POST` | `/os-finder/search/ai` | AI-powered natural language search |
| `GET` | `/os-finder/repo/:owner/:repo` | Detailed repo info + NCF score + health |
| `GET` | `/os-finder/repo/:owner/:repo/issues` | Beginner-friendly open issues |
| `POST` | `/os-finder/saved` | Save a repo to your watchlist |
| `GET` | `/os-finder/saved` | Get your watchlist |
| `PATCH` | `/os-finder/saved/:id` | Update notes/status on a saved repo |
| `DELETE` | `/os-finder/saved/:id` | Remove from watchlist |
| `GET` | `/os-finder/history` | View past searches |

### Posts & Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/posts` | List all posts |
| `POST` | `/posts` | Create a post |
| `GET/PUT/DELETE` | `/posts/:id` | Read, update, or delete a post |
| `GET/POST` | `/posts/:id/comments` | List or add comments |

---

## 🔍 OS Finder — Deep Dive

OS Finder is the flagship feature of DevPulse. It is a personalised open-source repository discovery engine built on top of the GitHub Search API, enhanced with AI and user profile data.

### How It Works

```
User Query / Filters
        │
        ▼
┌───────────────────┐
│  AI Query Builder  │  ← Converts NL query to structured OsFinderFilters
│  (GPT-4o-mini)    │     using user's language profile + experience level
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ GitHub Query      │  ← Builds valid GitHub Search API query string
│ Builder           │     (handles multi-language splitting, text OR-terms)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ GitHub Search API │  ← Parallel queries per language (max 3), merged
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Health + NCF      │  ← Per-repo staggered parallel analysis (50ms stagger)
│ Processing        │     Repo health flags + contributor-friendliness score
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Ranking + Cache   │  ← Sort by NCF × langMatchScore, cache in Redis 30min
└────────┬──────────┘
         │
         ▼
      Results
```

### NCF Score (New Contributor Friendliness)

Each repo is scored out of 10 based on:

| Signal | Weight | What it measures |
|--------|--------|-----------------|
| Good First Issues | 2.5 | Volume of beginner-labelled issues |
| Help Wanted Issues | 1.0 | Active maintainer requests for contribution |
| CONTRIBUTING.md | 1.5 | Has a contributing guide |
| Issue Response Time | 2.0 | How fast maintainers respond to new issues |
| New Contributor PRs | 1.5 | Historical rate of first-time contributor merges |
| README Quality | 0.5 | Presence and length of README |
| Code of Conduct | 0.5 | Has a CoC file |
| PR Merge Rate | 0.5 | Overall PR acceptance rate |

### Repository Health Flags

Each result includes boolean health flags:
- `isArchived` — repo is read-only
- `isStale` — no commits in 90+ days
- `noContributing` — missing CONTRIBUTING.md
- `noReadme` — missing README
- `lowPRMergeRate` — < 30% PRs merged
- `forkHeavy` — more forks than stars (sign of dead project)
- `noExternalContribs` — only the owner has committed
- `lowIssueEngagement` — very few issues
- `slowMaintainerResp` — maintainer takes 14+ days to respond

### Filter Options

| Filter | Type | Description |
|--------|------|-------------|
| `languages` | `string[]` | Programming languages (auto-detected from your DevPulse profile) |
| `languageMode` | `strict \| any_of` | Match all languages or any |
| `difficulty` | `beginner \| intermediate \| advanced` | Auto-inferred from your commit history |
| `contributionTypes` | `string[]` | bug_fix, feature, docs, tests, i18n, etc. |
| `domains` | `string[]` | web, devtools, ai_ml, mobile, data, infra, etc. |
| `repoSize` | `small \| medium \| large \| any` | By star count ranges |
| `lastCommitDays` | `number` | Max days since last commit |
| `minOpenIssues` | `number` | Minimum open issue count |
| `hasContributing` | `boolean` | Must have CONTRIBUTING.md |
| `hasCodeOfConduct` | `boolean` | Must have CODE_OF_CONDUCT.md |
| `licenseTypes` | `string[]` | e.g. `['MIT', 'Apache-2.0']` |
| `prMergeRate` | `number` | Minimum % of PRs merged |

---

## 🤖 AI Features

DevPulse uses **OpenRouter** (compatible with OpenAI API) to power three distinct AI use cases:

### 1. Weekly Digest Generation
- Runs weekly via `node-cron`
- Analyses commits, PRs, streaks, and language usage from the past 7 days
- Writes a friendly, structured markdown digest with sections: Week in Review, What You Crushed, Patterns Noticed, Focus Suggestion

### 2. PR Quality Scoring
- Runs automatically after each GitHub sync
- Scores each PR 1–10 based on title, body, and professionalism
- Stored alongside the PR record for display in the dashboard

### 3. OS Finder AI Query Builder
- Natural language → structured `OsFinderFilters` JSON
- Uses your DevPulse profile (top languages, experience level, average PR score) as context
- Falls back gracefully to keyword-based regex matching if the AI call fails or times out (15s timeout)
- The resulting query is split per language to work within GitHub Search API limitations

---

## 🗄 Database Schema

DevPulse uses **PostgreSQL** with TypeORM migrations. Key tables:

| Table | Description |
|-------|-------------|
| `users` | GitHub user profile + encrypted token |
| `repositories` | Synced GitHub repos |
| `commits` | Commit history with additions/deletions |
| `pull_requests` | PRs with AI quality scores |
| `posts` | Community posts |
| `comments` | Comments on posts |
| `digests` | Weekly AI digest records |
| `saved_repos` | OS Finder watchlist (stores full NCF score as `jsonb`) |
| `os_finder_searches` | Search history with filters applied |

---

## 🤝 Contributing

1. Fork the repo and create a feature branch from `main`
2. Follow the existing module structure for backend features
3. All new backend routes should use the `@UseGuards(JwtAuthGuard)` and `@CurrentUser()` decorator pattern
4. Run `npm run lint` and `npm run test` in `apps/backend` before submitting a PR
5. Open a PR with a clear title and description — DevPulse will score it 😄

---

<div align="center">

Built with ❤️ by [psychic-coder](https://github.com/psychic-coder)

</div>
