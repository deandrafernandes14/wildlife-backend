const router = require("express").Router();
const Alert  = require("../models/Alert");
const { auth } = require("../middleware/auth");

// GET /api/alerts — get all alerts (newest first)
router.get("/", auth, async (req, res) => {
  try {
    const { resolved, severity } = req.query;
    const filter = {};
    if (resolved !== undefined) filter.resolved = resolved === "true";
    if (severity) filter.severity = severity;
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/alerts — create manual alert
router.post("/", auth, async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    req.app.get("io").emit("new_alert", alert);
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/alerts/:id/resolve — resolve an alert
router.put("/:id/resolve", auth, async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedBy: req.user.id, resolvedAt: new Date() },
      { new: true }
    );
    req.app.get("io").emit("alert_resolved", { id: alert._id });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
