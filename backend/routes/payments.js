const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Ride = require('../models/Ride');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// GET /api/payments/my - Fetch user's transaction history
router.get('/my', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ $or: [{ payer: req.user._id }, { receiver: req.user._id }] })
      .populate('ride', 'origin destination departureTime farePerPerson')
      .populate('payer', 'name avatar phone')
      .populate('receiver', 'name avatar phone upiId')
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/initiate - Rider starts payment flow
router.post('/initiate', auth, async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findById(rideId).populate('postedBy', 'name upiId phone');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    // Check if payment already exists
    let payment = await Payment.findOne({ ride: rideId, payer: req.user._id });
    if (!payment) {
      payment = await Payment.create({
        ride: rideId,
        payer: req.user._id,
        receiver: ride.postedBy._id,
        amount: ride.farePerPerson,
        status: 'created'
      });
    }

    const driver = ride.postedBy;
    
    // Generate standard P2P UPI link
    let upiLink = '';
    if (driver.upiId) {
      const pn = encodeURIComponent(driver.name);
      const am = ride.farePerPerson;
      const tn = encodeURIComponent(`SplitFare Ride Split ${rideId.toString().slice(-6)}`);
      upiLink = `upi://pay?pa=${driver.upiId}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
    }

    res.json({
      paymentId: payment._id,
      amount: ride.farePerPerson,
      receiverName: driver.name,
      receiverUpiId: driver.upiId || '',
      upiLink,
      status: payment.status,
      upiTxnId: payment.upiTxnId || ''
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/submit-reference - Rider submits 12-digit UPI UTR Reference
router.post('/submit-reference', auth, async (req, res) => {
  try {
    const { paymentId, upiTxnId } = req.body;

    if (!/^\d{12}$/.test(upiTxnId)) {
      return res.status(400).json({ message: 'Invalid Transaction Reference. Must be exactly 12 digits (UTR).' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    if (payment.payer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    payment.upiTxnId = upiTxnId;
    payment.status = 'pending_confirmation';
    payment.riderSubmittedAt = new Date();
    await payment.save();

    // Update match payment status in the Ride document
    const ride = await Ride.findById(payment.ride);
    if (ride) {
      const matchIdx = ride.matches.findIndex(m => m.user?.toString() === req.user._id.toString());
      if (matchIdx !== -1) {
        ride.matches[matchIdx].paymentStatus = 'pending'; // marked as paid/pending
        await ride.save();
      }
    }

    // Trigger Socket notification to driver
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${payment.receiver}`).emit('payment_submitted', {
        paymentId: payment._id,
        payerName: req.user.name,
        amount: payment.amount,
        message: `${req.user.name} submitted payment proof of ₹${payment.amount}`
      });
    }

    res.json({ message: 'UPI reference submitted successfully', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/confirm/:paymentId - Driver approves receipt of funds
router.post('/confirm/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).populate('payer', 'name');
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    if (payment.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the payment receiver can confirm receipt.' });
    }

    payment.status = 'paid';
    payment.driverConfirmedAt = new Date();
    await payment.save();

    // Update match payment status to 'paid' in the Ride document
    const ride = await Ride.findById(payment.ride);
    if (ride) {
      const matchIdx = ride.matches.findIndex(m => m.user?.toString() === payment.payer._id.toString());
      if (matchIdx !== -1) {
        ride.matches[matchIdx].paymentStatus = 'paid';
        await ride.save();
      }
    }

    // Add savings metric to payer's user profile
    await User.findByIdAndUpdate(payment.payer, { $inc: { totalSavings: payment.amount } });

    // Trigger Socket notification to Rider
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${payment.payer._id}`).emit('payment_confirmed', {
        paymentId: payment._id,
        amount: payment.amount,
        message: `Your payment of ₹${payment.amount} to the driver was confirmed!`
      });
    }

    res.json({ message: 'Payment verified and confirmed', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
