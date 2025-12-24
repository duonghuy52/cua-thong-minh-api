import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!mongoose.connection.readyState) {
  await mongoose.connect(MONGO_URI);
}

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

const Log = mongoose.models.Log || mongoose.model("Log", LogSchema);

export default async function handler(req, res) {

  // ===== POST: ESP32 gửi trạng thái =====
  if (req.method === "POST") {
    const { state } = req.body;

    if (!state || !["OPEN", "CLOSE"].includes(state)) {
      return res.status(400).json({ message: "Invalid state" });
    }

    await Log.create({ state });

    return res.status(200).json({ success: true });
  }

  // ===== GET: WEB lấy trạng thái mới nhất =====
  if (req.method === "GET") {
    const last = await Log.findOne().sort({ timestamp: -1 });

    return res.status(200).json({
      state: last ? last.state : "UNKNOWN",
    });
  }

  res.status(405).end();
}
