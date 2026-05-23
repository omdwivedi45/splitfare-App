const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { auth } = require('../middleware/auth');

// Helper: Haversine distance in km
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Helper: Fare calculation
function calculateFare(distanceKm, vehicleType = 'car', splitCount = 2) {
  const baseRates = { bike: 8, car: 15, suv: 18, auto: 12 };
  const rate = baseRates[vehicleType] || 15;
  const totalFare = Math.round(distanceKm * rate + 30); // base charge ₹30
  const farePerPerson = Math.round(totalFare / splitCount);
  return { totalFare, farePerPerson };
}

// POST /api/rides - Post a ride
router.post('/', auth, async (req, res) => {
  try {
    const { role, origin, destination, departureTime, vehicle: vehicleId, seatsAvailable, preferences } = req.body;

    let vehicleData = null;
    if (role === 'driver') {
      vehicleData = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id, isActive: true });
      if (!vehicleData) return res.status(400).json({ message: 'Vehicle not found or not yours' });
    }

    const distance = getDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const seats = seatsAvailable || (role === 'rider' ? 1 : (vehicleData?.availableSeats || 1));
    const { totalFare, farePerPerson } = calculateFare(distance, vehicleData?.type || 'car', seats + 1);

    const ride = await Ride.create({
      postedBy: req.user._id,
      role,
      origin,
      destination,
      departureTime: new Date(departureTime),
      vehicle: role === 'driver' ? vehicleId : undefined,
      seatsAvailable: seats,
      estimatedDistance: parseFloat(distance.toFixed(2)),
      totalFare,
      farePerPerson,
      splitCount: seats + 1,
      preferences: preferences || {},
    });

    await ride.populate(['postedBy', 'vehicle']);
    res.status(201).json({ ride });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rides/find - Smart matching
router.get('/find', auth, async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng, role, departureTime, maxDistance = 3 } = req.query;
    const oLat = parseFloat(originLat), oLng = parseFloat(originLng);
    const dLat = parseFloat(destLat), dLng = parseFloat(destLng);
    const depTime = new Date(departureTime);
    const window = 60 * 60 * 1000; // ±1 hour

    // Find rides with opposite role
    const oppositeRole = role === 'rider' ? 'driver' : 'rider';
    const candidates = await Ride.find({
      role: oppositeRole,
      status: 'posted',
      postedBy: { $ne: req.user._id },
      departureTime: { $gte: new Date(depTime - window), $lte: new Date(depTime + window) },
      seatsAvailable: { $gte: 1 }
    }).populate('postedBy', 'name phone rating avatar totalRides verificationStatus')
      .populate('vehicle');

    // Score and filter by proximity
    const scored = candidates
      .map(ride => {
        const originDist = getDistance(oLat, oLng, ride.origin.lat, ride.origin.lng);
        const destDist = getDistance(dLat, dLng, ride.destination.lat, ride.destination.lng);
        const routeMatch = Math.max(0, 100 - (originDist + destDist) * 10);
        return { ride, originDist, destDist, routeMatch: Math.round(routeMatch) };
      })
      .filter(({ originDist, destDist }) => originDist <= maxDistance && destDist <= maxDistance)
      .sort((a, b) => b.routeMatch - a.routeMatch)
      .slice(0, 10);

    res.json({ matches: scored });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rides/my - My rides
router.get('/my', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { postedBy: req.user._id };
    if (status) filter.status = status;
    const rides = await Ride.find(filter)
      .populate('vehicle').populate('matches.user', 'name phone avatar rating')
      .sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit);
    const total = await Ride.countDocuments(filter);
    res.json({ rides, total, page: +page, pages: Math.ceil(total/limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rides/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('postedBy', 'name phone avatar rating city')
      .populate('vehicle')
      .populate('matches.user', 'name phone avatar rating');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/request - Request to join a ride
router.post('/:id/request', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.postedBy.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot request your own ride' });
    if (ride.status !== 'posted') return res.status(400).json({ message: 'Ride not available' });
    if (ride.seatsAvailable <= ride.seatsBooked) return res.status(400).json({ message: 'No seats available' });

    const alreadyRequested = ride.matches.find(m => m.user?.toString() === req.user._id.toString());
    if (alreadyRequested) return res.status(400).json({ message: 'Already requested' });

    ride.matches.push({ user: req.user._id, status: 'pending', joinedAt: new Date() });
    await ride.save();

    // Notify driver/poster via socket
    const io = req.app.get('io');
    io.to(`user:${ride.postedBy}`).emit('ride_request', {
      rideId: ride._id,
      fromUser: req.user.name,
      message: `${req.user.name} wants to join your ride`
    });

    res.json({ message: 'Ride request sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/accept/:userId - Accept a rider
router.post('/:id/accept/:userId', auth, async (req, res) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const matchIdx = ride.matches.findIndex(m => m.user?.toString() === req.params.userId);
    if (matchIdx === -1) return res.status(404).json({ message: 'Match not found' });

    ride.matches[matchIdx].status = 'accepted';
    ride.seatsBooked += 1;
    if (ride.seatsBooked >= ride.seatsAvailable) ride.status = 'matched';

    await ride.save();

    const io = req.app.get('io');
    io.to(`user:${req.params.userId}`).emit('match_confirmed', {
      rideId: ride._id,
      driverId: req.user._id,
      message: 'Your ride request was accepted!'
    });

    res.json({ ride });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/start - Start ride
router.post('/:id/start', auth, async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user._id },
      { status: 'in_progress', actualStartTime: new Date() },
      { new: true }
    );
    const io = req.app.get('io');
    ride.matches.filter(m => m.status === 'accepted').forEach(m => {
      io.to(`user:${m.user}`).emit('ride_started', { rideId: ride._id });
    });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/complete - Complete ride
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user._id },
      { status: 'completed', actualEndTime: new Date() },
      { new: true }
    );
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalRides: 1, co2Saved: ride.estimatedDistance * 0.12 } });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/cancel
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user._id, status: { $in: ['posted','matched'] } },
      { status: 'cancelled', cancelReason: req.body.reason || '', cancelledBy: req.user._id },
      { new: true }
    );
    if (!ride) return res.status(404).json({ message: 'Ride not found or cannot be cancelled' });
    res.json({ ride });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rides/:id/rate - Rate after ride
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { toUserId, score, comment } = req.body;
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    ride.ratings.push({ from: req.user._id, to: toUserId, score, comment });
    await ride.save();

    // Update user rating
    const user = await User.findById(toUserId);
    const newRating = ((user.rating * user.ratingCount) + score) / (user.ratingCount + 1);
    await User.findByIdAndUpdate(toUserId, { rating: parseFloat(newRating.toFixed(1)), $inc: { ratingCount: 1 } });

    res.json({ message: 'Rating submitted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
