// backend/seed.js — Run: node seed.js
// Creates demo admin, driver, and rider accounts for testing

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing demo users
    await User.deleteMany({ email: { $in: ['admin@splitfare.in', 'driver@splitfare.in', 'rider@splitfare.in', 'rider2@splitfare.in'] } });

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
    console.log('✅ Admin created:', admin.email);

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
    console.log('✅ Driver created:', driver.email);

    // Create vehicle for driver
    const vehicle = await Vehicle.create({
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
    console.log('✅ Vehicle created:', vehicle.plateNumber);

    // Create Rider 1
    const rider1 = await User.create({
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
    console.log('✅ Rider 1 created:', rider1.email);

    // Create Rider 2
    const rider2 = await User.create({
      name: 'Sneha Tiwari',
      email: 'rider2@splitfare.in',
      phone: '9000000004',
      password: 'test123',
      gender: 'female',
      role: 'both',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      isVerified: false,
      verificationStatus: 'pending',
      totalRides: 12,
      rating: 4.7,
      ratingCount: 10,
    });
    console.log('✅ Rider 2 created:', rider2.email);

    console.log('\n🎉 Seed complete! Demo accounts:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  Admin   → admin@splitfare.in   / admin123');
    console.log('🚗  Driver  → driver@splitfare.in  / test123');
    console.log('🙋  Rider   → rider@splitfare.in   / test123');
    console.log('🙋  Rider 2 → rider2@splitfare.in  / test123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
