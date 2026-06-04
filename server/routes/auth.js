const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// @route   POST api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Simple validation
  if (!username || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  // Retrieve admin config
  const configUsername = process.env.ADMIN_USERNAME || 'admin';
  const configPassword = process.env.ADMIN_PASSWORD || 'admin12345';

  if (username !== configUsername || password !== configPassword) {
    return res.status(400).json({ message: 'Invalid admin credentials' });
  }

  // Create JWT Payload
  const payload = {
    user: {
      username: configUsername,
      role: 'admin',
    },
  };

  // Sign token
  jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }, // Token valid for 7 days
    (err, token) => {
      if (err) throw err;
      res.json({ token, username: configUsername });
    }
  );
});

module.exports = router;
