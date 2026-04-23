const router      = require("express").Router();
const ActivityLog = require("../models/ActivityLog");
const { auth, adminOnly } = require("../middleware/auth");

// GET /api/logs — Admin only — get all activity logs
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const { action, userId, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/logs/mine — Any user — get own activity
router.get("/mine", auth, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/logs — Log any client-side action
router.post("/", auth, async (req, res) => {
  try {
    const { action, details } = req.body;
    const user = req.user;

    const log = await ActivityLog.create({
      userId:    user.id,
      userName:  req.body.userName  || "Unknown",
      userEmail: req.body.userEmail || "unknown",
      userRole:  user.role,
      action,
      details:   details || "",
      ipAddress: req.headers["x-forwarded-for"] || req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    });

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;