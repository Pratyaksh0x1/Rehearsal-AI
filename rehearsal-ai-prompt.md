# Rehearsal AI — Master Build Prompt

> Hand this whole file to your coding agent. Part 1 is the logo prompt, Part 2 is the full product/build prompt, Part 3 is what YOU must provide (keys, APIs, data).

---

## PART 1 — Logo Prompt (for an image generator)

```
Design a simple, minimal logo for "Rehearsal AI", a coding interview preparation platform.
- Concept: a stage-curtain / microphone / code-bracket motif hinting at "rehearsing" an interview with an AI.
  Keep ONE clear idea, for example a pair of curly braces { } whose center forms a sound wave or a small curtain.
- Style: flat vector, geometric, 2 colors max plus white/black, no gradients, no photo-realism, no tiny details.
- Must work at 32x32 favicon size and on both dark and light backgrounds.
- Provide: icon-only mark, and horizontal lockup with the wordmark "Rehearsal AI" in a clean modern sans-serif.
- Output on transparent background. SVG preferred.
- Palette: use the brand accent defined in the design tokens (see Part 2, section 2).
```

### Rank badge image prompts (generate 6, same style, same canvas size)

```
Create a set of 6 game-style rank badges for a coding platform, in the visual spirit of PUBG Mobile rank emblems
(original artwork, do NOT copy PUBG assets or logos). Square canvas, transparent background, consistent shield/wing
silhouette, increasing ornateness per tier:
1. Bronze     - simple bronze shield, plain, warm brown-copper metal
2. Gold       - gold shield, small wings, polished shine
3. Platinum   - silver-blue metal, larger wings, subtle glow
4. Diamond    - faceted cyan/blue crystal at center, sharp edges, glow
5. Crown      - ornate shield topped with a royal crown, deep purple/gold
6. Conqueror  - the most elaborate: dark red/black and gold, large wings, flames or aura, crown and a central gem
Flat-to-semi-3D illustration, clean edges, readable at 64px and at 512px.
```

---

## PART 2 — Product Build Prompt

You are a senior full-stack engineer. Build **Rehearsal AI**, a web app where users practice coding interviews with AI agents, with voice support. Follow this spec exactly. **Do not invent features, APIs, endpoints, model names, or data that are not specified here. If something is missing or unclear, leave a clearly marked `TODO` / environment variable placeholder and list it in a final "Open Questions" section instead of guessing.**

### 1. Tech stack (suggested, keep unless a conflict appears)
- Next.js (App Router) + TypeScript + Tailwind CSS
- Postgres on Neon, with Drizzle ORM or Prisma
- Google login via Auth.js (NextAuth) — the Google client ID/secret will be provided by the owner via env vars
- Voice: Gnani API for speech-to-text (STT) and text-to-speech (TTS). Read the official Gnani docs for request formats; do not guess endpoints.
- LLM: provider-agnostic wrapper (see section 9)
- All secrets only in `.env`, never in client code, never committed

### 2. Design system
- Visual reference: Take You Forward / LeetCode style: clean, developer-focused, card-based layout, generous spacing, subtle borders, monospace for code.
- Define **design tokens as CSS variables** for BOTH themes (background, surface, border, text-primary, text-muted, accent, success, warning, danger). Every component must use tokens only — **no hard-coded colors anywhere**.
- Use one accent color and a neutral gray scale. No random extra colors. Rank colors are the only exception and are defined as their own tokens.
- Typography: one sans-serif for UI, one monospace for code. Large display font for headings and the user's name on Home.
- Responsive: mobile, tablet, desktop.

### 3. Theme toggle (dark / light)
- Toggle button in the landing header and in the logged-in navbar.
- Implementation: `data-theme` attribute on `<html>` + CSS variables; persist choice in `localStorage`; default to the system preference on first visit.
- No flash of wrong theme on load (set the attribute with an inline script before hydration).
- Every page, card, input, code editor, and chart must correctly switch. Test both themes on every page.

### 4. Landing page (logged-out)
Top to bottom:
1. **Header**: logo, theme toggle, **"Continue with Google"** button.
2. **Hero** (two columns on desktop):
   - Left: short headline + 1-2 sentence description of Rehearsal AI (practice technical, HR, and resume-review interviews with AI agents, with voice) and the Google login button.
   - Right: **a video section** that simulates the full product flow (login, onboarding, ranks, interview, feedback). Embed a `<video>` with poster, controls, and lazy load. Use a placeholder file path `/public/demo.mp4`; the owner will supply the edited video. Include a rounded frame and a subtle shadow so it looks professional.
3. **AI Panels section**: title "Meet your AI panelists". Show cards for the AI interviewers. **Panel/agent names must come from a config file** (`config/panels.ts`) with placeholder entries. The owner will fill in the actual names from the Gnani API. Do not invent persona names or voice IDs.
4. **Reviews section**: leave an **empty, styled section** with a heading "What users say" and an empty-state container. Build it so reviews can be added later from a simple JSON/DB source.
5. **Footer**: "Made with love and tea by Pratyaksh Tomar and Preet Chaudhary".

### 5. Auth and onboarding
- After Google login, check whether the user exists in the DB.
- **New users only** see onboarding. Returning users go straight to Home.
- Onboarding: a full-screen, theme-matching **mascot/character** (simple illustrated SVG, consistent with the logo) appears in a speech-bubble style dialog and asks:
  1. "What's your name?" (becomes the username shown across the app; validate uniqueness for the leaderboard)
  2. "Drop your resume" (PDF upload, max size 5 MB, validate type server-side)
- After the upload, parse the resume text (PDF text extraction) and store the file plus the extracted text.
- Then show the **Rank Ladder screen** (section 6).

### 6. Rank system (PUBG-style ladder)
Ranks in order: **Bronze, Gold, Platinum, Diamond, Crown, Conqueror**.
- Every new user starts at **Bronze**.
- Rank ladder screen: a vertical "ladder/map" showing all six ranks with badge images (from `/public/ranks/*.png|svg`), the current rank highlighted, locked ranks dimmed.
- Under the current rank show its description. Bronze description (use exactly):
  > "Fresh recruit, fresh gamer. Currently knows the basics of coding. The contract needs a really strong candidate."
- Descriptions for the other five ranks: use `TODO` placeholders in `config/ranks.ts` (owner will provide).
- Button below: **"Start My Journey"** → goes to Home.
- **Promotion rules (points needed per rank) are NOT defined yet.** Implement a config file `config/ranks.ts` with `pointsRequired` set to `TODO` placeholders, and write the promotion logic to read from it. Do not invent thresholds.

### 7. Logged-in app shell (navbar)
- Left: Rehearsal AI logo.
- Links: **Home, Interview, Leaderboard, Profile**.
- Right: theme toggle + **Sign out**.

### 8. Pages

**Home**
- Greeting above the username (e.g. "Hello,"), the **username in a large display font**, and beside it the user's **rank badge + rank name**.
- Under the username, a prompt line: "Give your first interview now" (for users with 0 interviews; otherwise a neutral line such as "Ready for your next round?") with a CTA to the Interview page.
- Below that: the **AI agents/panels section** (same data as the landing page) and the **reviews section** (same data source). Nothing else on the page.
- Footer: "Made with love and tea by Pratyaksh Tomar and Preet Chaudhary".

**Interview**
Three cards, each with a brief description and a Start button:
1. **Technical Round**: solve coding problems chosen for your rank, with an AI interviewer.
2. **HR Round**: a behavioral interview; the AI assesses communication, ownership, teamwork, and clarity.
3. **Resume Review**: the AI reviews your resume and gives a score and the changes needed.

**Leaderboard**
- Ranked list grouped/filterable by rank tier. Columns: position, username, rank badge, points. Paginated.
- Ordering: by points (descending); tie-breaker TODO.

**Profile**
- Total interviews given, interview history list (type, date, score, link to the report).
- Problems solved: total count, plus a breakdown by difficulty/rank tier.
- **Change resume** (re-upload, re-parse, replace the stored file).
- **Report a problem** form (category, description, optional screenshot) saved to the DB.

### 9. Interview engines

**Common**
- Voice loop: user speaks → Gnani STT → LLM → Gnani TTS plays the reply. Also allow a text input fallback and a mute/replay control.
- Save a transcript, a score, and structured feedback for every session.
- LLM wrapper: one interface `generate(messages, options)` with swappable providers (Gemini / xAI Grok / OpenAI, selected by env var), with a fallback order, timeouts, retries, and per-user rate limits. Never expose keys to the browser. Model names go in env vars; don't hard-code names you aren't sure exist.
- LLM output for scoring must be **strict JSON validated with a schema** (e.g. Zod); retry on invalid output.

**Technical Round**
- Problem selection by rank:
  | Rank | Problem pool |
  |---|---|
  | Bronze | LeetCode Easy to Medium, mostly Arrays and Strings |
  | Gold | LeetCode Medium, widen topics (hashing, two pointers, sliding window, stack/queue, binary search) |
  | Platinum | LeetCode Medium to Hard (trees, linked lists, recursion/backtracking, intro graphs and DP) |
  | Diamond | LeetCode Graph and DP Hard, **plus Codeforces** problems |
  | Crown | LeetCode Hard + Codeforces |
  | Conqueror | LeetCode Hard + harder Codeforces |
  - Gold and Platinum topic mixes above are a suggested progression; keep them in `config/problemPools.ts` so the owner can edit.
  - **Codeforces rating ranges for Diamond/Crown/Conqueror: TODO.** The owner's note ("1200 to 1100") is ambiguous; ask before hard-coding. Make min/max rating configurable per rank.
- Page layout: problem panel (left), code editor with language selector (right, Monaco editor), console/results (bottom), AI interviewer panel with voice controls.
- The AI interviewer behaves like a real interviewer: asks the candidate to explain their approach first, gives hints only when asked or when stuck, asks about time/space complexity, and gives a final evaluation (correctness, approach, complexity, communication).
- Code execution: run user code through a sandboxed judge service (see Part 3). Never execute user code on the app server.
- Problem statements: store only the metadata (title, link, difficulty, topics, source) from external platforms and **link out** to the original problem. Do not copy full copyrighted statements from LeetCode or Codeforces.

**HR Round**
- The LLM conducts a behavioral interview (STAR-style questions, follow-ups based on answers and on the resume).
- Fixed number of questions (configurable, default 5).
- Final report: scores for communication, structure (STAR), confidence/clarity, relevance, plus strengths and improvements.

**Resume Review**
- Input: the stored resume text.
- Output (JSON → UI): overall score out of 100, section-wise notes (summary, skills, projects, experience, education, formatting/ATS), top changes to make, and a rewritten bullet suggestion or two.
- Keep it short and actionable. Do not fabricate anything not present in the resume.

### 10. Data model (Postgres, minimum)
`users` (id, google_id, email, username unique, rank, points, resume_url, resume_text, created_at)
`interviews` (id, user_id, type, started_at, ended_at, score, transcript, feedback_json)
`problem_attempts` (id, user_id, interview_id, source, external_id, difficulty, solved bool, submitted_code, language)
`problems` (id, source, external_id, title, url, difficulty/rating, topics[], rank_tier)
`reports` (id, user_id, category, description, created_at)
`reviews` (id, name, text, created_at) — empty for now
Add indexes for the leaderboard (rank, points) and for the user's history.

### 11. Quality bar
- Accessibility (keyboard nav, labels, contrast in both themes), loading and error states everywhere, form validation, server-side auth checks on every API route, rate limiting on LLM and STT/TTS routes, file upload validation.
- Small reusable components; no duplicated page code between the landing and Home sections.
- `README.md` with setup, env vars, and how to run migrations and seed the problems.

### 12. Deliverables
1. Working app per the spec, 2. `.env.example`, 3. seed script for problems, 4. `config/` files with TODOs, 5. "Open Questions" list at the end of the final message.

---

## PART 3 — What YOU need to provide / decide

### Things to attach (keys and assets)
| Item | Purpose |
|---|---|
| Google OAuth Client ID + Secret | Google login (set the authorized redirect URI to your callback URL) |
| Gnani API key + docs link | STT and TTS. Also the panel/agent names and voice IDs you want to show |
| LLM API key(s) | Gemini / OpenAI / xAI (pick one primary and one fallback) |
| Neon Postgres connection string | User data |
| File storage | For resume PDFs (see below) |
| Code execution/judge | To run user code (see below) |
| Demo video | `/public/demo.mp4` (edited) |
| Rank badge images | From Part 1 prompts |
| Rank descriptions and point thresholds | Not defined yet |
| Codeforces rating range per rank | Clarify the 1100/1200 note |

### Your specific questions

**Codeforces API**: Yes, it has an official public API. The `problemset.problems` method returns problem lists with name, contest ID, index, rating, and tags, so you can filter by rating and tag. It does **not** return full statements; link to `codeforces.com/problemset/problem/{contestId}/{index}`. Check the official API docs for rate limits.

**LeetCode problems**: There is **no official public API**. Options:
1. **Recommended: build your own curated list.** Keep a JSON/CSV of problems with title, slug, difficulty, topics and URL (a few hundred covering arrays/strings, graphs, DP is plenty), seed it into your DB, and link out to LeetCode. Safest legally and the most stable.
2. Unofficial GraphQL endpoint or community datasets: works today but can break anytime and may violate LeetCode's Terms of Service. Check the ToS and any dataset's license before relying on it.
3. Don't scrape and re-host full problem statements; that's a copyright and ToS risk.

**Do you need scraping?** Not really. Codeforces has an API, LeetCode metadata can be a one-time curated seed, and the resume is user-uploaded. Skip scraping.

**LLM choice (Gemini + Grok + OpenAI free models)**: Free tiers and model availability change often and I'm not certain what each provider currently offers for free. Verify on each provider's pricing page. Practical advice: use **one primary provider** (Gemini's free tier is typically the easiest to start with) and one fallback behind the provider wrapper; running three at once adds complexity for little benefit. Also handle rate-limit errors gracefully since free tiers are tight.

**Neon Postgres**: Good choice for user data, history, ranks and leaderboards. But **don't store resume PDFs in it**; store the extracted text in Postgres and the file in object storage (Cloudflare R2, S3, Vercel Blob, or UploadThing).

### Other things you will need that you didn't list
- **Code execution sandbox**: for the technical round you need something that runs code safely (Judge0 or Piston, hosted or self-hosted). Without it, you can only have the AI read the code, not test it. Also, LeetCode/Codeforces don't ship their test cases publicly, so for judged runs you'll need to write your own test cases for the problems you seed. If that's too much for v1, let the AI evaluate the code by reasoning and ask the user to verify on the original site.
- **PDF text extraction library** for the resume (handled in code; scanned/image PDFs may need OCR, so decide whether to support them).
- **Hosting**: Vercel is a natural fit for Next.js. Microphone access requires HTTPS.
- **Privacy**: you store resumes and voice transcripts, so add a short privacy policy and a delete-my-data option.
- **Abuse protection**: rate limits on voice and LLM routes, or free-tier quotas will drain quickly.

### Ambiguities I noticed in your brief (please confirm)
1. **Footer name**: you wrote "Pratyaksh Tomar" in one place and "Pratyaksh Chaudhary" in another. I used **Pratyaksh Tomar** and **Preet Chaudhary** throughout.
2. **Codeforces range**: "1200 to 1100" for Diamond/Conqueror needs a clear min/max.
3. **Rank list** has no Silver (PUBG has one), I followed your list exactly: Bronze, Gold, Platinum, Diamond, Crown, Conqueror.
4. **Points system**: how points are earned per interview/problem and what total each rank needs.
5. **Home page "below nothing"**: I interpreted it as only the AI agents section, the reviews, and the footer.
