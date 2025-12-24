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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { state } = req.body;

  if (!state || !["OPEN", "CLOSE"].includes(state)) {
    return res.status(400).json({ message: "Invalid state" });
  }

  await Log.create({ state });

  res.status(200).json({ success: true, state });
}
