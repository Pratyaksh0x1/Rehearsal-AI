<div align="center">

# 🎙️ Rehearsal AI

**AI-Powered Mock Interview Platform for Engineering Students**

Practice technical coding, behavioral HR, and resume review interviews with realistic AI interviewers — complete with voice conversation, live code execution, proctoring, and detailed performance reports.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![License](https://img.shields.io/badge/License-Private-red)]()

</div>

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
- **LLM-Generated Problems** — Unique coding problems generated per candidate at interview time, with automated verification pipeline (reference solution + test case validation)
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
| **Code Execution** | Local sandbox (Python, JS, C++, Java) + optional Piston remote |
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
| `LLM_PROVIDER` | ✅ | Primary LLM: `gemini` \| `deepseek` \| `openrouter` \| `grok` |
| `GEMINI_API_KEY` | ✅* | Google Gemini API key |
| `DEEPSEEK_API_KEY` | ⬜ | DeepSeek API key (fallback) |
| `OPENROUTER_API_KEY` | ⬜ | OpenRouter API key (fallback) |
| `GROK_API_KEY` | ⬜ | xAI Grok API key (fallback) |
| `GNANI_API_KEY` | ✅ | Gnani.ai voice services key |
| `JUDGE_SERVICE_URL` | ⬜ | Remote Piston execution endpoint |
| `NEXT_PUBLIC_POSTHOG_KEY` | ⬜ | PostHog analytics key |

> *At least one LLM provider key is required. Gemini is recommended as primary.

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
| `npm run seed` | Seed interview problems |

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
│       ├── judge/             # Code execution sandbox
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
