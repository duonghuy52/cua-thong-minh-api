const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json());

/* ================== MONGODB ================== */
/* THAY URI BẰNG CỦA BẠN */
mongoose.connect(
  "mongodb+srv://huy98516:dnqh98516@smartdoorcluster.hru0elc.mongodb.net/?appName=SmartDoorCluster",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mongoose.connection.once("open", () => {
  console.log("MongoDB connected");
});

/* ================== SCHEMA ================== */
const LogSchema = new mongoose.Schema({
  state: {
    type: String,
    enum: ["OPEN", "CLOSE"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Log = mongoose.model("Log", LogSchema);

/* ================== API: ESP32 POST STATE ================== */
/* ESP32 GỬI OPEN / CLOSE */
app.post("/api/door/status", async (req, res) => {
  try {
    const { state } = req.body;

    if (!state || (state !== "OPEN" && state !== "CLOSE")) {
      return res.status(400).json({
        success: false,
        message: "Invalid state",
      });
    }

    const log = new Log({ state });
    await log.save();

    console.log("Saved state:", state);

    res.json({
      success: true,
      message: "State saved",
      state,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* ================== API: WEB GET STATS ================== */
/* WEB GỌI API NÀY */
app.get("/api/door/stats", async (req, res) => {
  try {
    const queryDate = req.query.date;
    let start = new Date();

    if (queryDate) {
      start = new Date(queryDate);
    }

    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const logs = await Log.find({
      timestamp: { $gte: start, $lte: end },
    });

    const opens = logs.filter(l => l.state === "OPEN").length;
    const closes = logs.filter(l => l.state === "CLOSE").length;

    res.json({
      success: true,
      stats: {
        opens: opens > 0 ? opens : "Không có",
        closes: closes > 0 ? closes : "Không có",
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
/* ================== DEFAULT ROUTE ================== */
app.get("/", (req, res) => {
  res.send("Smart Door API is running");
});
/* ================== EXPORT (CHO VERCEL) ================== */
module.exports = app;
