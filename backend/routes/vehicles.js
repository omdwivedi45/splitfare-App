const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { auth } = require('../middleware/auth');

// POST /api/vehicles - Add vehicle
router.post('/', auth, async (req, res) => {
  try {
    const { type, brand, model, year, color, plateNumber, capacity, fuelType, acAvailable,
            rcImage, insuranceImage, pollutionImage, vehicleImages } = req.body;
    const exists = await Vehicle.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (exists) return res.status(400).json({ message: 'Vehicle with this plate already registered' });

    const availableSeats = type === 'bike' ? 1 : type === 'auto' ? 2 : capacity - 1;
    const vehicle = await Vehicle.create({
      owner: req.user._id, type, brand, model, year, color,
      plateNumber: plateNumber.toUpperCase(), capacity, availableSeats,
      fuelType, acAvailable, rcImage, insuranceImage, pollutionImage,
      vehicleImages: vehicleImages || []
    });
    res.status(201).json({ vehicle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/vehicles/my - Get my vehicles
router.get('/my', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id, isActive: true });
    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/vehicles/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'name phone rating');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ vehicle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    const allowed = ['color', 'acAvailable', 'rcImage', 'insuranceImage', 'pollutionImage', 'vehicleImages'];
    allowed.forEach(k => { if (req.body[k] !== undefined) vehicle[k] = req.body[k]; });
    await vehicle.save();
    res.json({ vehicle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/vehicles/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Vehicle.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, { isActive: false });
    res.json({ message: 'Vehicle removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
