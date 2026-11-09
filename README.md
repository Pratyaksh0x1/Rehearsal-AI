# Rehearsal AI

Rehearsal AI is a voice-first interview practice application. Candidates can work through timed technical coding, behavioral HR, and resume-review sessions with AI interviewers, then review feedback and rank progress.

## Features

- **Technical interviews (20 minutes):** Work through a generated coding problem in the Monaco editor, discuss your approach with a voice interviewer, run visible tests, and submit against visible and hidden tests.
- **Behavioral HR interviews (10 minutes):** Practice five STAR-based behavioral questions in a voice conversation.
- **Resume review (20 minutes):** Discuss resume projects with an AI strategist and receive an ATS-style audit with concrete suggestions.
- **Voice interaction:** Gnani.ai speech-to-text and text-to-speech integration, live voice-state indicators, microphone controls, and interviewer profiles.
- **Interview proctoring:** Camera and microphone preview, screen/activity monitoring, and conduct warnings in interview workspaces. Browser permissions are required for live media.
- **Code execution:** Supports Python, JavaScript, C++, and Java in the local runner. An optional Piston-compatible service can be configured for remote execution.
- **CS concept explainer:** Ask computer science questions and receive structured explanations with diagrams on a sketchbook-style blackboard; supports multiple Indian languages.
- **Accounts and progress:** Google sign-in through Supabase Auth, onboarding, profile and resume management, technical and HR leaderboards, and six rank tiers: Bronze, Gold, Platinum, Diamond, Crown, and Conqueror.
- **Theme support:** Light and dark themes with an animated cursor effect.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page and Google sign-in |
| `/onboarding` | Initial candidate profile setup |
| `/home` | Signed-in dashboard |
| `/interview/technical` | Technical coding interview |
| `/interview/hr` | Behavioral HR interview |
| `/interview/resume` | Resume review and discussion |
| `/explainer` | CS concept explainer |
| `/leaderboard` | Rank leaderboards |
| `/profile` | Candidate profile and resume |

Most application pages require authentication. Google OAuth must be enabled and configured in the Supabase project.

## Technology

- Next.js 14 App Router, React 18, and TypeScript
- Tailwind CSS and CSS-variable-based light/dark themes
- Supabase Auth
- PostgreSQL with Drizzle ORM (Neon or Supabase PostgreSQL)
- Gemini, DeepSeek, OpenRouter, or xAI Grok through the LLM provider wrapper
- Gnani.ai voice services with Web Audio APIs
- Monaco Editor and a local code runner, with optional remote Piston execution
- PostHog analytics (optional)

## Requirements

- Node.js 20 LTS recommended
- npm
- PostgreSQL database for persistent account and interview data
- Python and Node.js available on the host for local code execution; `g++` and `javac` are additionally required to run C++ and Java locally
- Supabase project credentials and Google OAuth configuration for sign-in and protected pages
- API credentials for the AI features you want to use (see below)

## Getting started

### 1. Install

```bash
git clone https://github.com/Pratyaksh0x1/Rehearsal-AI.git
cd Rehearsal-AI
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and replace placeholders with your own values. In PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux:

```bash
cp .env.example .env
```

Configure these values:

| Variable | Required for | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Persistent database features and Drizzle commands | PostgreSQL connection string. |
| `NEXT_PUBLIC_SUPABASE_URL` | Authentication and protected application pages | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Authentication and protected application pages | Supabase publishable/anon key. |
| `LLM_PROVIDER` | Selecting the primary LLM provider | `gemini` (default), `deepseek`, `openrouter`, or `grok`. |
| `GEMINI_API_KEY` | Gemini-powered AI features | Also set `GEMINI_MODEL` if you want to override the default. |
| `DEEPSEEK_API_KEY` | DeepSeek-powered AI features | Optional provider key. |
| `OPENROUTER_API_KEY` | OpenRouter-powered AI features | Optional provider key. |
| `GROK_API_KEY` | xAI Grok-powered AI features | Optional provider key. |
| `GNANI_API_KEY` | Gnani.ai voice services | Needed for the configured Gnani STT/TTS service. |
| `JUDGE_SERVICE_URL` | Remote code execution | Optional Piston-compatible execution endpoint. If unset, the application uses its local runner. |
| `JUDGE_API_KEY` | Authenticated remote code execution | Optional key for the configured judge endpoint. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Product analytics | Optional; PostHog is not required to run the application. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Product analytics | Optional; defaults to `https://us.i.posthog.com`. |
| `NEXT_PUBLIC_APP_URL` | Absolute application metadata URLs | Optional; defaults to `http://localhost:3000`. |

The `.env.example` file includes additional optional model, voice, and endpoint settings. Never commit real credentials. Enable Google as an OAuth provider in the Supabase dashboard and configure its redirect URLs for your local and deployed application origins.

### 3. Prepare the database

For local development, apply the current Drizzle schema to the configured PostgreSQL database:

```bash
npm run db:push
```

To generate SQL migrations after changing the schema:

```bash
npm run db:generate
```

`npm run db:migrate` executes the SQL files in `drizzle/`; review the pending SQL before running it against a database. The optional `npm run seed` command generates and saves problems and requires the database and an available LLM provider.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available npm scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Start the production server after building. |
| `npm run lint` | Run Next.js linting. |
| `npx tsc --noEmit` | Type-check the project without emitting files. |
| `npm run db:generate` | Generate Drizzle SQL migrations from the schema. |
| `npm run db:push` | Push the Drizzle schema to the configured database. |
| `npm run db:migrate` | Execute SQL migration files in `drizzle/`. |
| `npm run seed` | Generate and save rank-based interview problems. |

## Project layout

```text
src/
  app/                 Next.js routes, pages, and API route handlers
  components/          Interview, editor, explainer, auth, and shared UI
  config/              Interviewer profiles, ranks, and language settings
  db/                  Drizzle database client, schema, and migration runner
  lib/                 Auth, AI/LLM, voice, judge, problems, and utilities
drizzle/               Drizzle schema migrations and metadata
public/                Static images, avatars, rank badges, and assets
scripts/               Database and problem-generation utilities
```

## Notes

- Actual AI responses require credentials for a configured LLM provider. The application includes fallback behavior when providers are unavailable; this is not a substitute for configuring a provider in production.
- Local code execution depends on the corresponding language runtime/compiler being installed on the machine running Next.js. Alternatively, configure a Piston-compatible `JUDGE_SERVICE_URL`.
- Camera and microphone features run in the browser and require the candidate to grant the relevant permissions.
- Database migrations and seed commands modify the configured database. Use a development database while setting up or testing the project.
