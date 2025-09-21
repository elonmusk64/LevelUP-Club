// routes/tasks.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware'); // ✅ your style

// GET /api/tasks → get all assigned tasks for a user (today)
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Step 1: Assign new tasks if not already assigned today
    const assignedToday = await pool.query(
      `SELECT * FROM user_tasks WHERE user_id = $1 AND assigned_on = CURRENT_DATE`,
      [userId]
    );

    if (assignedToday.rows.length === 0) {
      const frequencies = ['daily', 'monthly', 'yearly'];

      for (const freq of frequencies) {
        const taskRes = await pool.query(
          `SELECT * FROM tasks WHERE frequency = $1 ORDER BY RANDOM() LIMIT 1`,
          [freq]
        );

        if (taskRes.rows.length > 0) {
          const task = taskRes.rows[0];

          await pool.query(
            `INSERT INTO user_tasks (user_id, task_id, assigned_on) VALUES ($1, $2, CURRENT_DATE)`,
            [userId, task.id]
          );
        }
      }
    }

    // Step 2: Get assigned tasks with task details
    const result = await pool.query(
      `SELECT ut.id AS user_task_id, ut.is_completed, ut.completed_at, ut.assigned_on,
              t.id AS task_id, t.title, t.description, t.xp_reward, t.frequency
       FROM user_tasks ut
       JOIN tasks t ON ut.task_id = t.id
       WHERE ut.user_id = $1
       ORDER BY t.frequency`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(' Fetch tasks error:', err.message);
    res.status(500).send('Server error');
  }
});
// POST /api/tasks/:id/complete
router.post('/:id/complete', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const userTaskId = req.params.id;

  try {
    const taskRes = await pool.query(
      `SELECT ut.id AS user_task_id, ut.is_completed, t.xp_reward
       FROM user_tasks ut
       JOIN tasks t ON ut.task_id = t.id
       WHERE ut.id = $1 AND ut.user_id = $2`,
      [userTaskId, userId]
    );

    const task = taskRes.rows[0];

    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.is_completed) return res.status(400).json({ msg: 'Task already completed' });

    // 1. Mark task as completed
    await pool.query(
      `UPDATE user_tasks SET is_completed = true, completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [userTaskId]
    );

    // 2. Add XP to xp_logs
    await pool.query(
      `INSERT INTO xp_logs (user_id, action, xp_points) VALUES ($1, $2, $3)`,
      [userId, 'Completed task', task.xp_reward]
    );

    res.status(200).json({ msg: 'Task completed & XP awarded!' });
  } catch (err) {
    console.error('Complete task error:', err.message);
    res.status(500).send('Server error');
  }
});

// Fetch completed tasks for the logged-in student
router.get('/completed', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const completedTasks = await prisma.completedTask.findMany({
            where: { userId },
            include: {
                task: true // get the original task info too
            },
        });

        res.status(200).json({ completedTasks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching completed tasks' });
    }
});
// having

module.exports = router;