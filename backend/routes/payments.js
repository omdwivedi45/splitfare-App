const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Ride = require('../models/Ride');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findById(rideId).populate('postedBy');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const amount = ride.farePerPerson * 100; // paise
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `ride_${rideId}_${req.user._id}`,
      notes: { rideId: rideId.toString(), userId: req.user._id.toString() }
    });

    const payment = await Payment.create({
      ride: rideId,
      payer: req.user._id,
      receiver: ride.postedBy._id,
      amount: ride.farePerPerson,
      razorpayOrderId: order.id,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/verify
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId, rideId } = req.body;

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature)
      return res.status(400).json({ message: 'Payment verification failed - invalid signature' });

    await Payment.findByIdAndUpdate(paymentId, {
      razorpayPaymentId,
      razorpaySignature,
      status: 'paid'
    });

    // Update match payment status
    const ride = await Ride.findById(rideId);
    const matchIdx = ride.matches.findIndex(m => m.user?.toString() === req.user._id.toString());
    if (matchIdx !== -1) ride.matches[matchIdx].paymentStatus = 'paid';
    await ride.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalSavings: ride.farePerPerson } });

    res.json({ message: 'Payment verified successfully', verified: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/my
router.get('/my', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ $or: [{ payer: req.user._id }, { receiver: req.user._id }] })
      .populate('ride', 'origin destination departureTime farePerPerson')
      .populate('payer', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
