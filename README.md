# 🔵 Recruiter — Recruitment Management System

> A self-hosted, end-to-end hiring pipeline platform for recruiters. Post positions, collect applications, track candidates through multi-round evaluations, and give every candidate a personalised real-time status portal, all from one place.

---

## Table of Contents

- [Description](#description)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Manual Setup](#manual-setup)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
  - [Backend](#backend-appsapienv)
  - [Frontend](#frontend-appsweb-envlocal)
  - [How to Obtain Each Variable](#how-to-obtain-each-variable)
- [How It Works](#how-it-works)
  - [System Architecture](#system-architecture)
  - [Auth Flow](#auth-flow--sequence-diagram)
  - [Recruiter and Tracking Flow](#recruiter--tracking-flow--sequence-diagram)
  - [Overall System Sequence](#overall-system--sequence-diagram)
- [What Could Be Better](#what-could-be-better)
- [TODO](#todo)

---

## Description

Recruiter is a **monorepo** (pnpm workspaces) consisting of:

| App        | Tech                                        | Purpose                                        |
| ---------- | ------------------------------------------- | ---------------------------------------------- |
| `apps/api` | Node.js · Express 5 · Prisma 7 · PostgreSQL | REST API and business logic                    |
| `apps/web` | Next.js 16 · React 19 · Tailwind CSS 4      | Recruiter dashboard and candidate-facing pages |

**Key capabilities:**

- 🔐 **Google OAuth** — recruiters sign in with their Google account; no passwords stored.
- 📋 **Position management** — create, draft, open, and close job positions with custom hiring rounds.
- 📨 **Announcements** — send position-open emails to a list of recipients via SMTP.
- 📝 **Public application forms** — candidates apply directly via a shareable link; resume upload included.
- 🏆 **Multi-round evaluation pipeline** — Screening → Written Test → Practical Assessment → Final Interview.
- 🔗 **Candidate tracking portal** — every applicant gets a unique, token-secured link to check their real-time status, round results, schedules, and meeting links — without ever creating an account.

---

## Installation

### Prerequisites

| Tool       | Version          |
| ---------- | ---------------- |
| Node.js    | ≥ 20             |
| pnpm       | ≥ 10.19          |
| PostgreSQL | ≥ 15 (or Docker) |

---

### Manual Setup

**1. Clone the repository**

```bash
git clone https://github.com/your-org/recruiter.git
cd recruiter
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Configure environment variables**

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values (see Environment Variables section)

echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > apps/web/.env.local
```

**4. Set up the database and run migrations**

```bash
cd apps/api
pnpm exec prisma migrate deploy
pnpm exec prisma generate
cd ../..
```

**5. Start development servers**

```bash
# Terminal 1 — API  →  http://localhost:5000
cd apps/api && pnpm dev

# Terminal 2 — Web  →  http://localhost:3000
cd apps/web && pnpm dev
```

---

### Docker Setup

The Docker Compose stack spins up three services: **PostgreSQL**, **API**, and **Web** — all pre-wired together.

> **`DATABASE_URL` is handled automatically.**  
> `docker-compose.yml` hardcodes and injects the correct connection string pointing at the internal `postgres` container — it overrides whatever is (or isn't) in your `.env`. You **never need to set `DATABASE_URL`** when using Docker.

**1. Configure env files** _(required before first run)_

```bash
cp apps/api/.env.example apps/api/.env
# Fill in ONLY these — DATABASE_URL is NOT required for Docker:
#   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
#   EMAIL_PROVIDER, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > apps/web/.env.local
```

**2. Build and start**

```bash
docker compose up --build
```

**3. Run database migrations** _(first run only)_

```bash
docker compose exec api pnpm exec prisma migrate deploy
```

**4. Access the app**

| Service                   | URL                            |
| ------------------------- | ------------------------------ |
| Web (Recruiter Dashboard) | <http://localhost:3000>        |
| API                       | <http://localhost:5000>        |
| Health check              | <http://localhost:5000/health> |

```bash
docker compose down        # stop all containers
docker compose down -v     # stop + wipe DB volume (full reset)
```

---

## Environment Variables

### Backend (`apps/api/.env`)

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/recruiter_db?schema=public"

# Authentication (Google OAuth + session cookie)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Email — 'console' prints to terminal (dev), 'smtp' sends real emails
EMAIL_PROVIDER=smtp
EMAIL_FROM="Recruiter <recruitment@yourcompany.com>"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_smtp_app_password
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

### How to Obtain Each Variable

#### `DATABASE_URL`

Format: `postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DB_NAME>?schema=public`

- Docker(Easy): Just run docker.
- **Local**: Install PostgreSQL, create a database and user, fill in the values.
- **Hosted**: Providers like [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Railway](https://railway.app) give you a ready-made connection string from their dashboard.

#### `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**.
3. Set **Application type** to **Web application**.
4. Under **Authorised redirect URIs**, add:
   - `http://localhost:5000/auth/google/callback` ← development
   - `https://your-api-domain.com/auth/google/callback` ← production
5. Copy the **Client ID** and **Client Secret**.
6. Ensure the **OAuth consent screen** is configured with the `email` and `profile` scopes.

#### `GOOGLE_CALLBACK_URL`

Must **exactly** match a redirect URI registered in step 4 above.

- Development: `http://localhost:5000/auth/google/callback`
- Production: `https://your-api-domain.com/auth/google/callback`

#### `EMAIL_PROVIDER`

| Value     | Effect                                                                     |
| --------- | -------------------------------------------------------------------------- |
| `console` | Emails are printed to the API terminal — no real sends. Use for local dev. |
| `smtp`    | Sends real emails using the `SMTP_*` settings below.                       |

#### `SMTP_*` — Gmail App Password (recommended)

1. Enable **2-Step Verification** on your Google account.
2. Visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Create an App Password: **Mail → Other (Custom name)**.
4. Use these settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=<16-character app password>
```

For other providers (SendGrid, Mailgun, Resend), use their SMTP relay credentials from their dashboard.

#### `NEXT_PUBLIC_API_URL`

The base URL of the API **as seen from the browser** (not inside Docker):

| Environment | Value                         |
| ----------- | ----------------------------- |
| Development | `http://localhost:5000`       |
| Production  | `https://your-api-domain.com` |

---

## How It Works

### System Architecture

![System Architecture Diagram](./system_architecture.jpg)

---

### Auth Flow — Sequence Diagram

```mermaid
sequenceDiagram
    actor R as Recruiter
    participant FE as Next.js Frontend
    participant API as Express API
    participant G as Google OAuth

    R->>FE: Clicks Sign in with Google
    FE->>API: GET /auth/google
    API-->>FE: 302 Redirect to Google consent screen
    FE->>G: Browser follows redirect

    G-->>R: Shows OAuth consent screen
    R->>G: Grants permission
    G-->>API: GET /auth/google/callback?code=...

    API->>G: POST /token to exchange auth code
    G-->>API: access_token
    API->>G: GET /userinfo with Bearer access_token
    G-->>API: email, name, picture, verified_email

    API->>API: prisma.user.upsert - create or update record
    API-->>FE: Set-Cookie recruiter_uid=userId HttpOnly then 302 to /recruiter/dashboard

    FE->>API: GET /auth/me - cookie sent automatically
    API->>API: requireAuth middleware looks up user by cookie userId
    API-->>FE: user id, name, email, role
    FE-->>R: Dashboard fully rendered
```

---

### Overall System — Sequence Diagram

```mermaid
sequenceDiagram
    actor R as Recruiter
    actor C as Candidate
    participant FE as Next.js
    participant API as Express API
    participant DB as PostgreSQL
    participant Google as Google OAuth
    participant Mail as SMTP Server

    R->>FE: Visit /login
    FE->>API: GET /auth/google
    API->>Google: Redirect OAuth consent
    Google-->>API: Callback with auth code
    API->>Google: Exchange code for access_token
    API->>Google: Fetch user profile
    API->>DB: Upsert User record
    API-->>FE: HttpOnly cookie set and redirect to dashboard

    R->>FE: Create and configure position with rounds
    FE->>API: POST /positions
    API->>DB: INSERT Position and HiringRounds
    API-->>FE: Position created

    R->>FE: Announce position with email list
    FE->>API: POST /positions/:id/announce
    API->>Mail: Send bulk announcement email
    Mail-->>C: Position open announcement email

    C->>FE: GET /apply/:positionId via link in email
    FE->>API: GET /apply/:positionId
    API->>DB: SELECT Position
    API-->>FE: Position info
    FE-->>C: Renders application form

    C->>FE: Submit form and upload resume
    FE->>API: POST /apply/:positionId
    API->>DB: Upsert Candidate and Create Application with RoundParticipation Round 1 PENDING
    API-->>FE: trackingToken
    FE-->>C: Tracking token shown to candidate

    R->>FE: View candidates list for position
    FE->>API: GET /candidates
    API->>DB: SELECT Applications and Candidates
    API-->>FE: Candidate list

    R->>FE: Evaluate candidate - Pass Round 1
    FE->>API: POST /applications/:id/evaluate decision PASS
    API->>DB: RoundParticipation 1 to PASSED and RoundParticipation 2 to PENDING
    API-->>FE: Updated application

    R->>FE: Schedule Round 2 and publish for candidate
    FE->>API: PATCH /applications/:id/rounds/:roundId/schedule
    API->>DB: Update RoundParticipation scheduledAt and isPublished true

    C->>FE: GET /track/:token
    FE->>API: GET /track/:token
    API->>DB: Fetch application and sanitize per candidate
    API-->>FE: Round 2 details now visible
    FE-->>C: Shows test date, syllabus, and venue

    C->>FE: Submit assessment response
    FE->>API: POST /track/:token/rounds/:roundId/submit
    API->>DB: RoundParticipation to IN_PROGRESS with submissionData
    API-->>FE: Submission confirmed

    R->>FE: Evaluate final round - Pass
    FE->>API: POST /applications/:id/evaluate decision PASS on last round
    API->>DB: Final RoundParticipation to PASSED and Application.status to HIRED
    API-->>FE: Candidate HIRED

    C->>FE: GET /track/:token
    FE-->>C: Status HIRED - all rounds completed
```

---

## What Could Be Better

### Authentication security

Right now, Auth relies on a cookie carrying the raw `userId` with no JWT signature or expiry.

A better approach would be to use JWT based session management with expiry and refresh token.

### Role management

Currently Admin, Recruiter access is not distinguished.

I have only focused on Recruiter opens the role and manage hiring process while candidate apply for it as MVP.

### AI scoring is schema-only

Implementation of AI based scoring and ranking during Resume Screening round.

### Local disk resume storage

Uploaded resumes go to `apps/api/uploads/`.

It does not lie behind authentication, so that could be a major flaw.

A better approach will be implementation of authentication for both candidates and recruiter.

---

## TODO

- [ ] **Candidate status change email notifications** — notify on hire or rejection automatically
- [ ] **Signed session cookies with expiry** — replace the plain `userId` cookie with a signed, time-limited token
- [ ] **AI resume evaluation** — wire `aiScore` / `aiEvaluation` to an LLM or embedding-based ranking pipeline
- [ ] **Cloud resume storage** — replace local disk with S3-compatible storage (AWS S3, Cloudflare R2, Supabase Storage)
- [ ] **Multi-recruiter collaboration** — allow multiple recruiters to co-manage a position
