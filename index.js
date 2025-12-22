app.get("/api/door/stats", async (req, res) => {
  try {
    const queryDate = req.query.date;
    let start = queryDate ? new Date(queryDate) : new Date();
    
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const logs = await DoorLog.find({
      timestamp: { $gte: start, $lte: end }
    });

    // Trả về con số thực tế (0 nếu không có bản ghi nào)
    const opens = logs.filter(l => l.state === "OPEN").length;
    const closes = logs.filter(l => l.state === "CLOSE").length;

    res.json({
      success: true,
      stats: {
        opens: opens, 
        closes: closes
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
