const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid');

// @route   POST /api/achievements
// @desc    Add new achievement
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  const { title, description, image_url, category } = req.body;
  const userId = req.user.id;

  if (!title || !category) {
    return res.status(400).json({ msg: 'Title and category are required' });
  }

  try {
    const newAchievement = await pool.query(
      `INSERT INTO achievements (id, user_id, title, description, image_url, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [uuidv4(), userId, title, description, image_url, category]
    );
    // Inside POST /api/achievements route, after adding achievement
     await pool.query(
        `INSERT INTO xp_logs (id, user_id, action, xp_points)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), userId, 'Added an achievement', 50]
     );


    res.status(201).json({
      msg: 'Achievement added successfully!',
      achievement: newAchievement.rows[0],
    });
  } catch (err) {
    console.error('Error adding achievement:', err.message);
    res.status(500).send('Server error');
  }
});
// @route   GET /api/achievements
// @desc    Get all achievements of the logged-in user
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM achievements WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      msg: 'Achievements fetched successfully!',
      achievements: result.rows,
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});
// @route   DELETE /api/achievements/:id
// @desc    Delete an achievement and subtract XP
// @access  Private
router.delete('/:id', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const achievementId = req.params.id;

  try {
    // 1. Check if achievement exists & belongs to user
    const achievement = await pool.query(
      `SELECT * FROM achievements WHERE id = $1 AND user_id = $2`,
      [achievementId, userId]
    );

    if (achievement.rows.length === 0) {
      return res.status(404).json({ msg: 'Achievement not found or unauthorized' });
    }

    // 2. Delete it
    await pool.query(`DELETE FROM achievements WHERE id = $1`, [achievementId]);

    // 3. Insert XP rollback
    await pool.query(
      `INSERT INTO xp_logs (id, user_id, action, xp_points)
       VALUES ($1, $2, $3, $4)`,
      [uuidv4(), userId, 'Deleted an achievement', -50]
    );

    res.status(200).json({ msg: 'Achievement deleted and XP deducted.' });
  } catch (err) {
    console.error(' Error deleting achievement:', err.message);
    res.status(500).send('Server error');
  }
});
// @route   PUT /api/achievements/:id
// @desc    Update an achievement
// @access  Private
router.put('/:id', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const achievementId = req.params.id;
  const { title, description, image_url, category } = req.body;

  try {
    // 1. Check if the achievement exists and belongs to the user
    const check = await pool.query(
      `SELECT * FROM achievements WHERE id = $1 AND user_id = $2`,
      [achievementId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ msg: 'Achievement not found or unauthorized' });
    }

    // 2. Update the achievement
    const updated = await pool.query(
      `UPDATE achievements
       SET title = $1,
           description = $2,
           image_url = $3,
           category = $4
       WHERE id = $5
       RETURNING *`,
      [title, description, image_url, category, achievementId]
    );

    res.status(200).json({
      msg: 'Achievement updated successfully!',
      achievement: updated.rows[0],
    });
  } catch (err) {
    console.error(' Error updating achievement:', err.message);
    res.status(500).send('Server error');
  }
});


module.exports = router;
