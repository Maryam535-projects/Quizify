# 🧠 Quizify

**AI-powered quiz generation, evaluation, and classroom management platform.**

Quizify is a full-stack web application that revolutionizes how educators create, administer, and grade quizzes. By leveraging Claude AI, it automates question generation from course materials, provides intelligent grading for subjective answers, and offers comprehensive analytics to track student performance and academic integrity.

---

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude-000000?style=for-the-badge&logo=anthropic&logoColor=white)](https://www.anthropic.com/)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 📸 Screenshots

### 1. Dashboard
*Overview of classes, recent quizzes, and quick actions for teachers.*

<img src="quizify-01-dashboard.jpg" alt="Dashboard" width="800"/>

**Key Features:**
- Welcome message with teacher name
- Recent quizzes with status
- My Classes section with student count
- Quick "Generate Quiz with AI" action
- Sidebar navigation

---

### 2. AI Quiz Generator
*Create quizzes using RAG with uploaded source material. Questions are grounded in your content.*

<img src="quizify-02-ai-quiz-generator.jpg" alt="AI Quiz Generator" width="800"/>

**Form Fields:**
- Quiz Title
- Class Selection
- Source Material Upload (`.txt`)
- Question Types (Objective / Subjective)
- Difficulty Level (1–10)

---

### 3. Classes & Roster
*Manage classes, sections, and student enrollment.*

<img src="quizify-03-classes-roster.jpg" alt="Classes & Roster" width="800"/>

**Features:**
- Class list with subject and session
- Student roster with roll numbers
- Bulk import via CSV
- Enroll students individually

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- Secure email/password authentication with JWT
- Role-based access control (Teacher / Student)
- Protected routes and API endpoints

### 🏫 Classroom Management
- Create and manage classes with sections
- Enroll students individually or in bulk
- View class rosters and student progress

### 📥 Bulk Student Import
- Upload CSV files to create student accounts
- Auto-enroll students in selected classes
- Temporary passwords generated and displayed

### 🤖 AI Quiz Generation (RAG)
- Upload source material (`.txt` files)
- Intelligent text chunking and retrieval
- Context-aware question generation with Claude
- Support for objective (MCQ) and subjective questions

### 📝 AI Grading
- Automatic grading of subjective answers
- Model answer comparison with Claude
- Detailed feedback for students
- Teacher override capability

### 🛡️ Integrity Monitoring
- Track tab-switch events during quizzes
- Monitor paste operations
- Generate 0–100 anomaly scores
- Flag suspicious attempts for review

### 📊 Analytics Dashboard
- Average scores and performance metrics
- Class-wise performance breakdown
- Flagged attempts list
- Visual charts and statistics

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js, Express |
| **Database** | PostgreSQL via Supabase |
| **AI Services** | Anthropic Claude API |
| **Authentication** | JWT |

---

## 📁 Project Structure

```
quizify/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── config/db.js
│   │   ├── middleware/auth.js
│   │   ├── lib/
│   │   │   ├── aiClient.js
│   │   │   └── chunkText.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── classes.js
│   │       ├── students.js
│   │       ├── quizzes.js
│   │       ├── attempts.js
│   │       └── analytics.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── AILab.jsx
│   │   │   ├── Evaluations.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── QuizTake.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/AuthContext.jsx
│   │   └── lib/api.js
│   ├── package.json
│   └── .env.example
│
├── database/
│   └── schema.sql
│
├── quizify-01-dashboard.jpg
├── quizify-02-ai-quiz-generator.jpg
├── quizify-03-classes-roster.jpg
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Supabase** account ([sign up](https://supabase.com/))
- **Anthropic** API key ([get it](https://console.anthropic.com/settings/keys))

### 1. Set up Supabase (Database)

1. Create a new project on [Supabase](https://supabase.com/).
2. Navigate to **SQL Editor**.
3. Copy and run `database/schema.sql`.
4. Copy your **Connection string** from Project Settings → Database.

### 2. Backend Setup

```bash
cd backend
cp .env.example .env

# Edit .env with:
# DATABASE_URL=your_supabase_connection_string
# JWT_SECRET=your_secret_key
# ANTHROPIC_API_KEY=your_api_key

npm install
npm run dev
```

API runs on `http://localhost:4000`.

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env

# Edit .env:
# VITE_API_URL=http://localhost:4000/api

npm install
npm run dev
```

App runs on `http://localhost:5173`.

### 4. Try the AI Flow

**Teacher:**
1. Register as teacher
2. Create a class
3. Go to **AI Lab**
4. Upload `.txt` file → Generate quiz
5. Publish quiz

**Student:**
1. Register as student
2. Take quiz from dashboard
3. Submit answers

**Teacher:**
1. Go to **Evaluations** → View AI grades
2. Override if needed
3. Check **Analytics** for performance

---

## 🧩 Implementation Notes

### Lightweight RAG
- Uses **keyword-overlap scoring** (no vector DB required)
- Upgrade: Enable `vector` extension in Supabase for semantic search

### Cheating Detection
- Monitors tab-switch, paste, and dev-tools events
- Weights configurable in `backend/src/routes/attempts.js`

### Bulk Import
- Generates temporary passwords (displayed once)
- Production: Integrate email service for secure delivery

---

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGIN=http://localhost:5173
PORT=4000
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
```

---

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |

### Classes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | Get all classes |
| POST | `/api/classes` | Create class |
| POST | `/api/classes/:id/enroll` | Enroll student |
| POST | `/api/classes/:id/bulk-import` | Bulk import CSV |

### Quizzes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quizzes` | Get quizzes |
| POST | `/api/quizzes/generate` | Generate with AI |
| POST | `/api/quizzes/:id/publish` | Publish quiz |
| POST | `/api/quizzes/:id/source-material` | Upload source |

### Attempts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attempts` | Start attempt |
| PUT | `/api/attempts/:id/submit` | Submit quiz |
| PUT | `/api/attempts/:id/grade` | AI grade |
| PUT | `/api/attempts/:id/override` | Override grade |
| GET | `/api/analytics` | Get analytics |

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 💬 Support

- **GitHub Issues:** [Open an issue](https://github.com/yourusername/quizify/issues)
- **Email:** support@quizify.com

---

**Built with ❤️ using React, Node.js, and Claude**
