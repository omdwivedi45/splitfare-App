# ⚡ SplitFare — Complete Deployment Guide

> Full-stack ride-sharing app with real auth, live matching, Google Maps, Razorpay payments, and admin panel.

---

## 📁 Project Structure

```
splitfare/
├── backend/                    # Node.js + Express + MongoDB API
│   ├── models/
│   │   ├── User.js             # User schema (auth, verification, stats)
│   │   ├── Vehicle.js          # Vehicle schema (RC, insurance, docs)
│   │   ├── Ride.js             # Ride schema (route, fare, matches)
│   │   └── Payment.js          # Payment schema (Razorpay integration)
│   ├── routes/
│   │   ├── auth.js             # Register, login, profile, verification
│   │   ├── rides.js            # Post ride, find matches, accept, start, complete
│   │   ├── vehicles.js         # Add/manage vehicles
│   │   ├── payments.js         # Razorpay order, verify payment
│   │   ├── matches.js          # Pending match requests
│   │   ├── users.js            # Public user profiles
│   │   └── admin.js            # Full admin CRUD + dashboard stats
│   ├── middleware/
│   │   └── auth.js             # JWT auth + admin guard
│   ├── server.js               # Express + Socket.IO entry point
│   ├── package.json
│   └── .env.example            # ← Copy to .env and fill values
│
└── frontend/                   # React + Vite SPA
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.jsx     # Public landing page
    │   │   ├── Login.jsx       # Sign in
    │   │   ├── Register.jsx    # Sign up (rider/driver/both)
    │   │   ├── Dashboard.jsx   # User home with stats
    │   │   ├── BookRide.jsx    # Post ride with Google Maps
    │   │   ├── Matches.jsx     # Find/request live matches
    │   │   ├── MyRides.jsx     # Ride history with filters
    │   │   ├── RideDetail.jsx  # Live tracking + match management
    │   │   ├── Vehicles.jsx    # Add/manage vehicles
    │   │   ├── Payments.jsx    # Transaction history + Razorpay
    │   │   ├── Profile.jsx     # Edit profile + submit ID verification
    │   │   └── admin/
    │   │       ├── AdminDashboard.jsx   # KPIs + charts + recent activity
    │   │       ├── AdminUsers.jsx       # All users (search, filter, verify)
    │   │       ├── AdminUserDetail.jsx  # Full individual user deep-dive
    │   │       ├── AdminVehicles.jsx    # All vehicles + verify/reject
    │   │       ├── AdminRides.jsx       # All rides with filters
    │   │       └── AdminPayments.jsx    # All payments + totals
    │   ├── utils/
    │   │   ├── api.js           # Axios instance with auto auth token
    │   │   ├── AuthContext.jsx  # Global user auth state
    │   │   └── SocketContext.jsx # Socket.IO live updates
    │   ├── components/
    │   │   ├── Navbar.jsx       # Responsive nav with user menu
    │   │   └── Notifications.jsx # Real-time toast notifications
    │   ├── styles/
    │   │   └── global.css       # Design system (CSS variables, utilities)
    │   └── App.jsx              # Router with private/admin route guards
    ├── vercel.json              # Vercel deployment config
    ├── vite.config.js
    └── .env.example             # ← Copy to .env and fill values
```

---

## 🔑 Step 1 — Get Your API Keys (Free Tiers Available)

### 1a. MongoDB Atlas (Database) — FREE
1. Go to **https://cloud.mongodb.com**
2. Create account → New Project → Build a Cluster (free M0)
3. Create database user (username + password)
4. Whitelist IP: **0.0.0.0/0** (allow all, for deployment)
5. Click **Connect → Drivers → Copy connection string**
6. Replace `<password>` with your DB password
```
mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/splitfare?retryWrites=true&w=majority
```

### 1b. Razorpay (Payments) — FREE test mode
1. Go to **https://razorpay.com** → Sign up
2. Dashboard → Settings → API Keys → Generate Test Keys
3. Copy `Key ID` and `Key Secret`
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 1c. Google Maps API — FREE ($200/month credit)
1. Go to **https://console.cloud.google.com**
2. New Project → Enable these APIs:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Places API
3. Credentials → Create API Key → Copy it
4. **IMPORTANT**: Replace `YOUR_GOOGLE_MAPS_API_KEY` in `frontend/index.html`

### 1d. Cloudinary (Image uploads) — FREE
1. Go to **https://cloudinary.com** → Sign up
2. Dashboard → Copy Cloud Name, API Key, API Secret
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 1e. Generate JWT Secret
Run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## ⚙️ Step 2 — Configure Environment Variables

### Backend — create `backend/.env`:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/splitfare
JWT_SECRET=your_64_char_random_hex_string_here
FRONTEND_URL=https://splitfare.vercel.app
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_MAPS_API_KEY=AIzaSy_your_key
```

### Frontend — create `frontend/.env`:
```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_SOCKET_URL=https://your-backend.railway.app
VITE_GOOGLE_MAPS_KEY=AIzaSy_your_key
```

---

## 🚀 Step 3 — Deploy Backend to Railway (FREE)

1. Go to **https://railway.app** → Sign up with GitHub
2. New Project → Deploy from GitHub repo → Select your repo
3. Set the **Root Directory** to `backend`
4. Add all environment variables from `backend/.env` above
5. Railway auto-detects Node.js and deploys
6. Copy your Railway URL: `https://splitfare-backend.railway.app`

**OR deploy to Render (also free):**
1. Go to **https://render.com** → New Web Service
2. Connect GitHub → Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add environment variables

---

## 🌐 Step 4 — Deploy Frontend to Vercel (FREE)

1. Push code to GitHub
2. Go to **https://vercel.com** → New Project → Import repo
3. Set **Root Directory** to `frontend`
4. Add environment variables:
   - `VITE_API_URL` = your Railway backend URL + `/api`
   - `VITE_SOCKET_URL` = your Railway backend URL
5. Click Deploy → Get your URL: `https://splitfare.vercel.app`
6. Update `FRONTEND_URL` in your Railway backend env to this Vercel URL

---

## 💻 Step 5 — Run Locally (Development)

```bash
# 1. Clone / download the project
git clone https://github.com/yourname/splitfare.git
cd splitfare

# 2. Install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit .env with your keys

# 3. Install frontend dependencies
cd ../frontend
npm install
cp .env.example .env
# Edit .env - set VITE_API_URL=http://localhost:5000/api

# 4. Start backend (terminal 1)
cd backend
npm run dev

# 5. Start frontend (terminal 2)
cd frontend
npm run dev

# Open http://localhost:5173
```

---

## 👑 Step 6 — Create Your Admin Account

After deployment, create your admin user directly in MongoDB:

1. Go to **MongoDB Atlas → Browse Collections → splitfare → users**
2. Find your registered user document
3. Edit → change `"role": "rider"` to `"role": "admin"`
4. Save

**OR** use MongoDB Compass or this script:
```bash
# Run from backend folder
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await mongoose.connection.db.collection('users').updateOne(
    { email: 'your-email@example.com' },
    { \$set: { role: 'admin' } }
  );
  console.log('Admin role set!');
  process.exit();
});
"
```

---

## 🗺️ Update Google Maps API Key in HTML

Open `frontend/index.html` and replace:
```html
<script async src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places,geometry"></script>
```
With your actual key:
```html
<script async src="https://maps.googleapis.com/maps/api/js?key=AIzaSy_YOUR_ACTUAL_KEY&libraries=places,geometry"></script>
```

---

## ✅ Feature Checklist

| Feature | Status |
|---|---|
| User Registration (Rider / Driver / Both) | ✅ |
| JWT Authentication | ✅ |
| Google Maps Route Visualization | ✅ |
| Geocoding (address → coordinates) | ✅ |
| Smart Ride Matching (Haversine + scoring) | ✅ |
| Real-time Socket.IO notifications | ✅ |
| Request / Accept / Reject matches | ✅ |
| Start / Complete / Cancel rides | ✅ |
| Fare calculation (distance × rate ÷ riders) | ✅ |
| Razorpay payment integration | ✅ |
| Vehicle registration with docs | ✅ |
| Government ID verification (Aadhaar/PAN/DL) | ✅ |
| Star rating system | ✅ |
| CO₂ savings tracker | ✅ |
| Emergency contact | ✅ |
| Admin: Full user management | ✅ |
| Admin: Verify / reject users | ✅ |
| Admin: Verify / reject vehicles | ✅ |
| Admin: All rides with filters | ✅ |
| Admin: All payments | ✅ |
| Admin: Live analytics dashboard | ✅ |
| Admin: Individual user deep-dive | ✅ |
| Deploy-ready (Railway + Vercel) | ✅ |

---

## 🔧 Common Issues & Fixes

**CORS Error:**
→ Make sure `FRONTEND_URL` in backend `.env` matches your exact Vercel URL

**Socket not connecting:**
→ Railway/Render must support WebSockets — both do on free tier

**Google Maps not loading:**
→ Enable all 4 APIs in Google Cloud Console. Check API key restrictions.

**Razorpay payment failing:**
→ Use test key `rzp_test_...` for development. Switch to `rzp_live_...` for production.

**MongoDB connection refused:**
→ Check that IP `0.0.0.0/0` is whitelisted in Atlas → Network Access

---

## 📞 API Endpoints Reference

```
POST   /api/auth/register              Register new user
POST   /api/auth/login                 Login
GET    /api/auth/me                    Get current user
PUT    /api/auth/update-profile        Update profile
PUT    /api/auth/submit-verification   Submit ID docs

POST   /api/rides                      Post a ride
GET    /api/rides/find                 Find matching rides
GET    /api/rides/my                   My rides
GET    /api/rides/:id                  Ride detail
POST   /api/rides/:id/request          Request to join
POST   /api/rides/:id/accept/:userId   Accept a rider
POST   /api/rides/:id/start            Start ride
POST   /api/rides/:id/complete         Complete ride
POST   /api/rides/:id/cancel           Cancel ride
POST   /api/rides/:id/rate             Rate after ride

POST   /api/vehicles                   Add vehicle
GET    /api/vehicles/my                My vehicles
PUT    /api/vehicles/:id               Update vehicle
DELETE /api/vehicles/:id               Remove vehicle

POST   /api/payments/create-order      Create Razorpay order
POST   /api/payments/verify            Verify payment
GET    /api/payments/my                My transactions

GET    /api/admin/dashboard            Full platform stats
GET    /api/admin/users                All users (search/filter)
GET    /api/admin/users/:id            User detail + vehicles + rides
PUT    /api/admin/users/:id/verify     Approve/reject user
PUT    /api/admin/users/:id/toggle     Enable/disable user
GET    /api/admin/vehicles             All vehicles
PUT    /api/admin/vehicles/:id/verify  Approve/reject vehicle
GET    /api/admin/rides                All rides
GET    /api/admin/payments             All payments
```

---

## 🌱 Next Features to Add

- [ ] Push notifications (Firebase FCM)
- [ ] OTP phone verification (Twilio / MSG91)
- [ ] Ride chat between driver and rider
- [ ] Female-only ride filter enforcement
- [ ] Scheduled/recurring rides
- [ ] Referral system
- [ ] Mobile app (React Native)

---

*Built with Node.js · MongoDB · Express · React · Vite · Socket.IO · Google Maps · Razorpay*
