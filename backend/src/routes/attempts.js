const express = require('express');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { gradeSubjectiveAnswer } = require('../lib/aiClient');

const router = express.Router();

// Student starts (or resumes) an attempt
router.post('/start/:quizId', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const existing = await pool.query(
      'select * from quiz_attempts where quiz_id = $1 and student_id = $2',
      [req.params.quizId, req.user.id]
    );
    if (existing.rows[0]) return res.json({ attempt: existing.rows[0] });

    const result = await pool.query(
      `insert into quiz_attempts (quiz_id, student_id) values ($1, $2) returning *`,
      [req.params.quizId, req.user.id]
    );
    res.status(201).json({ attempt: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not start quiz attempt' });
  }
});

// Save / update a single answer (auto-save as the student progresses)
router.put('/:attemptId/answers/:questionId', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { attemptId, questionId } = req.params;
    const { answerText } = req.body;

    const owns = await pool.query('select id from quiz_attempts where id = $1 and student_id = $2', [attemptId, req.user.id]);
    if (!owns.rows[0]) return res.status(404).json({ error: 'Attempt not found' });

    await pool.query(
      `insert into answers (attempt_id, question_id, answer_text)
       values ($1, $2, $3)
       on conflict (attempt_id, question_id)
       do update set answer_text = excluded.answer_text`,
      [attemptId, questionId, answerText]
    );
    res.json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save answer' });
  }
});

// Client-side anomaly signal (tab blur, paste, dev tools, etc.)
router.post('/:attemptId/anomaly', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { eventType, detail } = req.body;
    await pool.query(
      `insert into anomaly_events (attempt_id, event_type, detail) values ($1, $2, $3)`,
      [req.params.attemptId, eventType, detail || null]
    );

    const weights = { tab_blur: 8, paste: 15, dev_tools: 25, copy: 5, fast_answer: 10 };
    const events = await pool.query('select event_type from anomaly_events where attempt_id = $1', [req.params.attemptId]);
    const score = Math.min(100, events.rows.reduce((sum, e) => sum + (weights[e.event_type] || 5), 0));

    await pool.query('update quiz_attempts set anomaly_score = $1 where id = $2', [score, req.params.attemptId]);
    res.json({ anomalyScore: score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not log anomaly event' });
  }
});

// Submit the attempt: auto-grade objective questions, queue subjective ones for AI grading
router.post('/:attemptId/submit', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await pool.query('select * from quiz_attempts where id = $1 and student_id = $2', [attemptId, req.user.id]);
    if (!attempt.rows[0]) return res.status(404).json({ error: 'Attempt not found' });

    const questions = await pool.query('select * from questions where quiz_id = $1 order by order_index', [attempt.rows[0].quiz_id]);
    const answers = await pool.query('select * from answers where attempt_id = $1', [attemptId]);
    const answerMap = Object.fromEntries(answers.rows.map((a) => [a.question_id, a]));

    let score = 0;
    let maxScore = 0;
    let hasSubjective = false;

    console.log(`\n=== Grading Attempt ${attemptId} ===`);
    console.log(`Total questions: ${questions.rows.length}`);

    for (const q of questions.rows) {
      const points = Number(q.points) || 1;
      maxScore += points;
      const ans = answerMap[q.id];
      
      if (!ans) {
        console.log(`Q${q.id}: No answer submitted (${points} pts) - Score: 0`);
        continue;
      }

      if (q.question_type === 'objective') {
        // Case-insensitive matching
        const studentAnswer = (ans.answer_text || '').trim().toLowerCase();
        const correctAnswer = (q.correct_answer || '').trim().toLowerCase();
        const isCorrect = studentAnswer === correctAnswer;

        if (isCorrect) {
          score += points;
        }

        await pool.query(
          'update answers set is_correct = $1, ai_grade = $2, graded_at = now() where id = $3',
          [isCorrect, isCorrect ? points : 0, ans.id]
        );

        console.log(`Q${q.id}: Student="${studentAnswer}" | Correct="${correctAnswer}" | Match=${isCorrect} | Score: ${isCorrect ? points : 0}/${points}`);
      } else {
        hasSubjective = true;
        try {
          const graded = await gradeSubjectiveAnswer({
            questionText: q.question_text,
            modelAnswer: q.correct_answer,
            studentAnswer: ans.answer_text || '',
            maxPoints: points,
          });

          const earnedPoints = Number(graded.grade) || 0;
          score += earnedPoints;

          await pool.query(
            'update answers set ai_grade = $1, ai_feedback = $2, graded_at = now() where id = $3',
            [earnedPoints, graded.feedback || 'Graded by AI', ans.id]
          );

          console.log(`Q${q.id}: Subjective | AI Grade: ${earnedPoints}/${points}`);
        } catch (aiErr) {
          console.error(`Q${q.id}: AI grading failed - ${aiErr.message}`);
          await pool.query(
            'update answers set ai_grade = 0, ai_feedback = $1, graded_at = now() where id = $2',
            ['AI grading failed - needs manual review', ans.id]
          );
        }
      }
    }

    console.log(`\n=== Final Score: ${score}/${maxScore} ===\n`);

    const result = await pool.query(
      `update quiz_attempts set submitted_at = now(), score = $1, max_score = $2, status = 'graded' where id = $3 returning *`,
      [score, maxScore, attemptId]
    );

    res.json({ attempt: result.rows[0] });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Could not submit quiz' });
  }
});

// Teacher: list all attempts for a quiz (Evaluations page)
router.get('/quiz/:quizId', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      `select a.*, u.name as student_name, u.email as student_email
       from quiz_attempts a
       join users u on u.id = a.student_id
       where a.quiz_id = $1
       order by a.submitted_at desc nulls last`,
      [req.params.quizId]
    );
    res.json({ attempts: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load attempts' });
  }
});

// Teacher: detailed view of one attempt (answers + AI grades, for override)
router.get('/:attemptId', requireAuth, async (req, res) => {
  try {
    const attempt = await pool.query('select * from quiz_attempts where id = $1', [req.params.attemptId]);
    if (!attempt.rows[0]) return res.status(404).json({ error: 'Attempt not found' });

    if (req.user.role === 'student' && attempt.rows[0].student_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your attempt' });
    }

    const answers = await pool.query(
      `select a.*, q.question_text, q.question_type, q.correct_answer, q.points
       from answers a join questions q on q.id = a.question_id
       where a.attempt_id = $1 order by q.order_index`,
      [req.params.attemptId]
    );

    res.json({ attempt: attempt.rows[0], answers: answers.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load attempt detail' });
  }
});

// Teacher: override an AI-suggested grade for one answer
router.patch('/answers/:answerId/override', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { grade } = req.body;
    const result = await pool.query(
      'update answers set teacher_override_grade = $1 where id = $2 returning *',
      [grade, req.params.answerId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Answer not found' });

    const answer = result.rows[0];
    const allAnswers = await pool.query('select ai_grade, teacher_override_grade from answers where attempt_id = $1', [answer.attempt_id]);
    const total = allAnswers.rows.reduce((sum, a) => sum + Number(a.teacher_override_grade ?? a.ai_grade ?? 0), 0);
    await pool.query('update quiz_attempts set score = $1 where id = $2', [total, answer.attempt_id]);

    res.json({ answer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not override grade' });
  }
});

module.exports = router;