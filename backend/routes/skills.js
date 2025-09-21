const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// @route   POST /api/skills
// @desc    Add a new skill
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  const { skill_name, skill_level } = req.body;
  const userId = req.user.id;

  if (!skill_name || !skill_level) {
    return res.status(400).json({ msg: 'Please provide skill name and level' });
  }

  try {
    const newSkill = await pool.query(
      `INSERT INTO skills (id, user_id, skill_name, skill_level)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uuidv4(), userId, skill_name, skill_level]
    );
      // ✅ XP log for skill addition
    await pool.query(
      `INSERT INTO xp_logs (id, user_id, action, xp_points)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), userId, 'Added a skill', 30] // You can set XP to whatever you want
    );

    res.status(201).json({
      msg: 'Skill added successfully and XP awarded!',
      skill: newSkill.rows[0],
    });
  } catch (err) {
    console.error('Error inserting skill:', err.message);
    res.status(500).send('Server error');
  }
});
// end of the post route  ---------
// @route   GET /api/skills
// @desc    Get all skills of the logged-in user
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const skills = await pool.query(
      `SELECT * FROM skills WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      msg: 'Skills fetched successfully!',
      skills: skills.rows,
    });
  } catch (err) {
    console.error('Error fetching skills:', err.message);
    res.status(500).send('Server error');
  }
});
// @route   DELETE /api/skills/:id
// @desc    Delete a skill and subtract XP
// @access  Private
router.delete('/:id', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const skillId = req.params.id;

  try {
    // 1. Check if the skill exists and belongs to the user
    const skillResult = await pool.query(
      `SELECT * FROM skills WHERE id = $1 AND user_id = $2`,
      [skillId, userId]
    );

    if (skillResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Skill not found or not authorized' });
    }

    // 2. Delete the skill
    await pool.query(`DELETE FROM skills WHERE id = $1`, [skillId]);

    // 3. Add a negative XP log
    await pool.query(
      `INSERT INTO xp_logs (id, user_id, action, xp_points)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), userId, 'Deleted a skill', -30]
    );

    res.status(200).json({ msg: 'Skill deleted and XP deducted.' });
  } catch (err) {
    console.error(' Error deleting skill:', err.message);
    res.status(500).send('Server error');
  }
});
// @route   PUT /api/skills/:id
// @desc    Update a skill's name or level
// @access  Private
router.put('/:id', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const skillId = req.params.id;
  const { skill_name, skill_level } = req.body;

  try {
    // 1. Check if skill exists and belongs to user
    const skillResult = await pool.query(
      `SELECT * FROM skills WHERE id = $1 AND user_id = $2`,
      [skillId, userId]
    );

    if (skillResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Skill not found or not authorized' });
    }

    // 2. Update skill
    const updatedSkill = await pool.query(
      `UPDATE skills
       SET skill_name = $1, skill_level = $2
       WHERE id = $3
       RETURNING *`,
      [skill_name, skill_level, skillId]
    );

    res.status(200).json({
      msg: 'Skill updated successfully!',
      skill: updatedSkill.rows[0],
    });
  } catch (err) {
    console.error(' Error updating skill:', err.message);
    res.status(500).send('Server error');
  }
});



module.exports = router;
