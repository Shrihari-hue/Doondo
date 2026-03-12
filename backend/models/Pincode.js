const mongoose = require("mongoose");

const officeSchema = new mongoose.Schema(
  {
    name: String,
    officeName: String,
    officeType: String,
    deliveryStatus: String,
    division: String,
    region: String,
    taluk: String,
    district: String,
  },
  { _id: false }
);

const pincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      index: true,
    },
    primaryCity: String,
    primaryArea: String,
    districts: [String],
    taluks: [String],
    regions: [String],
    divisions: [String],
    areaKeywords: [String],
    offices: [officeSchema],
    source: {
      type: String,
      default: "india-post-directory",
    },
    lastSyncedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pincode", pincodeSchema);
