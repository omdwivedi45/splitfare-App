const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// GET /api/users/:id - Public profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name avatar rating ratingCount totalRides city role verificationStatus createdAt gender');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id/stats
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('totalRides totalSavings co2Saved rating walletBalance');
    res.json({ stats: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
