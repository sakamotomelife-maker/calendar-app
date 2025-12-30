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

  // preset / text / color が変わるたびに自動保存
  useEffect(() => {
    const newEvents = {
      ...events,
      [date]: { preset, note: text, color },
    };
    saveToSupabase(newEvents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {/* 上部：日付 + 削除ボタン（右側） */}
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

        {/* 色ボタン 7 色（1色目をグレーに変更） */}
        <div className="color-buttons">
          {[
            "#eeeeee", // 薄いグレー（今日の背景色と被らない）
            "#fff9c4", // 薄黄
            "#ffebee", // 薄赤
            "#bbdefb", // 薄青
            "#f8bbd0", // 薄ピンク
            "#d1c4e9", // 薄紫
            "#ffccbc", // 薄オレンジ
          ].map((col, i) => (
            <div
              key={i}
              className={`color-btn ${color === col ? "selected" : ""}`}
              style={{ background: col }}
              onClick={() => toggleColor(col)}
            />
          ))}
        </div>

        <div className="modal-hint">入力・選択内容は自動で保存されます</div>
      </div>
    </div>
  );
}
