const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// KẾT NỐI MONGODB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

const Log = mongoose.model("DoorLog", new mongoose.Schema({
  state: String,
  timestamp: { type: Date, default: Date.now }
}));

// API NHẬN TRẠNG THÁI TỪ ESP32
app.post("/api/door/status", async (req, res) => {
  const { state } = req.body;
  try {
    const lastLog = await Log.findOne().sort({ timestamp: -1 });
    if (!lastLog || lastLog.state !== state.toUpperCase()) {
      await new Log({ state: state.toUpperCase() }).save();
    }
    res.send("OK");
  } catch (err) { res.status(500).send(err.message); }
});

// API TRUY VẤN THỐNG KÊ (MẶC ĐỊNH HIỆN SỐ 0)
app.get("/api/door/stats", async (req, res) => {
  try {
    const queryDate = req.query.date;
    let start = queryDate ? new Date(queryDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const logs = await Log.find({ timestamp: { $gte: start, $lte: end } });
    res.json({
      success: true,
      stats: {
        opens: logs.filter(l => l.state === "OPEN").length,
        closes: logs.filter(l => l.state === "CLOSE").length
      }
    });
  } catch (err) { res.status(500).json({ success: false }); }
});

// HIỂN THỊ GIAO DIỆN WEB 
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port);
