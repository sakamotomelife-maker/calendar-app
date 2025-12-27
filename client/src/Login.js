import { useState, useEffect } from "react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true); // デフォルトON
  const [error, setError] = useState("");

  // -------------------------
  // 初回ロード時：保存されたメールアドレスを読み込む
  // -------------------------
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  // -------------------------
  // ログイン処理
  // -------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    fetch("https://calendar-app-8kqm.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("ログインに失敗しました");
        return res.json();
      })
      .then(() => {
        // メールアドレス保存
        if (rememberEmail) {
          localStorage.setItem("savedEmail", email);
        } else {
          localStorage.removeItem("savedEmail");
        }

        onLogin(); // App.js に通知
      })
      .catch(() => {
        setError("メールアドレスまたはパスワードが違います");
      });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>ログイン</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>メールアドレス</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>パスワード</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        {/* メールアドレス保存チェック */}
        <div style={{ marginBottom: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
            />
            メールアドレスを保存する
          </label>
        </div>

        {error && (
          <div style={{ color: "red", marginBottom: 10 }}>{error}</div>
        )}

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ログイン
        </button>
      </form>
    </div>
  );
}

