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

  const togglePreset = (value) => {
    setPreset((prev) => (prev === value ? "" : value));
  };

  const toggleColor = (value) => {
    setColor((prev) => (prev === value ? "" : value));
  };

  // -------------------------
  // Supabase 保存処理
  // -------------------------
  const saveToSupabase = async (newEvents) => {
    setEvents(newEvents);

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const payload = {
      user_id: user.id,
      date,
      preset,
      note: text,
      color,
    };

    // 既存データがあるか確認
    const { data: existing } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();

    if (existing) {
      // UPDATE
      await supabase
        .from("events")
        .update(payload)
        .eq("id", existing.id);
    } else {
      // INSERT
      await supabase.from("events").insert(payload);
    }
  };

  // -------------------------
  // 自動保存（preset / text / color が変わるたびに保存）
  // -------------------------
  useEffect(() => {
    const newEvents = {
      ...events,
      [date]: { preset, note: text, color },
    };
    saveToSupabase(newEvents);
  }, [preset, text, color]);

  // -------------------------
  // 削除処理
  // -------------------------
  const remove = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    // Supabase から削除
    await supabase
      .from("events")
      .delete()
      .eq("user_id", user.id)
      .eq("date", date);

    // React state から削除
    const newEvents = { ...events };
    delete newEvents[date];
    setEvents(newEvents);

    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        
        {/* 日付 */}
        <h2>{date}</h2>

        {/* プリセットボタン */}
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

        {/* 予定入力欄 */}
        <div className="text-area-wrapper">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="予定を入力"
            className={preset ? "textarea-with-preset" : "textarea-no-preset"}
          />
        </div>

        {/* 背景色ボタン */}
        <div className="color-buttons">
          <div
            className={`color-btn ${color === "#c8e6c9" ? "selected" : ""}`}
            style={{ background: "#c8e6c9" }}
            onClick={() => toggleColor("#c8e6c9")}
          ></div>

          <div
            className={`color-btn ${color === "#fff9c4" ? "selected" : ""}`}
            style={{ background: "#fff9c4" }}
            onClick={() => toggleColor("#fff9c4")}
          ></div>

          <div
            className={`color-btn ${color === "#ffebee" ? "selected" : ""}`}
            style={{ background: "#ffebee" }}
            onClick={() => toggleColor("#ffebee")}
          ></div>

          <div
            className={`color-btn ${color === "#ff5252" ? "selected" : ""}`}
            style={{ background: "#ff5252", color: "black" }}
            onClick={() => toggleColor("#ff5252")}
          >
            !
          </div>
        </div>

        {/* 削除 */}
        <div className="modal-footer">
          <button className="danger delete-btn" onClick={remove}>削除</button>
        </div>

      </div>
    </div>
  );
}

