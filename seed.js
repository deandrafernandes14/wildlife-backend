// Run this once to populate your database:
// node seed.js

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("./models/User");
const Animal   = require("./models/Animal");
const Alert    = require("./models/Alert");

const USERS = [
  { name: "Arjun Pawar",      email: "arjun@reserve.gov.in",       password: "admin123",  role: "Admin"      },
  { name: "Rahul Patil",      email: "r.patil@reserve.gov.in",     password: "officer123",role: "Officer"    },
  { name: "Sneha Desai",      email: "s.desai@reserve.gov.in",     password: "officer123",role: "Officer"    },
  { name: "Priya Mane",       email: "p.mane@wildresearch.in",     password: "research123",role: "Researcher"},
  { name: "Vikram Kulkarni",  email: "v.kulkarni@wildresearch.in", password: "research123",role: "Researcher"},
];

const ZONE_CENTERS = {
  tigerZone:        { latitude: 26.595, longitude: 93.230 },
  leopardZone:      { latitude: 26.632, longitude: 93.138 },
  deerGrassland:    { latitude: 26.605, longitude: 93.107 },
  rhinoZone:        { latitude: 26.570, longitude: 93.107 },
  elephantCorridor: { latitude: 26.590, longitude: 93.240 },
  easternRange:     { latitude: 26.582, longitude: 93.365 },
};

function randomNear(center, radius) {
  return {
    latitude:  center.latitude  + (Math.random() - 0.5) * radius,
    longitude: center.longitude + (Math.random() - 0.5) * radius,
  };
}

const SPECIES_ZONES = {
  Tiger:      { zone: "tigerZone",        count: 6,  radius: 0.015 },
  Leopard:    { zone: "leopardZone",      count: 4,  radius: 0.010 },
  Deer:       { zone: "deerGrassland",    count: 12, radius: 0.012 },
  Rhino:      { zone: "rhinoZone",        count: 8,  radius: 0.010 },
  Elephant:   { zone: "elephantCorridor", count: 10, radius: 0.020 },
  Gaur:       { zone: "easternRange",     count: 6,  radius: 0.010 },
  "Wild Boar":{ zone: "easternRange",     count: 8,  radius: 0.008 },
};

const HEALTH_OPTIONS = ["Good", "Good", "Good", "Moderate", "Critical"];
const ACTIVITY_OPTIONS = ["Active", "Active", "Resting", "Feeding"];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Clear existing data
  await User.deleteMany({});
  await Animal.deleteMany({});
  await Alert.deleteMany({});
  console.log("🗑  Cleared existing data");

  // Create users (passwords are hashed via model pre-save hook)
  const createdUsers = await User.create(USERS);
  console.log(`👤 Created ${createdUsers.length} users`);

  // Create animals
  const animals = [];
  for (const [species, cfg] of Object.entries(SPECIES_ZONES)) {
    const center = ZONE_CENTERS[cfg.zone];
    for (let i = 1; i <= cfg.count; i++) {
      const pos = randomNear(center, cfg.radius);
      animals.push({
        name:     `${species} ${i}`,
        species,
        health:   HEALTH_OPTIONS[Math.floor(Math.random() * HEALTH_OPTIONS.length)],
        zone:     cfg.zone,
        activity: ACTIVITY_OPTIONS[Math.floor(Math.random() * ACTIVITY_OPTIONS.length)],
        location: { latitude: pos.latitude, longitude: pos.longitude },
        isBreaching: false,
      });
    }
  }
  const createdAnimals = await Animal.create(animals);
  console.log(`🐾 Created ${createdAnimals.length} animals`);

  // Create some initial alerts
  const criticalAnimals = createdAnimals.filter((a) => a.health === "Critical").slice(0, 3);
  const alertDocs = criticalAnimals.map((a) => ({
    severity:    "Critical",
    type:        "health_critical",
    title:       `${a.name} — critical health`,
    description: `Health status flagged for ${a.name} in zone ${a.zone}`,
    species:     a.species,
    animalId:    a._id,
    animalName:  a.name,
    zone:        a.zone,
  }));
  if (alertDocs.length > 0) {
    await Alert.create(alertDocs);
    console.log(`🚨 Created ${alertDocs.length} alerts`);
  }

  console.log("\n✅ Seed complete! Login credentials:");
  USERS.forEach((u) => console.log(`  ${u.role.padEnd(12)} ${u.email} / ${u.password}`));
  await mongoose.disconnect();
}

seed().catch(console.error);
