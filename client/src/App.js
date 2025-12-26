import { useState, useEffect } from "react";
import Calendar from "./Calendar";
import Login from "./Login";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // 起動時にログイン状態チェック
  useEffect(() => {
    fetch("https://calendar-app-u3s5.onrender.com/events", {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          setLoggedIn(true);

          // ログイン中ユーザー情報を取得
          fetch("https://calendar-app-u3s5.onrender.com/events", {
            credentials: "include",
          })
            .then((r) => r.json())
            .then((data) => setUserEmail(data.email));
        } else {
          setLoggedIn(false);
        }
      })
      .catch(() => setLoggedIn(false));
  }, []);

  // ログアウト処理
  const logout = () => {
    fetch("http://localhost:3001/logout", {
      method: "POST",
      credentials: "include",
    }).then(() => {
      setLoggedIn(false);
      setUserEmail("");
    });
  };

  // ログイン成功時
  const handleLogin = () => {
    setLoggedIn(true);

    // ログイン直後にユーザー情報取得
    fetch("http://localhost:3001/me", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => setUserEmail(data.email));
  };

  // 未ログインならログイン画面
  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // ログイン済みならカレンダー
  return (
    <div>
      <h1>カレンダーアプリ</h1>
      <Calendar userEmail={userEmail} onLogout={logout} />
    </div>
  );
}

export default App;
 
