# Rehearsal AI 🎙️💻

> **Master your coding and behavioral interviews with specialized AI panelists, real-time voice feedback, and PUBG-style rank progression.**

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Neon Postgres, Drizzle ORM, NextAuth, and Gnani Voice.

---

## 🚀 Features

- **PUBG-Style Rank Progression**: 6 rank tiers: **Bronze, Gold, Platinum, Diamond, Crown, Conqueror** with custom SVG vector badges and tailored problem pools.
- **Three Core Interview Tracks**:
  1. **Technical Round**: Monaco code editor, sandboxed execution judge (Judge0 / Piston), AI interviewer assessing approach, edge cases, and time/space complexity.
  2. **HR Behavioral Round**: 5-question STAR methodology interview with vocal assessment of communication, ownership, and clarity.
  3. **Resume Review**: ATS compatibility score out of 100, section breakdowns, actionable changes, and bullet point rewrites.
- **Voice System**: Gnani.ai STT & TTS integration with audio streaming, mute/replay controls, and fallback text input.
- **Provider-Agnostic LLM Engine**: Swappable wrapper supporting Google Gemini, OpenAI, and xAI Grok with schema validation via Zod, retries, and rate limiting.
- **Theme System**: Zero-flash dark/light theme switching powered by CSS variables and design tokens.
- **Onboarding Mascot**: Friendly AI bot guiding candidates through username selection, resume parsing (<5MB PDF), and rank ladder visualization.
- **Leaderboard & Profile**: Filterable rankings by rank tier, interview history with full feedback reports, and problem report logging.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS with CSS variable design tokens
- **Database**: PostgreSQL on Neon or Supabase Postgres with Drizzle ORM
- **Authentication**: Supabase Auth (Google OAuth + Demo bypass)
- **Product Analytics**: PostHog (`posthog-js`) + Vercel Analytics
- **Voice**: Gnani.ai STT & TTS
- **Code Execution**: Piston API (EMKC Piston Sandbox)
- **PDF Text Extraction**: `pdf-parse`

---

## 🏁 Quickstart

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd "rehearsel ai"
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Key environment variables:
- `DATABASE_URL`: Connection string for Neon Postgres
- `NEXTAUTH_SECRET`: Random 32+ character string
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `GNANI_API_KEY`, `GNANI_STT_URL`, `GNANI_TTS_URL`: Gnani Voice API
- `GEMINI_API_KEY` (or `OPENAI_API_KEY` / `GROK_API_KEY`): LLM API keys
- `JUDGE_SERVICE_URL`: Sandboxed execution endpoint (Piston / Judge0)

### 3. Run Database Migrations & Seed Problems

Generate and apply migrations to your Neon database:

```bash
# Push schema or run migration script
npm run db:push
# or
npm run db:migrate

# Seed curated problem pool into Postgres
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start practicing!

---

## 📂 Project Architecture

```
├── config/
│   ├── ranks.ts          # Rank ladder definitions & TODO placeholders
│   ├── panels.ts         # AI panelist configurations & Gnani voice IDs
│   └── problemPools.ts   # Problem topic progression & Codeforces rating ranges
├── drizzle/              # Generated SQL database migrations
├── public/
│   ├── ranks/            # 6 PUBG-style SVG rank badges
│   ├── avatars/          # AI panelist avatar SVGs
│   ├── logo.svg          # Minimal curly-braces sound wave logo
│   └── mascot.svg        # Onboarding guide character
├── src/
│   ├── app/              # Next.js App Router (Landing, Home, Interviews, Leaderboard, Profile)
│   ├── components/       # Reusable UI components (Editor, Voice, RankLadder, Navbar)
│   ├── db/               # Drizzle ORM schema & Neon client
│   ├── lib/
│   │   ├── llm/          # Provider-agnostic wrapper (Gemini, OpenAI, Grok) + Zod schemas
│   │   ├── voice/        # Gnani STT & TTS client
│   │   ├── judge/        # Sandboxed code execution
│   │   └── resume/       # PDF parsing & storage
│   └── data/             # Curated LeetCode & Codeforces seed dataset
└── scripts/
    └── seed-problems.ts  # Problem database seeder
```

---

## 👥 Credits

Made with love and tea by **Pratyaksh Tomar** and **Preet Chaudhary**.

