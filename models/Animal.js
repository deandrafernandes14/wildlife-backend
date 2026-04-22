const mongoose = require("mongoose");

const animalSchema = new mongoose.Schema({
  name:      { type: String, required: true },      // e.g. "Tiger 1"
  species:   { type: String, required: true },      // e.g. "Tiger"
  health:    { type: String, enum: ["Good", "Moderate", "Critical"], default: "Good" },
  zone:      { type: String, required: true },      // habitat zone key
  activity:  { type: String, enum: ["Active", "Resting", "Feeding", "Unknown"], default: "Active" },
  location: {
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  isBreaching: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
  notes:       { type: String, default: "" },
});

// Update lastUpdated on every save
animalSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model("Animal", animalSchema);
