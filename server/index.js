const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// 予定データ保存用ファイル
const DATA_FILE = "events.json";

// 初期化
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "{}");
}

// 予定取得
app.get("/events", (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  res.json(data);
});

// 予定保存
app.post("/events", (req, res) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(req.body));
  res.json({ ok: true });
});

app.listen(3001, () => console.log("Server running on port 3001"));
