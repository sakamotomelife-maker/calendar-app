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

  useEffect(() => {
    const newEvents = {
      ...events,
      [date]: { preset, note: text, color },
    };
    saveToSupabase(newEvents);
  }, [preset, text, color]);

  const remove = async () => {
    if (!window.confirm("この日の予定を削除しますか？")) return;

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
        <div className="modal-header">
          <h2 className="modal-date">{date}</h2>
          <button className="delete-btn-top" onClick={remove}>
            削除
          </button>
        </div>

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

        <div className="text-area-wrapper">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="予定を入力"
          />
        </div>

        {/* 色ボタン（6色） */}
        <div className="color-buttons">
          {[
            "#fff9c4", // 薄い黄色
            "#ffccbc", // 薄いオレンジ
            "#c8e6c9", // 薄い緑
            "#ef5350", // 赤（薄くなくてよい）
            "#eeeeee", // 薄いグレー（薄い緑の代わり）
            "#ffebee", // 公休と同じ薄い赤
          ].map((col, i) => (
            <div
              key={i}
              className={`color-btn ${color === col ? "selected" : ""}`}
              style={{ background: col }}
              onClick={() => toggleColor(col)}
            />
          ))}
        </div>

        <div className="modal-hint">
          選択後は本画面外をタップまたはクリックしてください
        </div>
      </div>
    </div>
  );
}
