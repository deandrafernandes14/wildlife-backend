const router      = require("express").Router();
const jwt         = require("jsonwebtoken");
const User        = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { auth }    = require("../middleware/auth");

// ── POST /api/auth/register ─────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (!email.includes("@"))
      return res.status(400).json({ message: "Invalid email address" });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    const user  = await User.create({ name, email: email.toLowerCase(), password, role });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Log registration to DB
    await ActivityLog.create({
      userId: user._id, userName: user.name,
      userEmail: user.email, userRole: user.role,
      action: "REGISTER",
      details: `New ${user.role} account created`,
      ipAddress:  req.headers["x-forwarded-for"] || req.ip || "unknown",
      userAgent:  req.headers["user-agent"] || "unknown",
    });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(401).json({ message: "No account found with this email" });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ── SAVE LOGIN TO DATABASE ──────────────────────────────
    await ActivityLog.create({
      userId:    user._id,
      userName:  user.name,
      userEmail: user.email,
      userRole:  user.role,
      action:    "LOGIN",
      details:   `Logged in successfully`,
      ipAddress: req.headers["x-forwarded-for"] || req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    });

    // Update lastLogin on user document
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    res.json({
      token,
      user: {
        id:        user._id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/logout ───────────────────────────────────────
router.post("/logout", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      await ActivityLog.create({
        userId:    user._id,
        userName:  user.name,
        userEmail: user.email,
        userRole:  user.role,
        action:    "LOGOUT",
        details:   "User logged out",
        ipAddress: req.headers["x-forwarded-for"] || req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
      });
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;