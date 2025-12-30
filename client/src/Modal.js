import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./Modal.css";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function Modal({ date, events, setEvents, holidays, onClose }) {
  const current = events[date] || { preset: "", note: "", color: "" };

  const [preset, setPreset] = useState(current.preset);
  const [text, setText] = useState(current.note);
  const [color, setColor] = useState(current.color || "");

  const dateObj = new Date(date);
  const isSunday = dateObj.getDay() === 0;
  const isHoliday = holidays && holidays[date] !== undefined;
  const disabledPreset = isSunday || isHoliday;

  /* -----------------------------
     Supabase 保存処理
  ----------------------------- */
  const saveToSupabase = async (newEvents) => {
    setEvents(newEvents);

    const session = (await supabase.auth.getSession()).data.session;
    const user = session?.user;
    if (!user) return;

    const payload = {
      user_id: user.id,
      date,
      preset,
      note: text,
      color,
    };

    const { data: existing } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();

    if (existing) {
      await supabase.from("events").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("events").insert(payload);
    }
  };

  /* -----------------------------
     プリセット選択 → 保存して閉じる
  ----------------------------- */
  const togglePreset = async (value) => {
    const newPreset = preset === value ? "" : value;
    setPreset(newPreset);

    const newEvents = {
      ...events,
      [date]: { preset: newPreset, note: text, color },
    };

    await saveToSupabase(newEvents);
    onClose();
  };

  /* -----------------------------
     色選択 → 保存して閉じる
  ----------------------------- */
  const toggleColor = async (value) => {
    const newColor = color === value ? "" : value;
    setColor(newColor);

    const newEvents = {
      ...events,
      [date]: { preset, note: text, color: newColor },
    };

    await saveToSupabase(newEvents);
    onClose();
  };

  /* -----------------------------
     テキスト入力は自動保存（閉じない）
  ----------------------------- */
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newEvents = {
        ...events,
        [date]: { preset, note: text, color },
      };
      saveToSupabase(newEvents);
    }, 300);

    return () => clearTimeout(timeout);
  }, [text]);

  /* -----------------------------
     削除処理
  ----------------------------- */
  const remove = async () => {
    if (!window.confirm("予定を削除しますか？")) return;

    const session = (await supabase.auth.getSession()).data.session;
    const user = session?.user;
    if (!user) return;

    await supabase
      .from("events")
      .delete()
      .eq("user_id", user.id)
      .eq("date", date);

    const newEvents = { ...events };
    delete newEvents[date];
    setEvents(newEvents);

    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        
        {/* ヘッダー */}
        <div className="modal-header">
          <h2 className="modal-date">{date}</h2>

          <div style={{ display: "flex", gap: "6px" }}>
            <button className="confirm-btn" onClick={onClose}>
              決定
            </button>

            <button className="delete-btn-top" onClick={remove}>
              削除
            </button>
          </div>
        </div>

        {/* プリセット */}
        <div className="btn-group">
          {["早出", "遅出", "公休"].map((label) => (
            <button
              key={label}
              className={`preset-btn ${preset === label ? "active" : ""}`}
              onClick={() => !disabledPreset && togglePreset(label)}
              disabled={disabledPreset}
            >
              {label}
            </button>
          ))}
        </div>

        {/* テキスト */}
        <div className="text-area-wrapper">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="予定を入力してください"
          />
        </div>

        {/* 色選択 */}
        <div className="color-buttons">
          {[
            "#fff9c4",
            "#ffccbc",
            "#c8e6c9",
            "#ef5350",
            "#eeeeee",
            "#ffebee",
          ].map((col, i) => (
            <div
              key={i}
              className={`color-btn ${color === col ? "selected" : ""}`}
              style={{ background: col }}
              onClick={() => toggleColor(col)}
            />
          ))}
        </div>

          <div className="modal-hint">※2回選択すると取消操作</div>

      </div>
    </div>
  );
}
