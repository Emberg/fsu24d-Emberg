const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const bcrypt = require("bcryptjs");

const Organisation = require("../models/Organisation");
const Room = require("../models/Room");
const User = require("../models/User");
const Translation = require("../models/Translation");
const ApiKey = require("../models/ApiKey");
//const { generateApiKey, hashApiKey } = require("../utils/apiKey");

async function generateApiKey(orgId = null, description = "") {
  // Generate a random API key
  //const key = crypto.randomBytes(32).toString("hex");
  const key = "test123";

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
}

async function seedDefaults() {
  try {
    console.log("Seeding default data...");

    // -------- Load default locale files --------
    const enFile = path.join(__dirname, "../../locales/default_en.json");
    const svFile = path.join(__dirname, "../../locales/default_sv.json");

    const defaultEn = JSON.parse(fs.readFileSync(enFile, "utf-8"));
    const defaultSv = fs.existsSync(svFile)
      ? JSON.parse(fs.readFileSync(svFile, "utf-8"))
      : defaultEn; // fallback if SV missing

    const defaultLocales = [
      { lang: "en", data: defaultEn },
      { lang: "sv", data: defaultSv }
    ];

    // -------- Default organisations --------
    const defaultOrgs = [
      { orgId: "org1", orgName: "Organisation One" },
      { orgId: "org2", orgName: "Organisation Two" }
    ];

    for (const org of defaultOrgs) {
      // Upsert organisation
      await Organisation.updateOne(
        { orgId: org.orgId },
        { $setOnInsert: org },
        { upsert: true }
      );
      console.log(`Organisation verified: ${org.orgName}`);

      // -------- Rooms --------
      const rooms = [
        { name: "Room A", capacity: 20 },
        { name: "Room B", capacity: 15 },
        { name: "Room C", capacity: 10 }
      ];

      for (const room of rooms) {
        await Room.updateOne(
          { name: room.name, orgId: org.orgId },
          { $setOnInsert: { ...room, orgId: org.orgId } },
          { upsert: true }
        );
      }
      console.log(`Rooms verified for ${org.orgName}`);

      // -------- Admin user --------
      const hashed = await bcrypt.hash("admin123", 10);
      await User.updateOne(
        { email: `admin@${org.orgId}.com`, orgId: org.orgId },
        {
          $setOnInsert: {
            email: `admin@${org.orgId}.com`,
            password: hashed,
            orgId: org.orgId,
            role: "admin"
          }
        },
        { upsert: true }
      );
      console.log(`Admin verified for ${org.orgName}`);
    }

    // -------- Locales --------
    for (const locale of defaultLocales) {
      const exists = await Translation.findOne({ language: locale.lang });
      if (!exists) {
        await Translation.create({
          language: locale.lang,
          data: locale.data
        });
      }
      console.log(`${locale.lang} language verified`);
    }

    // API KEY
    await generateApiKey("org1", "Public API key for org1").catch(err => {
        console.error(err);
    });

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Error seeding defaults:", err);
  }
}

module.exports = seedDefaults;