const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required' });
    }
    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'role must be "teacher" or "student"' });
    }

    const existing = await pool.query('select id from users where email = $1', [email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `insert into users (name, email, password_hash, role)
       values ($1, $2, $3, $4)
       returning id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('select * from users where email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    delete user.password_hash;
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not log in' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query(
    'select id, name, email, role, avatar_url, created_at from users where id = $1',
    [req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json({ user: result.rows[0] });
});

module.exports = router;
