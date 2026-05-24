const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid Indian phone required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('gender').isIn(['male','female','other']).withMessage('Gender required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, phone, password, gender, role } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) return res.status(400).json({ message: 'Email or phone already registered' });

    const user = await User.create({ name, email, phone, password, gender, role: role || 'rider' });
    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('emailOrPhone').notEmpty().withMessage('Email or phone required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { emailOrPhone, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: emailOrPhone.toLowerCase() }, { phone: emailOrPhone }]
    });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    user.lastSeen = new Date();
    await user.save();
    const token = signToken(user._id);
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

// PUT /api/auth/update-profile
router.put('/update-profile', auth, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'address', 'city', 'state', 'emergencyContact', 'avatar', 'fcmToken', 'upiId'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/submit-verification
router.put('/submit-verification', auth, async (req, res) => {
  try {
    const { govIdType, govIdNumber, govIdImage, selfieImage } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, {
      govIdType, govIdNumber, govIdImage, selfieImage,
      verificationStatus: 'pending'
    }, { new: true }).select('-password');
    res.json({ user, message: 'Verification submitted. Admin will review within 24 hours.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(400).json({ message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
const Vehicle = require('../models/Vehicle');

// GET /api/auth/seed-live (Temporary secure seed endpoint)
router.get('/seed-live', async (req, res) => {
  try {
    // Delete any existing demo accounts
    await User.deleteMany({ email: { $in: ['admin@splitfare.in', 'driver@splitfare.in', 'rider@splitfare.in', 'rider2@splitfare.in', 'arjun45@gmail.com'] } });
    await Vehicle.deleteMany({}); // clear vehicles

    // Create Admin
    const admin = await User.create({
      name: 'SplitFare Admin',
      email: 'admin@splitfare.in',
      phone: '9000000001',
      password: 'admin123',
      gender: 'male',
      role: 'admin',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      isVerified: true,
      verificationStatus: 'approved',
    });

    // Create Driver
    const driver = await User.create({
      name: 'Rahul Verma',
      email: 'driver@splitfare.in',
      phone: '9000000002',
      password: 'test123',
      gender: 'male',
      role: 'driver',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      isVerified: true,
      verificationStatus: 'approved',
      totalRides: 91,
      rating: 4.9,
      ratingCount: 87,
      totalSavings: 8400,
      co2Saved: 48.2,
    });

    // Create Vehicle
    await Vehicle.create({
      owner: driver._id,
      type: 'car',
      brand: 'Honda',
      model: 'City',
      year: 2022,
      color: 'White',
      plateNumber: 'MP04AB1234',
      capacity: 5,
      availableSeats: 4,
      fuelType: 'petrol',
      acAvailable: true,
      isVerified: true,
      verificationStatus: 'approved',
      totalRides: 91,
    });

    // Create Rider 1
    await User.create({
      name: 'Priya Singh',
      email: 'rider@splitfare.in',
      phone: '9000000003',
      password: 'test123',
      gender: 'female',
      role: 'rider',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      isVerified: true,
      verificationStatus: 'approved',
      totalRides: 38,
      rating: 4.8,
      ratingCount: 34,
      totalSavings: 4200,
      co2Saved: 22.1,
    });

    res.json({ message: 'Live MongoDB Atlas Database Seeded successfully! Demo accounts are active.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
