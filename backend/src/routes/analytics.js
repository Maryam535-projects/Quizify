const express = require('express');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const avgScore = await pool.query(
      `select coalesce(avg(case when a.max_score > 0 then a.score / a.max_score * 100 end), 0) as avg_pct
       from quiz_attempts a
       join quizzes q on q.id = a.quiz_id
       where q.created_by = $1 and a.status = 'graded'`,
      [req.user.id]
    );

    const engagement = await pool.query(
      `select count(distinct e.student_id)::int as enrolled,
              count(distinct a.student_id)::int as active
       from classes c
       left join enrollments e on e.class_id = c.id
       left join quizzes q on q.class_id = c.id
       left join quiz_attempts a on a.quiz_id = q.id
       where c.teacher_id = $1`,
      [req.user.id]
    );

    const cheating = await pool.query(
      `select coalesce(avg(a.anomaly_score), 0) as avg_anomaly
       from quiz_attempts a
       join quizzes q on q.id = a.quiz_id
       where q.created_by = $1`,
      [req.user.id]
    );

    res.json({
      avgScore: Number(avgScore.rows[0].avg_pct).toFixed(1),
      enrolled: engagement.rows[0].enrolled,
      active: engagement.rows[0].active,
      integrityScore: (100 - Number(cheating.rows[0].avg_anomaly)).toFixed(1),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load analytics overview' });
  }
});

router.get('/performance-by-class', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      `select c.name as class_name,
              coalesce(avg(case when a.max_score > 0 then a.score / a.max_score * 100 end), 0) as avg_pct
       from classes c
       left join quizzes q on q.class_id = c.id
       left join quiz_attempts a on a.quiz_id = q.id and a.status = 'graded'
       where c.teacher_id = $1
       group by c.name
       order by c.name`,
      [req.user.id]
    );
    res.json({ performance: result.rows.map((r) => ({ className: r.class_name, avgScore: Number(r.avg_pct).toFixed(1) })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load performance data' });
  }
});

router.get('/cheating', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const result = await pool.query(
      `select u.id, u.name, u.email, a.anomaly_score, q.title as quiz_title
       from quiz_attempts a
       join quizzes q on q.id = a.quiz_id
       join users u on u.id = a.student_id
       where q.created_by = $1 and a.anomaly_score > 0
       order by a.anomaly_score desc
       limit 20`,
      [req.user.id]
    );
    res.json({ flagged: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load cheating analytics' });
  }
});

module.exports = router;
