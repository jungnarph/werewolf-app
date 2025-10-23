const router = require('express').Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const { User } = require('../models');

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password_hash });
    
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      res.status(201).json({ 
        id: user.id, 
        username: user.username, 
        email: user.email 
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ 
    id: req.user.id, 
    username: req.user.username, 
    email: req.user.email 
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ 
    id: req.user.id, 
    username: req.user.username, 
    email: req.user.email 
  });
});

module.exports = router;