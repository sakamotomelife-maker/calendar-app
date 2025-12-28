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
  const [memoSaved, setMemoSaved] = useState(false);

  const weekdays = ["月", "火", "水", "木", "金", "土", "日"];
  const days = getCalendarDays(year, month);

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

  function changeMonth(offset) {
    let newMonth = month + offset;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setMonth(newMonth);
    setYear(newYear);
  }

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
        };
      });

      setEvents(obj);
    };
    loadEvents();
  }, []);

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

  const saveCommonMemo = async () => {
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
        .eq("user_id", user.id);
    } else {
      await supabase.from("common_memo").insert({
        user_id: user.id,
        memo: commonMemo,
      });
    }

    setMemoSaved(true);
    setTimeout(() => setMemoSaved(false), 1500);
  };

  const deleteCommonMemo = async () => {
    const session = (await supabase.auth.getSession()).data.session;
    const user = session?.user;
    if (!user) return;

    await supabase.from("common_memo").delete().eq("user_id", user.id);
    setCommonMemo("");
  };

  useEffect(() => {
    fetch("https://holidays-jp.github.io/api/v1/date.json")
      .then((res) => res.json())
      .then((data) => setHolidays(data))
      .catch(() => setHolidays({}));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <div className="calendar-top-bar">
        <span className="user-email">{userEmail}</span>
        <button className="logout-btn
