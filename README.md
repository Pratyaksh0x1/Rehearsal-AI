<div align="center">

# 🎙️ Rehearsal AI

**AI-Powered Mock Interview Platform for Engineering Students**

</div>

## Built for the Great Indian AI Internship Challenge (Gnani AI)

Rehearsal AI is an interview-practice platform for technical coding, behavioral HR, and resume reviews, with a CS concept explainer. It uses Gnani for speech-to-text and text-to-speech so interview voice interactions can use its speech services and configured voices.


Demo

🎥 Watch the Rehearsal AI Demo on YouTube

## How we use Gnani AI

### Prisma speech-to-text

By default, the server calls `POST https://api.vachana.ai/stt/v3` (the STT v3 endpoint). It sends the audio, `GNANI_LANGUAGE` by default (or a language supplied to the API route), and verbatim format. The client also sends a JSON `bias_list` of technical terms such as `hashmap`, `dijkstra`, and `memoization`, with `bias_score` set to `1.0`; the Gnani client comments identify these as words Prisma v2.5 tends to miss in coding interviews.

### Timbre text-to-speech

By default, the TTS endpoint is `POST https://api.vachana.ai/api/v1/tts/inference`. The current interview panel and Concept Explainer configurations use `timbre-v2.5`. Each interview panelist selects a voice and model in `src/config/panels.ts`; each Concept Explainer language selects a `voiceName` and model in `src/config/languages.ts`. In the interview `VoicePanel`, streamed LLM output is split at sentence boundaries, sent to TTS in queued chunks (normally up to 260 characters), and played while the next sentence is synthesized.

The Concept Explainer supports **10 configured languages**. It uses browser speech recognition for microphone input, then requests Gnani TTS for the spoken reply (with browser speech synthesis as a fallback).

### Where to look in the code

| File | What it does |
|------|--------------|
| `src/lib/voice/gnani.ts` | Configures Gnani endpoints, sends Prisma and Timbre requests, and applies the STT technical-vocabulary bias list. |
| `src/app/api/voice/stt/route.ts` | Authenticated API route that receives audio and calls speech-to-text. |
| `src/app/api/voice/tts/route.ts` | Authenticated API route that validates and synthesizes speech. |
| `src/components/voice/VoicePanel.tsx` | Captures interview audio, streams interviewer replies, and queues sentence audio for playback. |
| `src/app/api/explainer/chat/route.ts` | Generates the localized Concept Explainer response using the configured language. |
| `src/components/explainer/ExplainerVoicePanel.tsx` | Handles Concept Explainer voice input and spoken replies, including the browser speech fallback. |
| `src/config/panels.ts` | Assigns a configured voice and TTS model to each interview panelist. |
| `src/config/languages.ts` | Defines the Concept Explainer languages, Gnani language codes, voices, and models. |
| `.env.example` | Documents the Gnani API key and optional endpoint, language, voice, and model settings. |

Interview voice flow:

```text
Mic → Gnani Prisma (STT) → LLM → Gnani Timbre (TTS) → Speaker
```

The diagram describes the interview voice flow; the Concept Explainer uses browser speech recognition for microphone input.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)

</div>

Practice technical coding, behavioral HR, and resume review interviews with realistic AI interviewers — complete with voice conversation, live code execution, proctoring, and detailed performance reports.

---

## ✨ Features

### 🖥️ Interview Modes

| Mode | Duration | What happens |
|------|----------|-------------|
| **Technical Coding** | 20 min | Solve an LLM-generated coding problem in the Monaco editor while discussing your approach with a voice AI interviewer. Run visible tests and submit against hidden ones. |
| **Behavioral HR** | 10 min | Practice 5 STAR-based behavioral questions in a natural voice conversation with an AI HR interviewer. |
| **Resume Review** | 20 min | Discuss your resume projects with an AI career strategist and receive an ATS-style audit with concrete improvement suggestions. |

### 🤖 AI & Voice

- **Multi-Model LLM Engine** — Gemini (primary), with automatic failover to DeepSeek, OpenRouter, and Grok
- **Voice Conversation** — Gnani.ai STT + TTS integration with live voice-state indicators, mic controls, and animated interviewer avatars
- **Verified Problem Bank** — Pre-generated problems are selected instantly during technical interviews, with verified live generation as a fallback
- **Smart Evaluation** — Detailed post-interview reports with category-wise scoring, strengths/weaknesses analysis, and suggested optimal approaches

### 📚 CS Concept Explainer

- Ask any computer science question and get structured explanations on a sketchbook-style interactive blackboard
- Mermaid architecture diagrams, code snippets, and key takeaways
- Supports multiple Indian languages (Hindi, Tamil, Telugu, etc.)
- Voice-powered Q&A with a professor persona

### 🛡️ Interview Proctoring

- Camera and microphone preview during live sessions
- Tab-switch and screen-change detection
- Copy-paste monitoring in the code editor
- Profanity filtering on voice input
- Conduct warning banner with strike system

### 🏆 Gamification & Progress

- **6 Rank Tiers**: Bronze → Gold → Platinum → Diamond → Crown → Conqueror
- **Leaderboards**: Compete with other candidates on points
- **Profile Dashboard**: Track interviews given, problems solved, rank progress
- **Review System**: Rate and review your interview experience (⭐ 1-5)

### 🎨 Design

- Light and dark theme with CSS-variable-based design system
- Animated splash cursor effect
- Responsive layout for desktop and tablet
- Custom interviewer avatar profiles (Arjun, Kaveri, Meera, Pranav, and more)

---

## 🗺️ Application Routes

| Route | Purpose | Auth Required |
|-------|---------|:---:|
| `/` | Landing page with Google sign-in | ❌ |
| `/onboarding` | Initial candidate profile setup | ✅ |
| `/home` | Dashboard — stats, leaderboard, quick-start | ✅ |
| `/interview/technical` | Technical coding interview | ✅ |
| `/interview/hr` | Behavioral HR interview | ✅ |
| `/interview/resume` | Resume review & roast | ✅ |
| `/explainer` | CS concept explainer blackboard | ✅ |
| `/leaderboard` | Global rank leaderboards | ✅ |
| `/profile` | Profile, resume, interview history | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS 3.4, CSS variables (light/dark themes) |
| **Authentication** | Supabase Auth (Google OAuth) |
| **Database** | PostgreSQL on Neon, Drizzle ORM |
| **AI / LLM** | Gemini, DeepSeek, OpenRouter, xAI Grok (multi-provider with failover) |
| **Voice** | Gnani.ai STT + TTS (Indian English voice models, Timbre v2.5) |
| **Code Editor** | Monaco Editor (VS Code engine) |
| **Code Execution** | Local code runner (Python, JS, C++, Java) + optional Piston remote |
| **UI Components** | Radix UI primitives, Lucide icons, Sonner toasts |
| **Charts** | Custom SVG radar charts, canvas-confetti celebrations |
| **Analytics** | PostHog (optional), Vercel Analytics |
| **Diagrams** | Mermaid.js for CS concept visualization |

---

## 📋 Prerequisites

- **Node.js** 20 LTS or later
- **npm** (comes with Node.js)
- **PostgreSQL** database (Neon recommended, or Supabase Postgres)
- **Supabase** project with Google OAuth enabled
- **Language runtimes** for code execution:
  - Python 3.x and Node.js — required
  - `g++` (C++) and `javac` (Java) — optional, for C++/Java support
- **API keys** for at least one LLM provider (Gemini recommended)
- **Gnani.ai API key** for voice features

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Pratyaksh0x1/Rehearsal-AI.git
cd Rehearsal-AI
npm install
```

### 2. Configure Environment Variables

```bash
# macOS/Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Open `.env` and fill in your credentials:

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `LLM_PROVIDER` | ✅ | Primary LLM: `groq` \| `grok` \| `gemini` \| `deepseek` \| `openrouter` |
| `GEMINI_API_KEY` | ✅* | Google Gemini API key |
| `DEEPSEEK_API_KEY` | ⬜ | DeepSeek API key (fallback) |
| `OPENROUTER_API_KEY` | ⬜ | OpenRouter API key (fallback) |
| `GROQ_API_KEY` | ⬜ | Groq API key |
| `GROQ_MODEL` | ⬜ | Groq model (defaults to `openai/gpt-oss-120b`) |
| `GROK_API_KEY` | ⬜ | xAI Grok API key (fallback) |
| `GNANI_API_KEY` | ✅ | Gnani.ai voice services key |
| `JUDGE_SERVICE_URL` | ⬜ | Remote Piston execution endpoint |
| `NEXT_PUBLIC_POSTHOG_KEY` | ⬜ | PostHog analytics key |

> *At least one LLM provider key is required. Groq is the configured primary provider.

### 3. Set Up the Database

```bash
# Push the Drizzle schema to your database
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check without emitting |
| `npm run db:generate` | Generate Drizzle SQL migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run pending SQL migrations |
| `npm run seed:problem-bank` | Verify and save 50 curated problems across rank/topic combinations |
| `npm run seed:problem-bank:llm` | Generate and verify 72 problems with the configured LLM provider |

Run `npm run db:migrate` before seeding. Set `PROBLEM_BANK_SIZE` to an integer from 50 to 100 to change the number of curated problems. The separate `:llm` command calls the configured LLM provider. Only problems whose reference solutions pass all five expected-output checks are saved. The technical interview page starts fetching a problem as soon as it loads, so the lobby and greeting happen while it is being prepared.

---

## 📁 Project Structure

```
rehearsal-ai/
├── public/                    # Static assets
│   ├── avatars/               # AI interviewer avatar images
│   ├── ranks/                 # Rank tier badge SVGs (Bronze → Conqueror)
│   ├── logo.svg               # App logo
│   └── mascot.svg             # Mascot illustration
├── scripts/                   # DB migration & utility scripts
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Route Handlers
│   │   │   ├── explainer/     #   └── CS explainer chat
│   │   │   ├── interview/     #   └── Problem generation
│   │   │   ├── interviews/    #   └── Chat & evaluation
│   │   │   ├── judge/         #   └── Code execution
│   │   │   ├── leaderboard/   #   └── Leaderboard queries
│   │   │   ├── reports/       #   └── Interview reports
│   │   │   ├── reviews/       #   └── User reviews CRUD
│   │   │   ├── user/          #   └── Profile, onboarding, resume
│   │   │   └── voice/         #   └── STT, TTS, health check
│   │   ├── interview/         # Interview pages (technical, hr, resume)
│   │   ├── explainer/         # CS concept explainer page
│   │   ├── home/              # Dashboard page
│   │   ├── leaderboard/       # Leaderboard page
│   │   ├── onboarding/        # Onboarding wizard
│   │   └── profile/           # User profile page
│   ├── components/
│   │   ├── interview/         # Interview UI (greeting, proctor, report, wrapping-up)
│   │   ├── editor/            # Monaco code editor wrapper
│   │   ├── explainer/         # Blackboard, MermaidViewer, voice panel
│   │   ├── voice/             # VoicePanel (mic, waveform, transcript)
│   │   ├── home/              # Dashboard panels & widgets
│   │   ├── onboarding/        # Multi-step onboarding components
│   │   ├── ui/                # Shadcn/Radix component library
│   │   ├── layout/            # Navbar, Footer
│   │   ├── theme/             # Dark/light mode toggle
│   │   ├── auth/              # Login modal, auth guards
│   │   ├── shared/            # ReviewsSection, AIPanelsSection
│   │   └── ranks/             # Rank badge display
│   ├── config/                # Interviewer profiles, ranks, languages
│   ├── db/                    # Drizzle schema & client
│   └── lib/
│       ├── llm/               # Multi-provider LLM engine & schemas
│       ├── judge/             # Local code runner
│       ├── problems/          # Problem generation & verification
│       ├── voice/             # Gnani voice service client
│       ├── interview/         # Interview chat client
│       ├── supabase/          # Auth helpers & middleware
│       ├── resume/            # PDF resume parser
│       ├── moderation/        # Profanity filter
│       └── analytics/         # Analytics tracker
└── drizzle/                   # SQL migration files
```

---

## ⚠️ Important Notes

- **LLM Provider Required** — At least one LLM provider API key must be configured for AI features. The app supports automatic failover: if Gemini's quota is exhausted, it cascades to DeepSeek → OpenRouter → Grok.
- **Local Code Execution** — Depends on the corresponding language runtime being installed on the host machine. Alternatively, configure a remote Piston-compatible service.
- **Code Judge Safety** — The code judge runs submissions as local processes and is meant for local use only. It is not hardened for untrusted code, so do not expose it publicly.
- **Browser Permissions** — Camera and microphone access must be granted by the user for interview proctoring and voice features.
- **Development Database** — Always use a development database when testing migrations and seed commands.
- **Google OAuth** — Must be enabled in the Supabase dashboard with redirect URLs configured for your application origins.

---

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Pratyaksh0x1">
        <img src="https://github.com/Pratyaksh0x1.png" width="100px;" alt="Pratyaksh Tomar"/>
        <br />
        <sub><b>Pratyaksh Tomar</b></sub>
      </a>
      <br />
      <sub>Backend, AI/LLM, Voice, APIs, Database</sub>
    </td>
    <td align="center">
      <a href="https://github.com/PreetChaudhary0264">
        <img src="https://github.com/PreetChaudhary0264.png" width="100px;" alt="Preet Choudhary"/>
        <br />
        <sub><b>Preet Choudhary</b></sub>
      </a>
      <br />
      <sub>Frontend, UI/UX, Components, Styling</sub>
    </td>
  </tr>
</table>

---

<div align="center">

**Built with ❤️ for engineering students preparing for tech interviews**

</div>
