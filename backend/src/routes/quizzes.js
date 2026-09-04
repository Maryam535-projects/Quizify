const express = require('express');
const multer = require('multer');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { chunkText } = require('../lib/chunkText');
const { retrieveRelevantChunks, generateQuiz } = require('../lib/aiClient');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Students: list quizzes for their enrolled classes. Teachers: list quizzes they created.
router.get('/', requireAuth, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'teacher') {
      result = await pool.query(
        `select q.*, c.name as class_name
         from quizzes q
         join classes c on c.id = q.class_id
         where q.created_by = $1
         order by q.created_at desc`,
        [req.user.id]
      );
    } else {
      result = await pool.query(
        `select q.*, c.name as class_name,
                a.id as attempt_id, a.status as attempt_status, a.score, a.max_score
         from quizzes q
         join classes c on c.id = q.class_id
         join enrollments e on e.class_id = c.id and e.student_id = $1
         left join quiz_attempts a on a.quiz_id = q.id and a.student_id = $1
         where q.status = 'published'
         order by q.created_at desc`,
        [req.user.id]
      );
    }
    res.json({ quizzes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load quizzes' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const quiz = await pool.query('select * from quizzes where id = $1', [req.params.id]);
    if (!quiz.rows[0]) return res.status(404).json({ error: 'Quiz not found' });

    const includeAnswers = req.user.role === 'teacher';
    const questions = await pool.query(
      `select id, order_index, question_text, question_type, options, points
              ${includeAnswers ? ', correct_answer' : ''}
       from questions where quiz_id = $1 order by order_index`,
      [req.params.id]
    );

    res.json({ quiz: quiz.rows[0], questions: questions.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load quiz' });
  }
});

/**
 * Upload source material (PDF text already extracted client-side, or raw text/.txt)
 * and chunk it for later RAG-based quiz generation.
 */
router.post('/source-material', requireAuth, requireRole('teacher'), upload.single('file'), async (req, res) => {
  try {
    const { classId, text: rawTextBody } = req.body;
    let rawText = rawTextBody;
    let fileName = null;

    if (req.file) {
      fileName = req.file.originalname;
      rawText = req.file.buffer.toString('utf-8');
    }

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Provide a text file or a "text" field with source content' });
    }

    const material = await pool.query(
      `insert into source_materials (class_id, uploaded_by, file_name, raw_text)
       values ($1, $2, $3, $4) returning id`,
      [classId || null, req.user.id, fileName, rawText]
    );
    const materialId = material.rows[0].id;

    const chunks = chunkText(rawText);
    for (let i = 0; i < chunks.length; i++) {
      await pool.query(
        `insert into source_chunks (material_id, chunk_index, content) values ($1, $2, $3)`,
        [materialId, i, chunks[i]]
      );
    }

    res.status(201).json({ materialId, chunkCount: chunks.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not process source material' });
  }
});

/**
 * AI-generate a quiz (RAG over the uploaded source material) and save it as a draft.
 */
router.post('/generate', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const {
      title,
      classId,
      materialId,
      totalQuestions = 10,
      difficulty = 5,
      questionTypes = { objective: true, subjective: false },
    } = req.body;

    if (!title || !classId) {
      return res.status(400).json({ error: 'title and classId are required' });
    }

    let contextChunks = [];
    if (materialId) {
      const chunksResult = await pool.query(
        'select content from source_chunks where material_id = $1 order by chunk_index',
        [materialId]
      );
      contextChunks = retrieveRelevantChunks(chunksResult.rows, title, 8);
    }

    if (contextChunks.length === 0) {
      return res.status(400).json({
        error: 'No source material found. Upload source material first via /api/quizzes/source-material.',
      });
    }

    const generated = await generateQuiz({
      topic: title,
      contextChunks,
      totalQuestions: Number(totalQuestions),
      difficulty: Number(difficulty),
      questionTypes,
    });

    const quizResult = await pool.query(
      `insert into quizzes (title, class_id, created_by, material_id, difficulty, question_types, total_questions, status)
       values ($1, $2, $3, $4, $5, $6, $7, 'draft') returning *`,
      [title, classId, req.user.id, materialId || null, difficulty, JSON.stringify(questionTypes), generated.length]
    );
    const quiz = quizResult.rows[0];

    for (let i = 0; i < generated.length; i++) {
      const q = generated[i];
      await pool.query(
        `insert into questions (quiz_id, order_index, question_text, question_type, options, correct_answer, points)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [quiz.id, i, q.question_text, q.question_type, q.options ? JSON.stringify(q.options) : null, q.correct_answer, q.points || 1]
      );
    }

    res.status(201).json({ quiz, questionCount: generated.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'AI quiz generation failed' });
  }
});

// Manually create a quiz + questions (no AI)
router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { title, classId, questions = [], durationMinutes = 20 } = req.body;
    if (!title || !classId) return res.status(400).json({ error: 'title and classId are required' });

    const quizResult = await pool.query(
      `insert into quizzes (title, class_id, created_by, total_questions, duration_minutes, status)
       values ($1, $2, $3, $4, $5, 'draft') returning *`,
      [title, classId, req.user.id, questions.length, durationMinutes]
    );
    const quiz = quizResult.rows[0];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await pool.query(
        `insert into questions (quiz_id, order_index, question_text, question_type, options, correct_answer, points)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [quiz.id, i, q.question_text, q.question_type, q.options ? JSON.stringify(q.options) : null, q.correct_answer, q.points || 1]
      );
    }

    res.status(201).json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create quiz' });
  }
});

router.patch('/:id/publish', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      `update quizzes set status = 'published' where id = $1 and created_by = $2 returning *`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ quiz: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not publish quiz' });
  }
});

module.exports = router;
