const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

// Kết nối PostgreSQL Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ ROUTE TEST
app.get("/", (req, res) => {
  res.send("Smart Door API is running");
});

// ✅ ROUTE GHI TRẠNG THÁI (CHỐNG SPAM)
app.get("/log", async (req, res) => {
  const state = req.query.state;
  if (!state) return res.status(400).send("Missing state");

  try {
    const result = await pool.query(
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
