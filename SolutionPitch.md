# Rehearsal AI — Solution Pitch

**Pratyaksh Tomar & Preet Choudhary** · Built with Gnani AI Prisma (STT) & Timbre (TTS)

---

## The Problem

Every year, lakhs of Indian engineering students face technical interviews with no realistic way to practice speaking. Existing mock-interview tools are text-based chatbots — they never hear the student's voice, never interrupt, and never catch a shaky explanation. Voice tools that do exist struggle with Indian accents, technical jargon (*hashmap*, *Dijkstra*, *amortised*), and regional languages. Most students walk into their first real interview having never answered a single question out loud.

## Our Solution

**Rehearsal AI** is a voice-first AI mock-interview platform. The student picks an AI interviewer, clicks a mic button, and talks — exactly like a real interview. The interviewer listens, responds in a natural Indian voice, asks follow-ups, and can be interrupted mid-sentence.

| Capability | What it does |
|------------|-------------|
| **Voice Interview Rounds** | Technical, HR, and resume-based rounds — each with a distinct AI interviewer persona and voice |
| **Live Coding Round** | A sandboxed judge runs Python, JS, C++, and Java against visible + hidden test cases; the interviewer asks about complexity out loud |
| **CS Concept Explainer** | Ask any CS question → Professor Rehearsal draws a diagram on a sketchbook blackboard and explains it by voice in 10 Indian languages |
| **Evaluation & Progress** | Detailed score report with category breakdown, an ATS resume audit, a review system, and a rank ladder (Bronze → Conqueror) |

## How We Use Gnani AI

- **Prisma (Speech-to-Text):** Transcribes the candidate's spoken answers in real time, configured with a technical-vocabulary bias list so domain terms (*trie*, *mutex*, *TCP handshake*) are recognised accurately in Indian English.
- **Timbre (Text-to-Speech):** Gives each AI interviewer a distinct Indian voice, streamed sentence-by-sentence to keep conversational latency low. Also powers the Concept Explainer's professor voice across Hindi, Tamil, Telugu, Kannada, and six other Indian languages.

## Who It's For

Engineering students and job seekers preparing for campus placements and company interviews — especially those who want to practise in Indian English or their own regional language. Also useful for college placement cells running mock-interview drives at scale.

## Why It Matters

Interview confidence comes from *speaking*, not reading. Rehearsal AI gives any student with a laptop and a microphone access to realistic, voice-powered interview practice — at any hour, in a language they're comfortable with, with instant feedback.

## Team Contributions

| Member | Role | Key Ownership |
|--------|------|---------------|
| **Pratyaksh Tomar** | Backend & AI Core | LLM engine (multi-model failover), Gnani Prisma & Timbre integration, voice pipeline, code judge, evaluation API, database, auth, all 15 API routes |
| **Preet Choudhary** | Frontend & UI/UX | Interview UI flow, Monaco code editor, voice panel, report rendering, explainer blackboard, design system, responsive layout, all user-facing pages |

## Tech Stack

Next.js 14 · TypeScript · Tailwind CSS · Supabase Auth · PostgreSQL + Drizzle ORM · Gnani Prisma & Timbre · Gemini / DeepSeek / Grok (multi-LLM) · Monaco Editor · Sandboxed code runner

---

**#GnaniAI  #GreatIndianAIInternshipChallenge**

