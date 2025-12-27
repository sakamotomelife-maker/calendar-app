import { useState, useEffect } from "react";
import Modal from "./Modal";
import "./Calendar.css";

export default function Calendar({ userEmail, onLogout }) {
  // 今日の年月を初期値にする
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0 = 1月

  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [holidays, setHolidays] = useState({});

  // 共通メモ
  const [commonMemo, setCommonMemo] = useState("");

  // 月曜始まりの曜日
  const weekdays = ["月", "火", "水", "木", "金", "土", "日"];

  // カレンダーの日付を生成（月曜開始）
  function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0).getDate();

    // JSは日曜=0 → 月曜=1 に変換
    let start = firstDay.getDay();
    start = start === 0 ? 6 : start - 1;

    const days = [];

    // 空白セル
    for (let i = 0; i < start; i++) {
      days.push(null);
    }

    // 日付
    for (let d = 1; d <= lastDate; d++) {
      days.push(d);
    }

    return days;
  }

  const days = getCalendarDays(year, month);

  // 前月・次月へ移動
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

  // 初回ロード時にサーバーから予定取得（認証必須）
  useEffect(() => {
    fetch("https://calendar-app-8kqm.onrender.com/events", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setEvents(data));
  }, []);

  // 共通メモ取得
  useEffect(() => {
    fetch("https://calendar-app-8kqm.onrender.com/common-memo", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setCommonMemo(data.memo || ""));
  }, []);

  const saveCommonMemo = () => {
    fetch("https://calendar-app-8kqm.onrender.com/common-memo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ memo: commonMemo }),
    });
  };

  const deleteCommonMemo = () => {
    setCommonMemo("");
    fetch("https://calendar-app-8kqm.onrender.com/common-memo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ memo: "" }),
    });
  };

  // 祝日を取得
  useEffect(() => {
    fetch("https://holidays-jp.github.io/api/v1/date.json")
      .then((res) => res.json())
      .then((data) => setHolidays(data))
      .catch(() => setHolidays({}));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {/* 右上：ユーザー名＋ログアウト */}
      <div className="calendar-top-bar">
        <span className="user-email">{userEmail}</span>
        <button className="logout-btn" onClick={onLogout}>ログアウト</button>
      </div>

      {/* 年月ヘッダー */}
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

      {/* 曜日行 */}
      <div className="weekday-row">
        {weekdays.map((w) => (
          <div key={w} className="weekday-cell">
            {w}
          </div>
        ))}
      </div>

      {/* カレンダー本体 */}
      <div className="calendar">
        {days.map((day, index) => {
          const weekdayIndex = index % 7;

          if (day === null) {
            let emptyClass = "cell empty";
            if (weekdayIndex === 5) emptyClass += " saturday";
            if (weekdayIndex === 6) emptyClass += " sunday";
            return <div key={index} className={emptyClass}></div>;
          }

          const dateStr = `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;

          const event = events[dateStr];
          const holidayName = holidays[dateStr];

          let cellClass = "cell";
          if (weekdayIndex === 5) cellClass += " saturday";
          if (weekdayIndex === 6) cellClass += " sunday";

          const bgColor = event?.color || "";

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
                    ? holidayName.slice(0, 6) + "…"
                    : holidayName}
                </div>
              )}

              {event?.preset && (
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

      {/* 共通メモ欄 */}
      <div className="common-memo-box">
        <h3>共通メモ</h3>
        <textarea
          className="common-memo-textarea"
          value={commonMemo}
          onChange={(e) => setCommonMemo(e.target.value)}
          rows={3}
        />
        <div className="common-memo-buttons">
          <button onClick={saveCommonMemo}>保存</button>
          <button className="danger" onClick={deleteCommonMemo}>削除</button>
        </div>
      </div>

      {/* モーダル */}
      {selectedDate && (
        <Modal
          date={selectedDate}
          events={events}
          setEvents={setEvents}
          holidays={holidays}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

