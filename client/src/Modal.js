import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./Modal.css";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ▼ 開始：7〜20
const START_HOURS = Array.from({ length: 14 }, (_, i) => 7 + i);
// ▼ 終了：12〜22
const END_HOURS = Array.from({ length: 11 }, (_, i) => 12 + i);

const MINUTES = ["00", "15", "30", "45"];

export default function Modal({
  date,
  events,
  setEvents,
  holidays,
  onClose,
  mode,
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

  // ▼ 時・分を分離して管理（初期値は空白）
  const [startHour, setStartHour] = useState(
    current.start_time ? current.start_time.split(":")[0] : ""
  );
  const [startMin, setStartMin] = useState(
    current.start_time ? current.start_time.split(":")[1] : ""
  );

  const [endHour, setEndHour] = useState(
    current.end_time ? current.end_time.split(":")[0] : ""
  );
  const [endMin, setEndMin] = useState(
    current.end_time ? current.end_time.split(":")[1] : ""
  );

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

    // start_time / end_time を組み立て（分が空なら "00"）
    let start_time = null;
    let end_time = null;

    if (mode === "timeRange") {
      if (startHour) {
        const m = startMin || "00";
        start_time = `${startHour}:${m}`;
      }
      if (endHour) {
        const m = endMin || "00";
        end_time = `${endHour}:${m}`;
      }
    }

    const payload = {
      user_id: user.id,
      date,
      preset,
      note: text,
      color,
      start_time,
      end_time,
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
     プリセット選択 → 即保存して閉じる
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
     色選択 → 即保存して閉じる
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
        start_time: null,
        end_time: null,
      },
    };

    await saveToSupabase(newEvents, { color: newColor });
    onClose();
  };

  /* -----------------------------
     メモだけ自動保存
  ----------------------------- */
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newEvents = {
        ...events,
        [date]: {
          preset,
          note: text,
          color,
          start_time: current.start_time,
          end_time: current.end_time,
        },
      };
      saveToSupabase(newEvents);
    }, 300);

    return () => clearTimeout(timeout);
  }, [text]);

  /* -----------------------------
     時刻変更 → 即保存
  ----------------------------- */
  useEffect(() => {
    if (mode !== "timeRange") return;

    const update = async () => {
      let start_time = null;
      let end_time = null;

      if (startHour) {
        const m = startMin || "00";
        start_time = `${startHour}:${m}`;
      }
      if (endHour) {
        const m = endMin || "00";
        end_time = `${endHour}:${m}`;
      }

      const newEvents = {
        ...events,
        [date]: {
          preset: "",
          note: text,
          color,
          start_time,
          end_time,
        },
      };

      await saveToSupabase(newEvents, {
        preset: "",
        start_time,
        end_time,
      });
    };

    // 何も選ばれていない状態（全空）のときも保存して祝日復活させる
    if (!startHour && !startMin && !endHour && !endMin) {
      const newEvents = {
        ...events,
        [date]: {
          preset: "",
          note: text,
          color,
          start_time: null,
          end_time: null,
        },
      };
      saveToSupabase(newEvents, {
        preset: "",
        start_time: null,
        end_time: null,
      });
      return;
    }

    update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startHour, startMin, endHour, endMin]);

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
                // OK は閉じるだけ（保存はリアルタイム）
                onClose();
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

        {/* ▼ 時間帯モード（1行レイアウト） */}
        {mode === "timeRange" && (
          <div className="time-range-block">
            <div className="time-range-row">
              {/* ▼ 開始：時 */}
              <select
                className="time-select"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
              >
                <option value="">--</option>
                {START_HOURS.map((h) => (
                  <option key={h} value={String(h).padStart(2, "0")}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>

              <span className="time-symbol">：</span>

              {/* ▼ 開始：分 */}
              <select
                className="time-select"
                value={startMin}
                onChange={(e) => setStartMin(e.target.value)}
              >
                <option value="">--</option>
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <span className="time-symbol">〜</span>

              {/* ▼ 終了：時 */}
              <select
                className="time-select"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
              >
                <option value="">--</option>
                {END_HOURS.map((h) => (
                  <option key={h} value={String(h).padStart(2, "0")}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>

              <span className="time-symbol">：</span>

              {/* ▼ 終了：分 */}
              <select
                className="time-select"
                value={endMin}
                onChange={(e) => setEndMin(e.target.value)}
              >
                <option value="">--</option>
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ▼ メモ */}
        <div className="text-area-wrapper">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="予定を入力してください"
          />
        </div>

        {/* ▼ 色選択 */}
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
