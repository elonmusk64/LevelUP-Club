// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db'); // if needed

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Routes
app.use('/api/auth', require('./routes/auth')); // ⬅️ This makes /login and /register work

// ✅ Test Route
app.get('/', (req, res) => {
  res.send('LevelUp API is running 🚀');
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// sills route 
app.use('/api/skills', require('./routes/skills'));

// achivements route 
app.use('/api/achievements', require('./routes/achievements'));
//Total xp route 
app.use('/api/xp', require('./routes/xp'));
// Profile Route 
app.use('/api/profile', require('./routes/profile'));
// tasks route 
app.use('/api/tasks', require('./routes/tasks'));
// tasks completing fetching route 
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);
// xp route
app.use('/api/xp', require('./routes/xp'));
