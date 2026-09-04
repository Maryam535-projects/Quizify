const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { parse } = require('csv-parse/sync');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * Bulk-create student accounts and (optionally) enroll them into a class
 * from a CSV file. Expected columns: name, email, class_id (optional).
 * Students get a randomly generated temporary password; in production you'd
 * email this to them or use a magic-link / invite flow instead.
 */
router.post('/bulk-upload', requireAuth, requireRole('teacher'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file is required (field name "file")' });

  try {
    const records = parse(req.file.buffer.toString('utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const classId = req.body.classId || null;
    const created = [];
    const skipped = [];

    for (const row of records) {
      const name = row.name || row.Name;
      const email = (row.email || row.Email || '').toLowerCase();
      if (!name || !email) {
        skipped.push({ row, reason: 'missing name or email' });
        continue;
      }

      const existing = await pool.query('select id from users where email = $1', [email]);
      let studentId;

      if (existing.rows[0]) {
        studentId = existing.rows[0].id;
      } else {
        const tempPassword = Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        const inserted = await pool.query(
          `insert into users (name, email, password_hash, role) values ($1, $2, $3, 'student') returning id`,
          [name, email, passwordHash]
        );
        studentId = inserted.rows[0].id;
        created.push({ name, email, tempPassword });
      }

      if (classId) {
        await pool.query(
          `insert into enrollments (class_id, student_id) values ($1, $2)
           on conflict (class_id, student_id) do nothing`,
          [classId, studentId]
        );
      }
    }

    res.json({
      message: `Processed ${records.length} rows`,
      createdAccounts: created,
      skipped,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not process CSV file' });
  }
});

module.exports = router;
