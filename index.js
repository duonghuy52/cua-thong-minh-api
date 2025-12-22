const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Cho phép giao diện web truy cập API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- KẾT NỐI MONGODB ---
// Vercel sẽ lấy giá trị này từ Environment Variables mà bạn đã cài đặt
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- ĐỊNH NGHĨA SCHEMA (Cấu trúc dữ liệu) ---
const doorLogSchema = new mongoose.Schema({
  state: { type: String, required: true }, // "OPEN" hoặc "CLOSE"
  timestamp: { type: Date, default: Date.now }
});

const DoorLog = mongoose.model("DoorLog", doorLogSchema);

// --- CÁC ĐƯỜNG DẪN (ROUTES) ---

// 1. Kiểm tra Server
app.get("/", (req, res) => {
  res.send("Smart Door API with MongoDB is running...");
});

// 2. ESP32 Gửi trạng thái lên (POST)
app.post("/api/door/status", async (req, res) => {
  const { state } = req.body;
  if (!state) return res.status(400).send("Missing state");

  try {
    // CHỐNG SPAM: Chỉ lưu nếu trạng thái mới khác với trạng thái gần nhất trong DB
    const lastLog = await DoorLog.findOne().sort({ timestamp: -1 });

    if (!lastLog || lastLog.state !== state) {
      const newLog = new DoorLog({ state: state.toUpperCase() });
      await newLog.save();
      return res.send("✅ State saved to MongoDB");
    }

    res.send("ℹ️ State unchanged, not saved.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
});

// 3. Lấy thống kê số lần đóng/mở TRONG NGÀY (GET)
app.get("/api/door/stats", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Lấy mốc 00:00:00 sáng nay

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Lấy mốc 23:59:59 tối nay

    const logsToday = await DoorLog.find({
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    const openCount = logsToday.filter(log => log.state === "OPEN").length;
    const closeCount = logsToday.filter(log => log.state === "CLOSE").length;

    res.json({
      success: true,
      stats: {
        opens: openCount,
        closes: closeCount,
        totalActions: logsToday.length
      },
      date: startOfDay.toLocaleDateString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is flying on port ${port}`);
});
