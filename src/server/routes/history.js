const express = require("express");
const router = express.Router();

let db = null;

function setDb(database) {
  db = database;
}

router.get("/api/history", (req, res) => {
  if (!db) return res.json({ meetings: [], total: 0 });
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const perPage = Math.min(Math.max(1, parseInt(req.query.perPage) || 20), 100);
  try {
    const result = db.getMeetingHistory(page, perPage);
    res.json(result);
  } catch (err) {
    console.error("Failed to fetch meeting history:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/history/:id", (req, res) => {
  if (!db) return res.status(404).json({ error: "Database not available" });
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 1)
    return res.status(400).json({ error: "Invalid meeting ID" });
  try {
    const detail = db.getMeetingDetail(id);
    if (!detail) return res.status(404).json({ error: "Meeting not found" });
    res.json(detail);
  } catch (err) {
    console.error("Failed to fetch meeting detail:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = { router, setDb };
