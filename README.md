# 🧠 Quizify

**AI-powered quiz generation, evaluation, and classroom management.**

Quizify is a full-stack web application designed to streamline the creation, administration, and grading of quizzes. It leverages AI (Claude) to automatically generate questions from your course materials, grade subjective answers, and provide detailed analytics to help you monitor student performance and academic integrity.

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude-000000?style=for-the-badge&logo=anthropic&logoColor=white)](https://www.anthropic.com/)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

---

## ✨ Key Features

-   **🔐 Role-Based Authentication:** Secure login for Teachers and Students with JWT-based sessions.
-   **🏫 Class & Section Management:** Create classes, enroll students, and manage rosters efficiently.
-   **📥 Bulk Student Import:** Upload a CSV to create student accounts and enroll them in a class in one go.
-   **🤖 AI Quiz Generation (Lightweight RAG):**
    -   Upload source material (`.txt` files).
    -   The system chunks the text and uses a keyword-overlap scoring to retrieve the most relevant chunks.
    -   These chunks are sent to Claude to generate grounded, context-aware objective and subjective questions.
-   **📝 AI Grading of Subjective Answers:** Claude evaluates free-text answers against a model answer, providing a grade and feedback. Teachers can override any grade.
-   **🛡️ Cheating / Integrity Signals:** The system captures tab-switch and paste events during a quiz. These are used to calculate a 0–100 "anomaly score" for each attempt, visible to teachers.
-   **📊 Analytics Dashboard:** Gain insights with average scores, performance by class, and a list of flagged attempts.
-   **🎨 Modern UI:** A clean, white card-based layout with a purple/indigo color palette (`#241752` → `#7C4FDE`), featuring a sidebar navigation and dedicated dashboards for Smart Prep, AI Lab, Evaluations, and Analytics.

---

## 🛠️ Tech Stack

| Layer          | Technology & Choice                                                                   |
| :------------- | :------------------------------------------------------------------------------------ |
| **Frontend**   | React 18, Vite, Tailwind CSS — deployed to **Vercel**                                 |
| **Backend**    | Node.js, Express — deployed to **Render**                                             |
| **Database**   | PostgreSQL via **Supabase**                                                           |
| **AI Services**| Anthropic Claude API (`claude-sonnet-4-6`) for generation and grading                 |

---

## 📁 Project Structure
