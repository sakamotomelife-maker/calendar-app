import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Login from "./Login";
import Calendar from "./Calendar";
import './App.css';


const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // 初回ロード：ログイン状態を確認
  // -------------------------
  useEffect(() => {
    const checkSession = async () => {
      const session = (await supabase.auth.getSession()).data.session;
      setUser(session?.user || null);
      setLoading(false);
    };

    checkSession();

    // ログイン状態の変化を監視
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // -------------------------
  // ログアウト
  // -------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // -------------------------
  // Login.js からのログイン通知
  // -------------------------
  const handleLogin = async () => {
    const session = (await supabase.auth.getSession()).data.session;
    setUser(session?.user || null);
  };

  if (loading) {
    return <div style={{ padding: 20 }}>読み込み中...</div>;
  }

  return (
    <div>
      {/* 未ログイン → Login */}
      {!user && <Login onLogin={handleLogin} />}

      {/* ログイン済み → Calendar */}
      {user && (
        <Calendar
          userEmail={user.email}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

