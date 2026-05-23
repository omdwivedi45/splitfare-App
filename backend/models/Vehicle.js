const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['bike', 'car', 'suv', 'auto'], required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  color: { type: String, required: true },
  plateNumber: { type: String, required: true, uppercase: true, unique: true },
  capacity: { type: Number, required: true }, // total seats including driver
  availableSeats: { type: Number, required: true }, // seats for riders

  // Documents
  rcImage: { type: String, default: '' },           // Registration Certificate
  insuranceImage: { type: String, default: '' },
  pollutionImage: { type: String, default: '' },
  vehicleImages: [{ type: String }],

  // Verification
  isVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  verificationNote: { type: String, default: '' },

  isActive: { type: Boolean, default: true },

  // Stats
  totalRides: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },

  fuelType: { type: String, enum: ['petrol', 'diesel', 'cng', 'electric'], default: 'petrol' },
  acAvailable: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
