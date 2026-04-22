const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  severity:    { type: String, enum: ["Critical", "Warning", "Info"], required: true },
  type:        { type: String, enum: ["boundary_breach", "health_critical", "unusual_movement", "manual"], required: true },
  title:       { type: String, required: true },
  description: { type: String },
  species:     { type: String },
  animalId:    { type: mongoose.Schema.Types.ObjectId, ref: "Animal" },
  animalName:  { type: String },
  zone:        { type: String },
  resolved:    { type: Boolean, default: false },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  resolvedAt:  { type: Date },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model("Alert", alertSchema);
