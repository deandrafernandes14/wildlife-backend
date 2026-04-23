const mongoose = require("mongoose");

// Tracks EVERY action in the system — login, logout, alert resolved, map opened, etc.
const activityLogSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName:   { type: String, required: true },
  userEmail:  { type: String, required: true },
  userRole:   { type: String, required: true },
  action:     { type: String, required: true },  // "LOGIN", "LOGOUT", "MAP_OPENED", "ALERT_RESOLVED", "BREACH_ACKNOWLEDGED"
  details:    { type: String, default: "" },      // extra context
  ipAddress:  { type: String, default: "unknown" },
  userAgent:  { type: String, default: "unknown" },
  createdAt:  { type: Date, default: Date.now },
});

// Auto-expire logs after 90 days (TTL index)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);