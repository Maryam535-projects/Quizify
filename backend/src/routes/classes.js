const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { pool } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// List classes - teachers see classes they own, students see classes they're enrolled in
router.get('/', requireAuth, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'teacher') {
      result = await pool.query(
        `select c.*, count(e.id)::int as student_count
         from classes c
         left join enrollments e on e.class_id = c.id
         where c.teacher_id = $1
         group by c.id
         order by c.created_at desc`,
        [req.user.id]
      );
    } else {
      result = await pool.query(
        `select c.*
         from classes c
         join enrollments e on e.class_id = c.id
         where e.student_id = $1
         order by c.created_at desc`,
        [req.user.id]
      );
    }
    res.json({ classes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load classes' });
  }
});

router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { name, section, subject, session } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const result = await pool.query(
      `insert into classes (name, section, subject, session, teacher_id) values ($1, $2, $3, $4, $5) returning *`,
      [name, section || null, subject || null, session || null, req.user.id]
    );
    res.status(201).json({ class: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create class' });
  }
});

// Update a class
router.put('/:classId', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, section, subject, session } = req.body;

    const owner = await pool.query('select id from classes where id = $1 and teacher_id = $2', [classId, req.user.id]);
    if (!owner.rows[0]) return res.status(404).json({ error: 'Class not found' });

    if (!name) return res.status(400).json({ error: 'name is required' });

    const result = await pool.query(
      `update classes set name = $1, section = $2, subject = $3, session = $4 where id = $5 and teacher_id = $6 returning *`,
      [name, section || null, subject || null, session || null, classId, req.user.id]
    );

    res.json({ class: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update class' });
  }
});

// Delete a class
router.delete('/:classId', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { classId } = req.params;

    const owner = await pool.query('select id from classes where id = $1 and teacher_id = $2', [classId, req.user.id]);
    if (!owner.rows[0]) return res.status(404).json({ error: 'Class not found' });

    await pool.query('delete from enrollments where class_id = $1', [classId]);
    await pool.query('delete from classes where id = $1 and teacher_id = $2', [classId, req.user.id]);

    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete class' });
  }
});

// Enroll a single student by email with roll number
router.post('/:classId/students', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { email, roll_number } = req.body;

    const owner = await pool.query('select id from classes where id = $1 and teacher_id = $2', [classId, req.user.id]);
    if (!owner.rows[0]) return res.status(404).json({ error: 'Class not found' });

    const student = await pool.query('select id, name, email from users where email = $1 and role = $2', [email, 'student']);
    if (!student.rows[0]) return res.status(404).json({ error: `No student account found for ${email}` });

    await pool.query(
      `insert into enrollments (class_id, student_id, roll_number) values ($1, $2, $3)
       on conflict (class_id, student_id) do update set roll_number = $3`,
      [classId, student.rows[0].id, roll_number || null]
    );

    res.status(201).json({ student: student.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not enroll student' });
  }
});

// Bulk enroll students via Excel upload
router.post('/:classId/students/bulk', requireAuth, requireRole('teacher'), upload.single('file'), async (req, res) => {
  try {
    const { classId } = req.params;

    // Check if class belongs to this teacher
    const owner = await pool.query('select id from classes where id = $1 and teacher_id = $2', [classId, req.user.id]);
    if (!owner.rows[0]) return res.status(404).json({ error: 'Class not found' });

    if (!req.file) return res.status(400).json({ error: 'Excel file is required' });

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) return res.status(400).json({ error: 'Excel file is empty' });

    const results = { enrolled: [], skipped: [], new_accounts: [] };
    const defaultPassword = await bcrypt.hash('student123', 10); // Default password for new accounts

    for (const row of data) {
      try {
        const name = row.name || row.Name || row.NAME;
        const email = row.email || row.Email || row.EMAIL;
        const roll_number = row.roll_number || row.roll || row.RollNo || row['Roll No'] || row['Roll Number'] || null;

        if (!name || !email) {
          results.skipped.push({ row, reason: 'Missing name or email' });
          continue;
        }

        // Check if student exists
        let student = await pool.query('select id, name, email from users where email = $1', [email]);

        // If student doesn't exist, create account
        if (!student.rows[0]) {
          student = await pool.query(
            `insert into users (name, email, password, role) values ($1, $2, $3, 'student') returning id, name, email`,
            [name, email, defaultPassword]
          );
          results.new_accounts.push({ name, email });
        }

        // Enroll student in class
        await pool.query(
          `insert into enrollments (class_id, student_id, roll_number) values ($1, $2, $3)
           on conflict (class_id, student_id) do update set roll_number = $3`,
          [classId, student.rows[0].id, roll_number]
        );

        results.enrolled.push({ name, email, roll_number });
      } catch (err) {
        results.skipped.push({ row, reason: err.message });
      }
    }

    res.json({
      message: `Enrolled: ${results.enrolled.length}, New accounts: ${results.new_accounts.length}, Skipped: ${results.skipped.length}`,
      ...results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not process Excel file' });
  }
});

// Remove a student from class
router.delete('/:classId/students/:studentId', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const owner = await pool.query('select id from classes where id = $1 and teacher_id = $2', [classId, req.user.id]);
    if (!owner.rows[0]) return res.status(404).json({ error: 'Class not found' });

    await pool.query('delete from enrollments where class_id = $1 and student_id = $2', [classId, studentId]);

    res.json({ message: 'Student removed from class' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove student' });
  }
});

// Get students with roll numbers
router.get('/:classId/students', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `select u.id, u.name, u.email, e.roll_number, e.created_at as enrolled_at
       from enrollments e
       join users u on u.id = e.student_id
       where e.class_id = $1
       order by e.roll_number asc, u.name asc`,
      [req.params.classId]
    );
    res.json({ students: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load students' });
  }
});

module.exports = router;