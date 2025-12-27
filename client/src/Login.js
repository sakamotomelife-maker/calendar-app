import { useState } from "react";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");        // ← 初期値を空に
  const [password, setPassword] = useState("");  // ← 初期値を空に
  const [remember, setRemember] = useState(false); // ← チェックボックス

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("https://calendar-app-8kqm.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Login failed");
        return res.json();
      })
      .then(() => {
        // remember が true のときだけ localStorage に保存
        if (remember) {
          localStorage.setItem("savedEmail", email);
        } else {
          localStorage.removeItem("savedEmail");
        }
        onLogin();
      })
      .catch(() => alert("メールアドレスまたはパスワードが違います"));
  };

  return (
    <div className="login-container">
      <h1 className="title">MyCalendar</h1>
      <div className="subtitle">- created by Sakamoto -</div>

      <form className="login-box" onSubmit={handleSubmit}>
        <label>メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="remember-row">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>このデバイスでログイン情報を保持</span>
        </div>

        <button type="submit" className="login-btn">ログイン</button>
      </form>
    </div>
  );
}

