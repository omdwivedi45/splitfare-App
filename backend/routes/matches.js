const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const { auth } = require('../middleware/auth');

// GET /api/matches/pending - Pending match requests for my rides
router.get('/pending', auth, async (req, res) => {
  try {
    const rides = await Ride.find({
      postedBy: req.user._id,
      'matches.status': 'pending'
    }).populate('matches.user', 'name phone avatar rating totalRides verificationStatus');
    const pending = [];
    rides.forEach(ride => {
      ride.matches.filter(m => m.status === 'pending').forEach(m => {
        pending.push({ ride: { _id: ride._id, origin: ride.origin, destination: ride.destination, departureTime: ride.departureTime }, match: m });
      });
    });
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
