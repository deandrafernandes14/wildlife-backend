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

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup (allows both web and Expo app to connect) ──
const io = new Server(server, {
  cors: {
    origin: "*", // In production, set to your actual frontend URLs
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Make io accessible in route handlers
app.set("io", io);

// ── Routes ─────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/animals", animalRoutes);
app.use("/api/alerts",  alertRoutes);
app.use("/api/users",   userRoutes);

app.get("/", (req, res) => res.json({ status: "Wildlife API running 🌿" }));

// ── MongoDB connection ──────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ── Socket.io real-time events ──────────────────────────────────
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Client joins a room (e.g. "researchers", "officers")
  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  // Animal position update from Expo app or web
  socket.on("animal_position_update", (data) => {
    // Broadcast to ALL connected clients (web + app)
    io.emit("animal_moved", data);
  });

  // Alert triggered
  socket.on("trigger_alert", (data) => {
    io.emit("new_alert", data);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// ── Start server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
