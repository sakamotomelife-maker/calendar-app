import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Modal from "./Modal";
import "./Calendar.css";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function Calendar({ userEmail, onLogout }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [holidays, setHolidays] = useState({});
  const [commonMemo, setCommonMemo] = useState("");

  // 設定モーダル
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 登録モード
  const [registerMode, setRegisterMode] = useState(
    localStorage.getItem("registerMode") || "preset"
  );

  const saveRegisterMode = (mode) => {
    setRegisterMode(mode);
    localStorage.setItem("registerMode", mode);
  };

  const weekdays = ["月", "火", "水", "木", "金", "土", "日"];

  function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0).getDate();
    let start = firstDay.getDay();
    start = start === 0 ? 6 : start - 1;

    const days = [];
    for (let i = 0; i < start; i++) days.push(null);
    for (let d = 1; d <= lastDate; d++) days.push(d);
    return days;
  }

  const days = getCalendarDays(year, month);

  function changeMonth(offset) {
    let newMonth = month + offset;
    let newYear = year;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    setMonth(newMonth);
    setYear(newYear);
  }

  /* -----------------------------
     予定読み込み
  ----------------------------- */
  useEffect(() => {
    const loadEvents = async () => {
      const session = (await supabase.auth.getSession()).data.session;
      const user = session?.user;
      if (!user) return;

      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id);

      const obj = {};
      data?.forEach((ev) => {
        obj[ev.date] = {
          preset: ev.preset,
          note: ev.note,
          color: ev.color,
          start_time: ev.start_time || null,
          end_time: ev.end_time || null,
        };
      });

      setEvents(obj);
    };

    loadEvents();
  }, []);

  /* -----------------------------
     共通メモ読み込み
  ----------------------------- */
  useEffect(() => {
    const loadMemo = async () => {
      const session = (await supabase.auth.getSession()).data.session;
      const user = session?.user;
      if (!user) return;

      const { data } = await supabase
        .from("common_memo")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setCommonMemo(data?.memo || "");
    };

    loadMemo();
  }, []);

  /* -----------------------------
     共通メモ：自動保存
  ----------------------------- */
  useEffect(() => {
    const timeout = setTimeout(async () => {
      const session = (await supabase.auth.getSession()).data.session;
      const user = session?.user;
      if (!user) return;

      const { data: existing } = await supabase
        .from("common_memo")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("common_memo")
          .update({ memo: commonMemo })
          .eq("id", existing.id);
      } else {
        await supabase.from("common_memo").insert({
          user_id: user.id,
          memo: commonMemo,
        });
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [commonMemo]);

  /* -----------------------------
     祝日読み込み
  ----------------------------- */
  useEffect(() => {
    fetch("https://holidays-jp.github.io/api/v1/date.json")
      .then((res) => res.json())
      .then((data) => setHolidays(data))
      .catch(() => setHolidays({}));
  }, []);

  const handleLogout = () => {
    if (window.confirm("ログアウトしますか？")) {
      onLogout();
    }
  };

  /* -----------------------------
     時間帯の短縮表示（スマホ用）
  ----------------------------- */
  const formatTimeRange = (start, end) => {
    if (!start || !end) return null;

    const isMobile = window.innerWidth <= 480;

    if (!isMobile) return `${start}-${end}`;

    const s = start.replace(":00", "");
    const e = end.replace(":00", "");

    return `${s}-${e}`;
  };

  return (
    <div className="calendar-wrapper">

      {/* ▼ 右上固定の設定ボタン */}
      <button
        className="settings-fixed-btn"
        onClick={() => setSettingsOpen(true)}
      >
        設定
      </button>

      {/* 上部バー */}
      <div className="calendar-top-bar">
        <span className="user-email">{userEmail}</span>
      </div>

      {/* 年月 */}
      <div className="calendar-header">
        <button onClick={() => changeMonth(-1)}>←</button>

        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {Array.from({ length: 20 }, (_, i) => today.getFullYear() - 10 + i).map(
            (y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            )
          )}
        </select>

        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>
              {i + 1}月
            </option>
          ))}
        </select>

        <button onClick={() => changeMonth(1)}>→</button>
      </div>

      {/* 曜日 */}
      <div className="weekday-row">
        {weekdays.map((w) => (
          <div key={w} className="weekday-cell">
            {w}
          </div>
        ))}
      </div>

      {/* カレンダー */}
      <div className="calendar">
        {days.map((day, index) => {
          const weekdayIndex = index % 7;

          if (day === null) {
            return <div key={index} className="cell empty"></div>;
          }

          const dateStr = `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;

          const event = events[dateStr];
          const holidayName = holidays[dateStr];

          const isToday =
            year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate();

          let cellClass = "cell";
          if (weekdayIndex === 5) cellClass += " saturday";
          if (weekdayIndex === 6) cellClass += " sunday";
          if (holidayName) cellClass += " holiday";
          if (isToday) cellClass += " today";

          if (!event?.color) {
            if (event?.preset === "公休") cellClass += " bg-kokyu";
            if (event?.preset === "遅出") cellClass += " bg-osode";
          }

          const bgColor = event?.color || "";

          const timeRange =
            event?.start_time && event?.end_time
              ? formatTimeRange(event.start_time, event.end_time)
              : null;

          return (
            <div
              key={index}
              className={cellClass}
              style={{ background: bgColor }}
              onClick={() => setSelectedDate(dateStr)}
            >
              <div className="calendar-day-number">{day}</div>

              {holidayName && (
                <div className="event preset-公休">
                  {holidayName.length > 6
                    ? holidayName.slice(0, 6) + "..."
                    : holidayName}
                </div>
              )}

              {timeRange && (
                <div className="event time-range">{timeRange}</div>
              )}

              {event?.preset && !timeRange && (
                <div className={`event preset-${event.preset}`}>
                  {event.preset}
                </div>
              )}

              {event?.note && (
                <div className="event-note">{event.note}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* 共通メモ */}
      <div className="common-memo-box">
        <h3>共通メモ</h3>
        <textarea
          className="common-memo-textarea"
          value={commonMemo}
          onChange={(e) => setCommonMemo(e.target.value)}
          rows={3}
        />
        <div className="memo-hint">※共通メモ欄は自動保存されます</div>
        <div className="version">v1.1.0</div>
      </div>

      {/* ▼ 設定モーダル */}
      {settingsOpen && (
        <div className="modal-bg" onClick={() => setSettingsOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <h3>設定</h3>

            <button
              className="settings-btn"
              onClick={() => {
                saveRegisterMode("timeRange");
                setSettingsOpen(false);
              }}
            >
              時間帯で登録する
            </button>

            <button
              className="settings-btn"
              onClick={() => {
                saveRegisterMode("preset");
                setSettingsOpen(false);
              }}
            >
              早出/遅出で登録する
            </button>

            <button className="delete-btn-top" onClick={handleLogout}>
              ログアウト
            </button>
          </div>
        </div>
      )}

      {/* ▼ シフト編集モーダル */}
      {selectedDate && (
        <Modal
          date={selectedDate}
          events={events}
          setEvents={setEvents}
          holidays={holidays}
          onClose={() => setSelectedDate(null)}
          mode={registerMode}
        />
      )}
    </div>
  );
}
