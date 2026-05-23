const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  // Poster
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['driver', 'rider'], required: true },

  // Route
  origin: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    city: { type: String, required: true }
  },
  destination: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    city: { type: String, required: true }
  },

  // Timing
  departureTime: { type: Date, required: true },
  estimatedArrival: { type: Date },
  actualStartTime: { type: Date },
  actualEndTime: { type: Date },

  // Vehicle (for driver rides)
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  seatsAvailable: { type: Number, default: 1 },
  seatsBooked: { type: Number, default: 0 },

  // Fare
  estimatedDistance: { type: Number }, // in km
  farePerPerson: { type: Number },
  totalFare: { type: Number },
  splitCount: { type: Number, default: 1 },

  // Matched riders/drivers
  matches: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    paymentId: { type: String, default: '' },
    joinedAt: Date
  }],

  // Ride lifecycle
  status: {
    type: String,
    enum: ['posted', 'matched', 'in_progress', 'completed', 'cancelled'],
    default: 'posted'
  },
  cancelReason: { type: String, default: '' },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Ratings given after ride
  ratings: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, min: 1, max: 5 },
    comment: String
  }],

  // Polyline / route data from Google Maps
  routePolyline: { type: String, default: '' },

  preferences: {
    acRequired: { type: Boolean, default: false },
    femaleOnly: { type: Boolean, default: false },
    noSmoking: { type: Boolean, default: true },
    petAllowed: { type: Boolean, default: false }
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Index for geo queries & matching
rideSchema.index({ 'origin.lat': 1, 'origin.lng': 1, 'destination.lat': 1, 'destination.lng': 1 });
rideSchema.index({ departureTime: 1, status: 1 });

module.exports = mongoose.model('Ride', rideSchema);
