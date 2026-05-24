require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const rideRoutes = require('./routes/rides');
const matchRoutes = require('./routes/matches');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const vehicleRoutes = require('./routes/vehicles');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET','POST'] }
});

// ── Middleware ──
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── MongoDB ──
const mongoOptions = {
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  family: 4,
};

const connectMongo = async () => {
  let primaryUri = process.env.MONGODB_URI;
  if (primaryUri) {
    primaryUri = primaryUri.replace(/\/splitfare/i, '/Splitfare');
  }
  const fallbackUri = process.env.MONGODB_FALLBACK_URI || 'mongodb://127.0.0.1:27017/Splitfare';
  const tryConnect = async (uri, label) => {
    try {
      await mongoose.connect(uri, mongoOptions);
      console.log(`✅ MongoDB connected (${label})`);
      return true;
    } catch (err) {
      console.error(`❌ MongoDB ${label} connection error:`, err.message);
      return false;
    }
  };

  let connected = false;
  if (primaryUri) {
    connected = await tryConnect(primaryUri, 'primary');
  }
  if (!connected && fallbackUri !== primaryUri) {
    connected = await tryConnect(fallbackUri, 'fallback');
  }
  if (!connected) {
    console.error('⚠️ MongoDB connection failed. API will still run, but database routes may be unavailable.');
  }
};

connectMongo();

mongoose.connection.on('connected', () => console.log('✅ MongoDB connected'));
mongoose.connection.on('disconnected', () => console.log('⚠️ MongoDB disconnected'));
mongoose.connection.on('error', (err) => console.error('❌ MongoDB error:', err.message));

// ── Database status middleware ──
app.use((req, res, next) => {
  if (req.path === '/api/health' || mongoose.connection.readyState === 1) return next();
  return res.status(503).json({ message: 'Database not connected. Please try again later.' });
});

// ── Socket.IO for live matching & tracking ──
const activeRiders = new Map(); // userId → { socketId, location, rideId }

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('register', ({ userId, role }) => {
    activeRiders.set(userId, { socketId: socket.id, role, connectedAt: new Date() });
    socket.join(`user:${userId}`);
  });

  socket.on('update_location', ({ userId, lat, lng, rideId }) => {
    const user = activeRiders.get(userId);
    if (user) {
      user.location = { lat, lng };
      user.rideId = rideId;
      activeRiders.set(userId, user);
    }
    if (rideId) {
      socket.to(`ride:${rideId}`).emit('location_update', { userId, lat, lng });
    }
  });

  socket.on('join_ride_room', ({ rideId }) => {
    socket.join(`ride:${rideId}`);
  });

  socket.on('ride_accepted', ({ rideId, driverId, riderId }) => {
    io.to(`user:${riderId}`).emit('match_confirmed', { rideId, driverId });
    io.to(`user:${driverId}`).emit('match_confirmed', { rideId, riderId });
  });

  socket.on('disconnect', () => {
    for (const [userId, data] of activeRiders.entries()) {
      if (data.socketId === socket.id) { activeRiders.delete(userId); break; }
    }
  });
});

// Expose io to routes
app.set('io', io);
app.set('activeRiders', activeRiders);

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicles', vehicleRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// ── Serve frontend in production ──
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../frontend/dist/index.html')));
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 SplitFare API running on port ${PORT}`));

module.exports = { app, io };
