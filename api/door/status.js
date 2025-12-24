import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!mongoose.connection.readyState) {
  await mongoose.connect(MONGO_URI);
}

const LogSchema = new mongoose.Schema({
  state: { type: String, enum: ["OPEN", "CLOSE"], required: true },
  timestamp: { type: Date, default: Date.now },
});

const Log = mongoose.models.Log || mongoose.model("Log", LogSchema);

export default async function handler(req, res) {

  if (req.method === "POST") {
    const { state } = req.body;
    if (!["OPEN", "CLOSE"].includes(state))
      return res.status(400).json({ error: "Invalid state" });

    await Log.create({ state });
    return res.json({ success: true });
  }

  if (req.method === "GET") {
    const last = await Log.findOne().sort({ timestamp: -1 });
    return res.json({ state: last ? last.state : "UNKNOWN" });
  }

  res.status(405).end();
}
