const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['rider', 'driver', 'both', 'admin'], default: 'rider' },
  avatar: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },

  // Verification
  isVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  govIdType: { type: String, enum: ['aadhar', 'pan', 'dl', ''], default: '' },
  govIdNumber: { type: String, default: '' },
  govIdImage: { type: String, default: '' },
  selfieImage: { type: String, default: '' },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

  // Address
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },

  // Stats
  totalRides: { type: Number, default: 0 },
  totalSavings: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  ratingCount: { type: Number, default: 0 },
  co2Saved: { type: Number, default: 0 },

  // Wallet
  walletBalance: { type: Number, default: 0 },

  // Emergency contact
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },

  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  fcmToken: { type: String, default: '' }, // for push notifications
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.govIdNumber;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
