# 🧠 Quizify

**AI-powered quiz generation, evaluation, and classroom management platform.**

Quizify is a full-stack web application that revolutionizes how educators create, administer, and grade quizzes. By leveraging Claude AI, it automates question generation from course materials, provides intelligent grading for subjective answers, and offers comprehensive analytics to track student performance and academic integrity.

---

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude-000000?style=for-the-badge&logo=anthropic&logoColor=white)](https://www.anthropic.com/)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Set up Supabase (Database)](#1-set-up-supabase-database)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. Try the Full AI Flow](#4-try-the-full-ai-flow)
- [🧩 Design & Implementation Notes](#-design--implementation-notes)
- [🎨 UI Design](#-ui-design)
- [🔧 Environment Variables](#-environment-variables)
- [📊 API Endpoints](#-api-endpoints)
- [📝 License](#-license)
- [🤝 Contributing](#-contributing)
- [💬 Support](#-support)

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

### 🎨 Modern UI
- Purple/indigo color palette (`#241752` → `#7C4FDE`)
- Clean card-based layout
- Responsive sidebar navigation
- Dedicated dashboards for different user roles

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS | Modern, fast UI development |
| **Backend** | Node.js, Express | RESTful API server |
| **Database** | PostgreSQL via Supabase | Cloud-hosted relational database |
| **AI Services** | Anthropic Claude API (`claude-sonnet-4-6`) | Quiz generation & grading |
| **Authentication** | JWT | Secure session management |
| **Hosting** | Vercel (Frontend), Render (Backend) | Free-tier cloud deployment |

---

## 📁 Project Structure

```
quizify/
├── backend/                    # Express API
│   ├── src/
│   │   ├── server.js           # Entry point
│   │   ├── config/
│   │   │   └── db.js           # Database configuration
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication
│   │   ├── lib/
│   │   │   ├── aiClient.js     # Claude API integration
│   │   │   └── chunkText.js    # RAG text chunking
│   │   └── routes/
│   │       ├── auth.js         # Authentication endpoints
│   │       ├── classes.js      # Class management
│   │       ├── students.js     # Student management
│   │       ├── quizzes.js      # Quiz generation & management
│   │       ├── attempts.js     # Quiz attempts & grading
│   │       └── analytics.js    # Analytics endpoints
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── AILab.jsx       # Quiz generation interface
│   │   │   ├── Evaluations.jsx # Grading interface
│   │   │   ├── Analytics.jsx   # Analytics dashboard
│   │   │   └── QuizTake.jsx    # Student quiz attempt
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── lib/
│   │       └── api.js          # API client
│   ├── package.json
│   └── .env.example
│
├── database/
│   └── schema.sql              # Supabase database schema
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Git**
- A **Supabase** account ([sign up here](https://supabase.com/))
- An **Anthropic** API key ([get it here](https://console.anthropic.com/settings/keys))

### 1. Set up Supabase (Database)

1. Create a new project on [Supabase](https://supabase.com/).
2. Note your project URL and API keys (you'll need these later).
3. Navigate to the **SQL Editor** in your Supabase dashboard.
4. Copy the entire contents of `database/schema.sql` and paste it into the SQL editor.
5. Click **Run** to create all tables and relationships.
6. Go to **Project Settings → Database** and copy the **Connection string** (URI).

### 2. Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/quizify.git
cd quizify/backend

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
# - DATABASE_URL: Your Supabase connection string
# - JWT_SECRET: A random string for JWT signing
# - ANTHROPIC_API_KEY: Your Anthropic API key

# Install dependencies
npm install

# Start the development server
npm run dev
```

The backend API will be available at `http://localhost:4000`. You can verify it's working by visiting `http://localhost:4000/api/health`.

### 3. Frontend Setup

```bash
cd ../frontend

# Copy environment variables
cp .env.example .env

# Edit .env with your backend URL
# - VITE_API_URL=http://localhost:4000/api

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 4. Try the Full AI Flow

#### As a Teacher:

1. **Register** a teacher account at `/register`.
2. **Create a class** from the dashboard.
3. (Optional) **Enroll students** manually or via CSV bulk import.
4. Navigate to the **AI Lab**.
5. **Fill in the form**:
   - Quiz title
   - Target class
   - Upload a `.txt` file with lesson notes
   - Select question types and difficulty
   - Choose total number of questions
6. Click **Generate with AI** and wait for Claude to create your quiz.
7. Go to **Quizzes** and **Publish** the draft.
8. Wait for students to take the quiz.

#### As a Student:

1. **Register** a student account (or be bulk-imported).
2. Log in and see available quizzes on the **Smart Prep** dashboard.
3. **Take a quiz** - the system monitors tab-switches and paste events.
4. Submit your answers.

#### Back as a Teacher:

1. Go to **Evaluations** to see AI-suggested grades for subjective answers.
2. **Review and override** grades if needed.
3. Visit the **Analytics** dashboard for:
   - Average scores
   - Class performance
   - Flagged attempts (anomaly scores)

---

## 🧩 Design & Implementation Notes

### Lightweight RAG Implementation

**Current Approach:**
- Uses **keyword-overlap scoring** in `retrieveRelevantChunks`.
- No vector embeddings required.
- Simple and cost-effective for small to medium documents.

**Upgrade Path:**
1. Enable the `vector` extension in Supabase (commented in `schema.sql`).
2. Generate embeddings for each chunk using Claude or an embeddings API.
3. Store embeddings in Supabase's vector column.
4. Replace keyword scoring with **cosine similarity** for semantic search.

### Cheating Detection Mechanism

**Current Heuristic:**
- Monitors tab-switch events (weight: 0.4)
- Tracks paste operations (weight: 0.3)
- Detects dev-tools opening (weight: 0.2)
- Captures other suspicious events (weight: 0.1)

**Configuration:**
Weights are adjustable in `backend/src/routes/attempts.js`. You can tune them based on your requirements or replace with a trained ML model.

### Bulk Import Considerations

**Current Implementation:**
- Generates temporary passwords displayed once to the teacher.
- Students must be given their credentials manually.

**Production Recommendation:**
- Integrate an email service (e.g., Resend, SendGrid).
- Use Supabase Auth's built-in email invites.
- Automatically send credentials to students via email.

---

## 🎨 UI Design

The Quizify interface features a cohesive design inspired by the Quizify logo (a brain with a question mark):

- **Primary Colors:** `#241752` (deep purple) → `#7C4FDE` (violet)
- **Layout:** Clean white cards with subtle shadows
- **Navigation:** Persistent sidebar for easy access
- **Responsive:** Optimized for desktop and tablet screens

**Dashboard Views:**
- **Student:** "Smart Prep" home with available quizzes
- **Teacher:** AI Lab, Evaluations, Analytics, and Class Management

---

## 🔧 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# AI
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# CORS
CORS_ORIGIN=http://localhost:5173

# Server
PORT=4000
NODE_ENV=development
```

### Frontend (.env)

```env
# API URL
VITE_API_URL=http://localhost:4000/api
```

---

## 📊 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user (teacher or student) |
| POST | `/api/auth/login` | Login and receive JWT token |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/logout` | Logout (invalidate token) |

### Classes & Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | Get all classes for a teacher |
| POST | `/api/classes` | Create a new class |
| GET | `/api/classes/:id` | Get class details with roster |
| PUT | `/api/classes/:id` | Update class information |
| DELETE | `/api/classes/:id` | Delete a class |
| POST | `/api/classes/:id/enroll` | Enroll a student in a class |
| POST | `/api/classes/:id/bulk-import` | Bulk import students via CSV |

### Quizzes & AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quizzes` | Get all quizzes (filtered by role) |
| POST | `/api/quizzes` | Create a new quiz (draft) |
| POST | `/api/quizzes/generate` | Generate quiz with AI |
| GET | `/api/quizzes/:id` | Get quiz details with questions |
| PUT | `/api/quizzes/:id` | Update quiz |
| POST | `/api/quizzes/:id/publish` | Publish a quiz |
| POST | `/api/quizzes/:id/source-material` | Upload source material for AI generation |

### Attempts & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attempts` | Get all attempts (teacher view) |
| POST | `/api/attempts` | Start a new quiz attempt |
| PUT | `/api/attempts/:id/submit` | Submit a quiz attempt |
| GET | `/api/attempts/:id` | Get attempt details with answers |
| PUT | `/api/attempts/:id/grade` | AI-grade subjective answers |
| PUT | `/api/attempts/:id/override` | Teacher override grade |
| GET | `/api/analytics` | Get analytics dashboard data |
| GET | `/api/analytics/class/:id` | Get class-specific analytics |

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Quizify

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository.
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`).
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`).
4. **Push** to the branch (`git push origin feature/amazing-feature`).
5. **Open** a Pull Request.

### Development Guidelines

- Follow the existing code style (ESLint, Prettier)
- Write tests for new features
- Update the README if you change setup or deployment instructions
- Use conventional commit messages (`feat:`, `fix:`, `docs:`, etc.)

---

## 💬 Support

For support, questions, or feedback:

- **GitHub Issues:** [Open an issue](https://github.com/yourusername/quizify/issues)
- **Email:** support@quizify.com

---

## 🎯 Future Roadmap

- [ ] Support for PDF and DOCX uploads
- [ ] Email notifications for students
- [ ] More question types (true/false, fill-in-the-blank)
- [ ] Timed quizzes with auto-submission
- [ ] Export results as CSV/PDF
- [ ] Mobile application (React Native)
- [ ] Integration with popular LMS platforms (Canvas, Moodle)

---

**Built with ❤️ using React, Node.js, and Claude**
