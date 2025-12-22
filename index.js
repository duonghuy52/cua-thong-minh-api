// API Thống kê theo ngày (mặc định là hôm nay)
app.get("/api/door/stats", async (req, res) => {
    try {
        const queryDate = req.query.date; // Lấy ngày từ trình duyệt gửi lên
        let start = new Date();
        
        if (queryDate) {
            start = new Date(queryDate);
        }
        
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);

        const logs = await Log.find({ 
            timestamp: { $gte: start, $lte: end } 
        });

        const opens = logs.filter(l => l.state === "OPEN").length;
        const closes = logs.filter(l => l.state === "CLOSE").length;

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
