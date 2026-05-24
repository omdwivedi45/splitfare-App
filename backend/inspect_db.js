// backend/inspect_db.js
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    const uri = 'mongodb+srv://omdwivedi45:Lakhan452986@cluster0.wcwa1cy.mongodb.net/splitfare?appName=Cluster0';
    console.log('Connecting to remote database...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas!');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in DB:', collections.map(c => c.name));

    const User = require('./models/User');
    const users = await User.find({}).select('name email phone role verificationStatus');
    console.log('\n--- LIVE USER LIST ---');
    console.log(users);
    console.log('----------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Connection or query failed:', err.message);
    process.exit(1);
  }
}

run();
