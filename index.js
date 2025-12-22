const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Dòng này cực kỳ quan trọng để hiện giao diện

// Kết nối MongoDB qua biến môi trường
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

const LogSchema = new mongoose.Schema({
  state: String,
  timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model("DoorLog", LogSchema);

// API nhận trạng thái từ ESP32
app.post("/api/door/status", async (req, res) => {
  const { state } = req.body;
  try {
    const lastLog = await Log.findOne().sort({ timestamp: -1 });
    if (!lastLog || lastLog.state !== state) {
      await new Log({ state }).save();
    }
    res.send("OK");
  } catch (err) { res.status(500).send(err.message); }
});

// API Thống kê cho Web truy vấn
app.get("/api/door/stats", async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  try {
    const logs = await Log.find({ timestamp: { $gte: startOfDay } });
    const opens = logs.filter(l => l.state === "OPEN").length;
    const closes = logs.filter(l => l.state === "CLOSE").length;
    res.json({ success: true, stats: { opens, closes } });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port);
