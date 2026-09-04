-- ============================================================
-- Quizify Database Schema (PostgreSQL / Supabase)
-- Run this in the Supabase SQL editor (or `psql` against your
-- Supabase connection string) to create all tables from scratch.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- USERS ----------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          varchar(120) not null,
  email         varchar(160) not null unique,
  password_hash text not null,
  role          varchar(20) not null check (role in ('teacher', 'student')),
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- ---------- CLASSES / SECTIONS ----------
create table if not exists classes (
  id         uuid primary key default gen_random_uuid(),
  name       varchar(120) not null,        -- e.g. "Physics 101"
  section    varchar(40),                  -- e.g. "Class 3A", "Honors"
  teacher_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- ENROLLMENTS (students <-> classes) ----------
create table if not exists enrollments (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references classes(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

-- ---------- SOURCE MATERIAL (for RAG quiz generation) ----------
create table if not exists source_materials (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid references classes(id) on delete cascade,
  uploaded_by uuid references users(id),
  file_name   text,
  raw_text    text not null,
  created_at  timestamptz not null default now()
);

-- chunks used as the retrieval corpus for RAG generation
create table if not exists source_chunks (
  id          uuid primary key default gen_random_uuid(),
  material_id uuid not null references source_materials(id) on delete cascade,
  chunk_index int not null,
  content     text not null,
  -- pgvector embedding column (enable extension to use real RAG similarity search)
  -- run: create extension if not exists vector;
  -- then: embedding vector(1536)
  created_at  timestamptz not null default now()
);

-- ---------- QUIZZES ----------
create table if not exists quizzes (
  id              uuid primary key default gen_random_uuid(),
  title           varchar(160) not null,
  class_id        uuid references classes(id) on delete cascade,
  created_by      uuid references users(id),
  material_id     uuid references source_materials(id),
  ai_model        varchar(60) default 'claude-sonnet-4-6',
  difficulty      int default 5,           -- 1-10 scale, matches UI slider
  question_types  jsonb default '{"objective": true, "subjective": false}',
  total_questions int default 10,
  duration_minutes int default 20,
  status          varchar(20) not null default 'draft', -- draft | published | closed
  created_at      timestamptz not null default now()
);

-- ---------- QUESTIONS ----------
create table if not exists questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  order_index    int not null default 0,
  question_text  text not null,
  question_type  varchar(20) not null check (question_type in ('objective', 'subjective')),
  options        jsonb,         -- for objective/MCQ: ["A...","B...","C...","D..."]
  correct_answer text,          -- for objective grading, or the model answer for subjective
  points         numeric default 1,
  created_at     timestamptz not null default now()
);

-- ---------- ATTEMPTS (a student taking a quiz) ----------
create table if not exists quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  student_id     uuid not null references users(id) on delete cascade,
  started_at     timestamptz not null default now(),
  submitted_at   timestamptz,
  score          numeric,
  max_score      numeric,
  status         varchar(20) not null default 'in_progress', -- in_progress | submitted | graded
  anomaly_score  numeric default 0,    -- 0-100, higher = more suspicious
  unique (quiz_id, student_id)
);

-- ---------- ANSWERS ----------
create table if not exists answers (
  id                  uuid primary key default gen_random_uuid(),
  attempt_id          uuid not null references quiz_attempts(id) on delete cascade,
  question_id         uuid not null references questions(id) on delete cascade,
  answer_text         text,
  is_correct          boolean,
  ai_grade            numeric,          -- AI-suggested score out of `questions.points`
  ai_feedback         text,
  teacher_override_grade numeric,
  graded_at           timestamptz,
  unique (attempt_id, question_id)
);

-- ---------- ANOMALY / CHEATING EVENTS ----------
create table if not exists anomaly_events (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid not null references quiz_attempts(id) on delete cascade,
  event_type  varchar(40) not null,  -- tab_blur, paste, dev_tools, fast_answer, copy
  detail      text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_classes_teacher on classes(teacher_id);
create index if not exists idx_enrollments_student on enrollments(student_id);
create index if not exists idx_questions_quiz on questions(quiz_id);
create index if not exists idx_attempts_quiz on quiz_attempts(quiz_id);
create index if not exists idx_answers_attempt on answers(attempt_id);
create index if not exists idx_chunks_material on source_chunks(material_id);
