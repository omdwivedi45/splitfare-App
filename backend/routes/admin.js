const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ride = require('../models/Ride');
const Vehicle = require('../models/Vehicle');
const Payment = require('../models/Payment');
const { auth, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(auth, adminOnly);

// GET /api/admin/dashboard - Full stats
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers, totalRides, totalVehicles, totalPayments,
      pendingVerifications, pendingVehicles,
      activeRides, completedRides, cancelledRides,
      recentUsers, recentRides
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Ride.countDocuments(),
      Vehicle.countDocuments(),
      Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      User.countDocuments({ verificationStatus: 'pending', role: { $ne: 'admin' } }),
      Vehicle.countDocuments({ verificationStatus: 'pending' }),
      Ride.countDocuments({ status: 'in_progress' }),
      Ride.countDocuments({ status: 'completed' }),
      Ride.countDocuments({ status: 'cancelled' }),
      User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 }).limit(5),
      Ride.find().populate('postedBy', 'name phone').sort({ createdAt: -1 }).limit(5),
    ]);

    // Monthly rides trend (last 6 months)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Ride.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      stats: {
        totalUsers, totalRides, totalVehicles,
        totalRevenue: totalPayments[0]?.total || 0,
        pendingVerifications, pendingVehicles,
        activeRides, completedRides, cancelledRides,
        matchRate: totalRides > 0 ? ((completedRides / totalRides) * 100).toFixed(1) : 0
      },
      recentUsers, recentRides, monthlyTrend
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users - All users with filters
router.get('/users', async (req, res) => {
  try {
    const { search, role, verificationStatus, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = { role: { $ne: 'admin' } };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
    if (role) filter.role = role;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const sort = {}; sort[sortBy] = order === 'desc' ? -1 : 1;
    const users = await User.find(filter).select('-password')
      .sort(sort).skip((page-1)*limit).limit(+limit);
    const total = await User.countDocuments(filter);
    res.json({ users, total, page: +page, pages: Math.ceil(total/limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users/:id - Single user full detail
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const vehicles = await Vehicle.find({ owner: user._id });
    const rides = await Ride.find({ postedBy: user._id }).sort({ createdAt: -1 }).limit(20);
    const payments = await Payment.find({ $or: [{ payer: user._id }, { receiver: user._id }] })
      .populate('ride', 'origin destination').sort({ createdAt: -1 }).limit(20);
    res.json({ user, vehicles, rides, payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/verify - Verify or reject user
router.put('/users/:id/verify', async (req, res) => {
  try {
    const { verificationStatus, note } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, {
      verificationStatus,
      isVerified: verificationStatus === 'approved'
    }, { new: true }).select('-password');
    res.json({ user, message: `User ${verificationStatus}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/toggle - Activate / deactivate user
router.put('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/vehicles - All vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const { verificationStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    const vehicles = await Vehicle.find(filter)
      .populate('owner', 'name phone email city verificationStatus')
      .sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit);
    const total = await Vehicle.countDocuments(filter);
    res.json({ vehicles, total, page: +page, pages: Math.ceil(total/limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/vehicles/:id/verify
router.put('/vehicles/:id/verify', async (req, res) => {
  try {
    const { verificationStatus, verificationNote } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, {
      verificationStatus,
      isVerified: verificationStatus === 'approved',
      verificationNote: verificationNote || ''
    }, { new: true });
    res.json({ vehicle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/rides - All rides
router.get('/rides', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const rides = await Ride.find(filter)
      .populate('postedBy', 'name phone avatar')
      .populate('vehicle')
      .sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit);
    const total = await Ride.countDocuments(filter);
    res.json({ rides, total, page: +page, pages: Math.ceil(total/limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/payments - All payments
router.get('/payments', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {}; if (status) filter.status = status;
    const payments = await Payment.find(filter)
      .populate('payer', 'name phone').populate('receiver', 'name phone')
      .populate('ride', 'origin destination farePerPerson')
      .sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit);
    const total = await Payment.countDocuments(filter);
    res.json({ payments, total, page: +page, pages: Math.ceil(total/limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
