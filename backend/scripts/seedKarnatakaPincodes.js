require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Pincode = require("../models/Pincode");

const DATA_PATH = path.join(__dirname, "..", "data", "karnataka-pincodes.json");

const run = async () => {
  await connectDB();

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const records = JSON.parse(raw);

  await Pincode.deleteMany({ state: "Karnataka" });
  await Pincode.insertMany(
    records.map((record) => ({
      ...record,
      source: "india-post-directory",
      lastSyncedAt: new Date(),
    }))
  );

  console.log(`Seeded Karnataka pincodes: ${records.length}`);
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("Karnataka pincode seed failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
