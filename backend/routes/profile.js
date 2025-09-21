// routes/profile.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');

// @route   GET /api/profile
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const userResult = await pool.query(
      `SELECT id, name, email, role, bio, profile_pic, created_at FROM users WHERE id = $1`,
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const xpResult = await pool.query(
      `SELECT COALESCE(SUM(xp_points), 0) AS total_xp FROM xp_logs WHERE user_id = $1`,
      [userId]
    );
    const xp = parseInt(xpResult.rows[0].total_xp);
    const level = Math.floor(xp / 100);

    const skills = await pool.query(
      `SELECT id, skill_name, skill_level FROM skills WHERE user_id = $1`,
      [userId]
    );

    const achievements = await pool.query(
      `SELECT id, title, description, image_url, category FROM achievements WHERE user_id = $1`,
      [userId]
    );

    res.json({
      user,
      xp,
      level,
      skills: skills.rows,
      achievements: achievements.rows,
    });
  } catch (err) {
    console.error(' Profile Error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
