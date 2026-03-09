const mongoose = require("mongoose");
const crypto = require("crypto");
const ApiKey = require("../models/ApiKey");
const { generateApiKey, hashApiKey } = require("../utils/apiKey");

async function generateApiKey(orgId = null, description = "") {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Generate a random API key
  const key = crypto.randomBytes(32).toString("hex");

  // Hash the key before storing
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  // Insert into DB
  const record = await ApiKey.create({
    keyHash,
    orgId,
    description
  });

  console.log("API Key generated (store this safely):", key);
  console.log("Record saved with hash:", record.keyHash);

  // Close connection
  await mongoose.disconnect();
}

// Example usage: node scripts/generateApiKey.js
generateApiKey("org1", "Public API key for org1").catch(err => {
  console.error(err);
  process.exit(1);
});