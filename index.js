const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Middleware cấu hình
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Phục vụ giao diện từ thư mục public

// --- KẾT NỐI MONGODB ATLAS ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Kết nối MongoDB thành công"))
  .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

// Định nghĩa Schema dữ liệu
const LogSchema = new mongoose.Schema({
  state: String,
  timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model("DoorLog", LogSchema);

// --- API XỬ LÝ ---

// 1. Nhận trạng thái từ ESP32 gửi lên
app.post("/api/door/status", async (req, res) => {
  const { state } = req.body;
  try {
    const lastLog = await Log.findOne().sort({ timestamp: -1 });
    // Chỉ lưu nếu trạng thái thay đổi (OPEN -> CLOSE hoặc ngược lại)
    if (!lastLog || lastLog.state !== state.toUpperCase()) {
      await new Log({ state: state.toUpperCase() }).save();
    }
    res.send("OK");
  } catch (err) { 
    res.status(500).send(err.message); 
  }
});

// 2. API Thống kê: Nhận tham số ?date=YYYY-MM-DD từ giao diện
app.get("/api/door/stats", async (req, res) => {
  try {
    const queryDate = req.query.date; // Nhận ngày từ Web gửi qua fetch
    let start = queryDate ? new Date(queryDate) : new Date();
    
    // Thiết lập thời gian từ 00:00:00 đến 23:59:59 của ngày được chọn
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const logs = await Log.find({ 
      timestamp: { $gte: start, $lte: end } 
    });

    const opens = logs.filter(l => l.state === "OPEN").length;
    const closes = logs.filter(l => l.state === "CLOSE").length;

    // Trả về số lượng hoặc chữ "Không có" theo yêu cầu của bạn
    res.json({ 
      success: true, 
      stats: { 
        opens: opens > 0 ? opens : "Không có", 
        closes: closes > 0 ? closes : "Không có" 
      } 
    });
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
});

// Trả về file index.html cho mọi đường dẫn khác
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Server đang chạy tại cổng ${port}`);
});
