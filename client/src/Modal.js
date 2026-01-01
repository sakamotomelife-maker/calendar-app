import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./Modal.css";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function Modal({
  date,
  events,
  setEvents,
  holidays,
  onClose,
  mode, // ← preset or timeRange
}) {
  const current = events[date] || {
    preset: "",
    note: "",
    color: "",
    start_time: null,
    end_time: null,
  };

  const [preset, setPreset] = useState(current.preset);
  const [text, setText] = useState(current.note);
  const [color, setColor] = useState(current.color || "");
  const [startTime, setStartTime] = useState(current.start_time || "10:00");
  const [endTime, setEndTime] = useState(current.end_time || "18:00");

  const dateObj = new Date(date);
  const isSunday = dateObj.getDay() === 0;
  const isHoliday = holidays && holidays[date] !== undefined;
  const disabledPreset = isSunday || isHoliday;

  /* -----------------------------
     Supabase 保存処理
  ----------------------------- */
  const saveToSupabase = async (newEvents, override = {}) => {
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
      start_time: startTime,
      end_time: endTime,
      ...override,
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
      [date]: {
        preset: newPreset,
        note: text,
        color,
        start_time: null,
        end_time: null,
      },
    };

    await saveToSupabase(newEvents, {
      preset: newPreset,
      start_time: null,
      end_time: null,
    });

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
      [date]: {
        preset,
        note: text,
        color: newColor,
        start_time: startTime,
        end_time: endTime,
      },
    };

    await saveToSupabase(newEvents, { color: newColor });
    onClose();
  };

  /* -----------------------------
     テキスト自動保存
  ----------------------------- */
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newEvents = {
        ...events,
        [date]: {
          preset,
          note: text,
          color,
          start_time: startTime,
          end_time: endTime,
        },
      };
      saveToSupabase(newEvents);
    }, 300);

    return () => clearTimeout(timeout);
  }, [text]);

  /* -----------------------------
     時間帯モード → OK で保存
  ----------------------------- */
  const saveTimeRange = async () => {
    const newEvents = {
      ...events,
      [date]: {
        preset: "",
        note: text,
        color,
        start_time: startTime,
        end_time: endTime,
      },
    };

    await saveToSupabase(newEvents, {
      preset: "",
      start_time: startTime,
      end_time: endTime,
    });

    onClose();
  };

  /* -----------------------------
     削除
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
            <button
              className="confirm-btn"
              onClick={() => {
                if (mode === "timeRange") saveTimeRange();
                else onClose();
              }}
            >
              OK
            </button>

            <button className="delete-btn-top" onClick={remove}>
              削除
            </button>
          </div>
        </div>

        {/* ▼ preset モード */}
        {mode === "preset" && (
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
        )}

        {/* ▼ 時間帯モード */}
        {mode === "timeRange" && (
          <div className="time-range-block">
            <div className="time-input-row">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <span>-</span>
              <input
                type="time"
                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ▼ テキストエリア（共通） */}
        <div className="text-area-wrapper">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="予定を入力してください"
          />
        </div>

        {/* ▼ 色選択（共通） */}
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

        <div className="modal-hint">※2回選択すると解除になります</div>
      </div>
    </div>
  );
}
