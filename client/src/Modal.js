import { useState } from "react";
import "./Modal.css";

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

  const save = () => {
    const newEvents = {
      ...events,
      [date]: {
        preset,
        note: text,
        color,
      },
    };

    fetch("https://calendar-app-8kqm.onrender.com/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newEvents),
    }).then(() => {
      setEvents(newEvents);
      onClose();
    });
  };

  const remove = () => {
    const newEvents = { ...events };
    delete newEvents[date];

    fetch("https://calendar-app-8kqm.onrender.com/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newEvents),
    }).then(() => {
      setEvents(newEvents);
      onClose();
    });
  };

  return (
    <div className="modal-bg">
      <div className="modal">
        <button className="close" onClick={onClose}>×</button>

        <h2>{date}</h2>

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
            className={preset ? "textarea-with-preset" : "textarea-no-preset"}
          />
        </div>

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

        <div className="modal-footer">
          <button className="save-btn" onClick={save}>登録</button>
          <button className="danger delete-btn" onClick={remove}>削除</button>
        </div>
      </div>
    </div>
  );
}

