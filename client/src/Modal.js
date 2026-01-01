import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./Modal.css";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function Modal({ date, events, setEvents, holidays, onClose }) {
  const current = events[date] || {
    preset: "",
    note: "",
    color: "",
    start_time: null,
    end_time: null,
  };

  // 登録モード（早出/遅出/公休 or 時間帯）
  const [mode, setMode] = useState(
    localStorage.getItem("shiftMode") || "preset" // "preset" | "timeRange"
  );

  const [preset, setPreset] = useState(current.preset);
  const [text, setText] = useState(current.note);
  const [color, setColor] = useState(current.color || "");
  const [startTime, setStartTime] = useState(current.start_time || "10:00");
  const [endTime, setEndTime] = useState(current.end_time || "18:00");

  const dateObj = new Date(date);
  const isSunday = dateObj.getDay() === 0;
  const isHoliday = holidays && holidays[date] !== undefined;
  const disabledPreset = isSunday || isHoliday;

  const saveMode = (m) => {
    setMode(m);
    localStorage.setItem("shiftMode", m);
  };

  /* -----------------------------
     Supabase 保存処理
  ----------------------------- */
  const saveToSupabase = async (newEvents, options = {}) => {
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
      start_time: startTime || null,
      end_time: endTime || null,
      ...options, // 上書きしたいとき用
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

    // 時間帯はクリア
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
     テキスト入力は自動保存（閉じない）
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
     時間帯登録 → 保存して閉じる
  ----------------------------- */
  const handleTimeRangeSave = async () => {
    if (!startTime || !endTime) {
      alert("開始時間と終了時間を入力してください。");
      return;
    }

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

    setPreset(""); // preset は空にする（表示は Calendar 側で timeRange を使う）

    await saveToSupabase(newEvents, {
      preset: "",
      start_time: startTime,
      end_time: endTime,
    });

    onClose();
  };

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
              OK
            </button>

            <button className="delete-btn-top" onClick={remove}>
              削除
            </button>
          </div>
        </div>

        {/* モード切り替え */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "preset" ? "active" : ""}`}
            onClick={() => saveMode("preset")}
          >
            早出/遅出で登録
          </button>
          <button
            className={`mode-btn ${mode === "timeRange" ? "active" : ""}`}
            onClick={() => saveMode("timeRange")}
          >
            時間帯で登録
          </button>
        </div>

        {/* プリセット or 時間帯 */}
        {mode === "preset" && (
          <>
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
          </>
        )}

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

            <div className="time-range-actions">
              <button className="time-range-save-btn" onClick={handleTimeRangeSave}>
                時間帯で登録
              </button>

              <button
                className="preset-btn holiday-small"
                onClick={() => togglePreset("公休")}
                disabled={disabledPreset}
              >
                公休
              </button>
            </div>
          </div>
        )}

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

        <div className="modal-hint">※2回選択すると解除になります</div>
      </div>
    </div>
  );
}
