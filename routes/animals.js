const router = require("express").Router();
const Animal = require("../models/Animal");
const Alert = require("../models/Alert");
const { auth } = require("../middleware/auth");

// ── GET /api/animals — get all animals ─────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const { species, zone, health } = req.query;
    const filter = {};
    if (species) filter.species = species;
    if (zone)    filter.zone    = zone;
    if (health)  filter.health  = health;
    
    const animals = await Animal.find(filter).sort({ species: 1, name: 1 });
    res.json(animals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/animals/:id ────────────────────────────────────────
router.get("/:id", auth, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) return res.status(404).json({ message: "Animal not found" });
    res.json(animal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/animals — create animal (Admin only) ──────────────
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin")
      return res.status(403).json({ message: "Admin access required" });
      
    const animal = await Animal.create(req.body);
    req.app.get("io").emit("animal_added", animal);
    res.status(201).json(animal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/animals/:id — update animal ───────────────────────
router.put("/:id", auth, async (req, res) => {
  try {
    const animal = await Animal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!animal) return res.status(404).json({ message: "Animal not found" });

    const io = req.app.get("io");

    if (req.body.isBreaching && !animal.isBreaching) {
      const alert = await Alert.create({
        severity:    "Critical",
        type:        "boundary_breach",
        title:       `${animal.name} — boundary breach`,
        description: `${animal.name} has exited its designated habitat zone`,
        species:     animal.species,
        animalId:    animal._id,
        animalName:  animal.name,
        zone:        animal.zone,
      });
      io.emit("new_alert", alert);
    }

    io.emit("animal_updated", animal);
    res.json(animal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/animals/:id/position — lightweight position update ─
router.put("/:id/position", auth
    , async (req, res) => {
  try {
    const { latitude, longitude, isBreaching } = req.body;
    const animal = await Animal.findByIdAndUpdate(
      req.params.id,
      { "location.latitude": latitude, "location.longitude": longitude, isBreaching, lastUpdated: new Date() },
      { new: true }
    );
    if (!animal) return res.status(404).json({ message: "Not found" });

    req.app.get("io").emit("animal_moved", {
      _id: animal._id, 
      species: animal.species,
      name: animal.name, 
      location: animal.location,
      isBreaching: animal.isBreaching,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/animals/:id (Admin only) ───────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin")
      return res.status(403).json({ message: "Admin access required" });
      
    await Animal.findByIdAndDelete(req.params.id);
    req.app.get("io").emit("animal_deleted", { id: req.params.id });
    res.json({ message: "Animal deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;