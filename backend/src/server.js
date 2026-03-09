const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const seedDefaults = require("./seed/seedDefaults");

// --- Routes ---
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roomRoutes = require("./routes/roomRoutes");
const organisationRoutes = require("./routes/organisationRoutes");
const translationRoutes = require("./routes/translationRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const sseRoutes = require("./routes/sseRoutes");
const publicApiRoutes = require("./routes/publicApiRoutes");
const apiKeyRoutes = require("./routes/apiKeyRoutes");

const publicRateLimiter = require("./middleware/publicRateLimiter");
const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await seedDefaults();
  })
  .catch(err => console.error(err));

// --- API Routes ---
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", roomRoutes);
app.use("/api", organisationRoutes);
app.use("/api", translationRoutes);
app.use("/api", bookingRoutes);
app.use("/api", sseRoutes);
app.use("/api", apiKeyRoutes);

// --- Public API Routes (API key protected) ---
app.use("/public-api", publicRateLimiter);
app.use("/public-api", publicApiRoutes);

// --- Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));