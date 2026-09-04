# Quizify

AI-powered quiz generation, evaluation, and classroom management. React + Node/Express + PostgreSQL (Supabase), deployable on Vercel + Render for free.

## What's included

- **Auth** — email/password, JWT, role-based (teacher / student)
- **Classes & sections** — create classes, enroll students, view rosters
- **Bulk student import** — CSV upload creates accounts + enrolls students at once
- **AI quiz generation (lightweight RAG)** — upload source material (.txt), it's chunked and the most relevant chunks are retrieved and sent to Claude to generate grounded questions (objective + subjective)
- **AI grading of subjective answers** — Claude grades free-text answers against a model answer and gives feedback; teachers can override any grade
- **Cheating / integrity signals** — tab-switch and paste events captured during a quiz attempt feed a 0–100 anomaly score shown to teachers
- **Analytics dashboard** — average scores, performance by class, flagged attempts
- **Dashboards matching your reference mockups** — student "Smart Prep" home, teacher AI Lab / Evaluations / Analytics

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS, deployed to **Vercel** |
| Backend | Node.js + Express, deployed to **Render** |
| Database | PostgreSQL via **Supabase** |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |

## Project structure

```
quizify/
├── backend/              Express API
│   ├── src/
│   │   ├── server.js
│   │   ├── config/db.js
│   │   ├── middleware/auth.js
│   │   ├── lib/aiClient.js      (Claude API calls: generation + grading)
│   │   ├── lib/chunkText.js     (RAG chunking)
│   │   └── routes/              (auth, classes, students, quizzes, attempts, analytics)
│   ├── package.json
│   └── .env.example
├── frontend/              React app
│   ├── src/
│   │   ├── pages/                (Login, Register, dashboards, AI Lab, Evaluations, etc.)
│   │   ├── components/           (Layout/sidebar, ProtectedRoute)
│   │   ├── context/AuthContext.jsx
│   │   └── lib/api.js
│   ├── package.json
│   └── .env.example
└── database/
    └── schema.sql          Run this in Supabase first
```

## 1. Set up Supabase (database)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** → paste the contents of `database/schema.sql` → Run.
3. Go to **Project Settings → Database → Connection string** (URI, "Transaction" pooler) and copy it — you'll need it for the backend `DATABASE_URL`.

## 2. Run the backend locally

```bash
cd backend
cp .env.example .env
# edit .env: paste your Supabase DATABASE_URL, a random JWT_SECRET,
# and your ANTHROPIC_API_KEY (https://console.anthropic.com/settings/keys)
npm install
npm run dev
```

The API runs on `http://localhost:4000`. Check `http://localhost:4000/api/health`.

## 3. Run the frontend locally

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:4000/api
npm install
npm run dev
```

Open `http://localhost:5173`. Register a **teacher** account, create a class, then register a **student** account (or bulk-import students via CSV) and enroll them.

## 4. Try the AI flow

1. Log in as a teacher → **AI Lab**.
2. Give the quiz a title, pick a class, upload a `.txt` file with your lesson notes.
3. Choose question types, difficulty, and total questions → **Generate with AI**.
4. Go to **Quizzes** → **Publish** the draft.
5. Log in as a student (in another browser/incognito window) → take the quiz.
6. Back as the teacher, go to **Evaluations** to see AI-suggested grades for subjective answers, and **Analytics** for score/integrity charts.

> Note on file types: the generator currently accepts plain text (`.txt`). To support PDF/DOCX uploads, extract text from the file client-side (or with a library like `pdf-parse` server-side) and send it through the same `/api/quizzes/source-material` endpoint — the chunking and generation logic doesn't change.

## 5. Deploy

### Backend → Render
1. Push this repo to GitHub.
2. Render → New → Web Service → point at the repo, root directory `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variables from `backend/.env.example` (`DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, `CORS_ORIGIN` set to your Vercel URL).

### Frontend → Vercel
1. Vercel → New Project → same repo, root directory `frontend`.
2. Framework preset: Vite. Build command `npm run build`, output `dist`.
3. Environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`.

### After deploying
Update `CORS_ORIGIN` on Render to your real Vercel domain, and redeploy the backend.

## Design notes

The UI uses your Quizify logo (brain + question mark) and a purple/indigo palette pulled from it (`#241752` → `#7C4FDE`), with a clean white card-based layout matching the dashboard mockups you shared — sidebar navigation, stat cards, and a dedicated AI Lab screen for the RAG quiz generator.

## What's intentionally simplified (and how to extend it)

- **RAG retrieval** uses keyword-overlap scoring (`retrieveRelevantChunks` in `backend/src/lib/aiClient.js`) rather than vector embeddings, so there are no extra paid services to wire up. To upgrade: enable the `vector` extension in Supabase (commented in `schema.sql`), generate embeddings for each chunk with the Anthropic or another embeddings API, and swap the keyword scoring for cosine similarity.
- **Cheating detection** uses a transparent weighted heuristic (tab-switch, paste, dev-tools events) rather than a trained ML model. The scoring weights live in `backend/src/routes/attempts.js` and are easy to tune or replace with a real model once you have labeled attempt data.
- **CSV bulk import** issues temporary passwords shown once to the teacher; wire up an email step (e.g. via Resend or Supabase Auth invites) for production use instead of displaying them in the UI.
