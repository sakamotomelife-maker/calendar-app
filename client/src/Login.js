// Login.js
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./Login.css";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // 保存されたメールアドレスを読み込む
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("メールアドレスまたはパスワードが違います");
      return;
    }

    // メールアドレス保存
    if (rememberEmail) {
      localStorage.setItem("savedEmail", email);
    } else {
      localStorage.removeItem("savedEmail");
    }

    onLogin();
  };

  return (
    <div className="login-container">
      {/* タイトル */}
      <h1 className="title">MyCalendar</h1>
      <p className="subtitle">-created by Yuki Sakamoto-</p>

      <form onSubmit={handleSubmit} className="login-form">
        {/* 入力ボックス（水色の枠） */}
        <div className="login-box">
          <div>
            <label className="login-label">メールアドレス</label>
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="login-label">パスワード</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                👁
              </button>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && <div className="login-error">{error}</div>}

        {/* メールアドレス保存（右寄せ・水色枠の外） */}
        <div className="remember-row remember-outside">
          <label>
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
            />
            メールアドレスを保存する
          </label>
        </div>

        {/* ログイン認証ボタン（水色枠の外・フォント小さめ） */}
        <div className="login-btn-wrapper">
          <button type="submit" className="login-btn">
            ログイン認証
          </button>
        </div>
      </form>
    </div>
  );
}

