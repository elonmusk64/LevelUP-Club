const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');

// @route   GET /api/xp
// @desc    Get XP log and total XP for user
// @access  Private
// router.get('/', verifyToken, async (req, res) => {
//   const userId = req.user.id;

//   try {
//     // Fetch all XP logs
//     const xpLogResult = await pool.query(
//       `SELECT action, xp_points, created_at FROM xp_logs WHERE user_id = $1 ORDER BY created_at DESC`,
//       [userId]
//     );

//     // Calculate total XP
//     const totalXP = xpLogResult.rows.reduce((sum, row) => sum + row.xp_points, 0);
//   const level = getLevelName(totalXP);
//     res.status(200).json({
//       msg: 'XP logs fetched successfully!',
//       total_xp: totalXP,
//          level: level,
//       logs: xpLogResult.rows,
//     });
//   } catch (err) {
//     console.error('Error fetching XP logs:', err.message);
//     res.status(500).send('Server error');
//   }
// });
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const xpLogResult = await pool.query(
      `SELECT action, xp_points, created_at FROM xp_logs WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const totalXP = xpLogResult.rows.reduce((sum, row) => sum + row.xp_points, 0);
    const level = getLevelName(totalXP);

    res.status(200).json({
      msg: 'XP logs fetched successfully!',
      total_xp: totalXP,
      level: level,
      logs: xpLogResult.rows,
    });
  } catch (err) {
    console.error(' Error fetching XP logs:', err.message);
    res.status(500).send('Server error');
  }
});

// XP & Level calculation
router.get('/progress', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Total XP earned
    const xpResult = await pool.query(
      `SELECT COALESCE(SUM(xp_points), 0) AS total_xp FROM xp_logs WHERE user_id = $1`,
      [userId]
    );
    const totalXp = parseInt(xpResult.rows[0].total_xp, 10);

    // 2. Level calculation logic
    // Example: Every 100 XP = 1 Level
    const level = Math.floor(totalXp / 100) + 1;
    const xpForNextLevel = (level * 100) - totalXp;

    res.json({
      totalXp,
      level,
      xpForNextLevel,
      xpProgressPercent: ((totalXp % 100) / 100) * 100
    });
  } catch (err) {
    console.error('Error fetching XP progress:', err.message);
    res.status(500).json({ message: 'Server error fetching XP progress' });
  }
});


// Function to determine level name based on XP
function getLevelName(xp) {
  if (xp < 100) return ' Newbie';
  else if (xp < 300) return ' Learner';
  else if (xp < 700) return ' Achiever';
  else return ' Master';
}

module.exports = router;
