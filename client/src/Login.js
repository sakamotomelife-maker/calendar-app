import { useState } from "react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("yuki@example.com");
  const [password, setPassword] = useState("yuki1234");
  const [error, setError] = useState("");

  const login = () => {
    fetch("https://calendar-app-8kqm.onrender.com/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Login failed");
        return res.json();
      })
      .then(() => {
        onLogin(); // 成功したときだけログイン扱い
      })
      .catch(() => {
        setError("メールまたはパスワードが違います");
      });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>ログイン</h2>

      <div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メール"
        />
      </div>

      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
        />
      </div>

      <button onClick={login}>ログイン</button>

      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}

