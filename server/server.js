const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cookieParser());

// ----------------------
// CORS（本番対応）
// ----------------------
app.use(
  cors({
    origin: "https://calendar-app-static-epyy.onrender.com", // ← フロントURL
    credentials: true,
  })
);

// ----------------------
// 設定
// ----------------------
const SECRET = "your-secret-key";
const DB_FILE = "./db.json";

// ----------------------
// DB 読み書き
// ----------------------
function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ----------------------
// 初期ユーザー
// ----------------------
const initialPasswordHash = bcrypt.hashSync("yuki1234", 10);

const initialDB = {
  users: [
    {
      id: 1,
      email: "yuki@example.com",
      password: initialPasswordHash,
    },
  ],
  events: {
    "1": {}
  },
  commonMemo: {
    "1": ""
  }
};

if (!fs.existsSync(DB_FILE)) {
  saveDB(initialDB);
}

// ----------------------
// JWT 認証ミドルウェア（※ここを上に移動）
// ----------------------
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ----------------------
// 共通メモ取得
// ----------------------
app.get("/common-memo", authMiddleware, (req, res) => {
  const db = loadDB();
  const memo = db.commonMemo?.[req.userId] || "";
  res.json({ memo });
});

// ----------------------
// 共通メモ保存
// ----------------------
app.post("/common-memo", authMiddleware, (req, res) => {
  const db = loadDB();
  if (!db.commonMemo) db.commonMemo = {};
  db.commonMemo[req.userId] = req.body.memo || "";
  saveDB(db);
  res.json({ success: true });
});

// ----------------------
// ログイン
// ----------------------
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();

  const user = db.users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: "Invalid email" });

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid password" });

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "7d" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.json({ success: true });
});

// ----------------------
// ログアウト
// ----------------------
app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    secure: true,
    sameSite: "none",
  });
  res.json({ success: true });
});

// ----------------------
// 認証必須：ユーザー情報
// ----------------------
app.get("/me", authMiddleware, (req, res) => {
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.userId);
  res.json({ email: user.email });
});

// ----------------------
// 認証必須：予定取得
// ----------------------
app.get("/events", authMiddleware, (req, res) => {
  const db = loadDB();
  const events = db.events[String(req.userId)] || {};
  res.json(events);
});

// ----------------------
// 認証必須：予定保存
// ----------------------
app.post("/events", authMiddleware, (req, res) => {
  const db = loadDB();
  db.events[String(req.userId)] = req.body;
  saveDB(db);
  res.json({ success: true });
});

// ----------------------
// サーバー起動
// ----------------------
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

