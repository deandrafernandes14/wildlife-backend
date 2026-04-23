require("dotenv").config();
const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const mongoose   = require("mongoose");
const cors       = require("cors");

const authRoutes    = require("./routes/auth");
const animalRoutes  = require("./routes/animals");
const alertRoutes   = require("./routes/alerts");
const userRoutes    = require("./routes/users");
const logRoutes     = require("./routes/logs");       // ← NEW

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST","PUT","DELETE"] },
});

app.use(cors());
app.use(express.json());
app.set("io", io);

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/animals", animalRoutes);
app.use("/api/alerts",  alertRoutes);
app.use("/api/users",   userRoutes);
app.use("/api/logs",    logRoutes);               // ← NEW

app.get("/", (req, res) => res.json({ status: "Wildlife API running 🌿" }));

// ── MongoDB ─────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ── Socket.io ──────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join_room",              (room) => socket.join(room));
  socket.on("animal_position_update", (data) => io.emit("animal_moved", data));
  socket.on("trigger_alert",          (data) => io.emit("new_alert", data));

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));