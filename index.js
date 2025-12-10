const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PostgreSQL Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ TEST SERVER
app.get("/", (req, res) => {
  res.send("Smart Door API is running");
});

// ✅ ESP32 POST STATE (CHỐNG SPAM)
app.post("/state", async (req, res) => {
  const state = req.body.state;
  if (!state) return res.status(400).send("Missing state");

  try {
    await pool.query(
      `
      INSERT INTO door_log (state)
      SELECT $1
      WHERE NOT EXISTS (
        SELECT 1 FROM door_log
        ORDER BY created_at DESC
        LIMIT 1
        HAVING state = $1
      );
      `,
      [state]
    );

    res.send("Saved");
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.listen(port, () => {
  console.log("Server running on port " + port);
});
