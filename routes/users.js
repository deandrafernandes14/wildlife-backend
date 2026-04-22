const router = require("express").Router();
const User   = require("../models/User");
const { auth } = require("../middleware/auth");

function adminOnly(req, res, next) {
  if (req.user.role !== "Admin")
    return res.status(403).json({ message: "Admin access required" });
  next();
}

// GET /api/users — Admin only
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id — Admin only
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;