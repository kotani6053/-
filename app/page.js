"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [reservations, setReservations] = useState([]);
  const [tabletStatus, setTabletStatus] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [roomName, setRoomName] = useState("会議室①");

  const getJSTDateStr = (date) => new Date(date.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const getJSTTimeStr = (date) => new Date(date.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[1].substring(0, 5);

  useEffect(() => {
    const roomParam = new URLSearchParams(window.location.search).get("room") || "会議室①";
    setRoomName(roomParam);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const q1 = query(collection(db, "reservations"), where("selectedItem", "==", roomParam));
    const unsub1 = onSnapshot(q1, (snap) => setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const q2 = query(collection(db, "tablet_status"), where("room", "==", roomParam));
    const unsub2 = onSnapshot(q2, (snap) => {
      const status = snap.docs.find(d => d.data().date === getJSTDateStr(new Date()));
      setTabletStatus(status ? { id: status.id, ...status.data() } : null);
    });
    return () => { clearInterval(timer); unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    const nowStr = getJSTTimeStr(currentTime);
    const dateStr = getJSTDateStr(currentTime);
    const official = reservations.find(r => !r.isFinished && r.date === dateStr && r.startTime <= nowStr && r.endTime >= nowStr);

    if (official) {
      setData({ occupied: true, dept: official.department || official.dept, user: official.name || official.user, purpose: official.purpose, clientName: official.clientName });
    } else if (tabletStatus) {
      setData({ occupied: true, dept: tabletStatus.dept, user: tabletStatus.user, purpose: "今すぐ利用" });
    } else {
      setData({ occupied: false });
    }
  }, [reservations, tabletStatus, currentTime]);

  return (
    <div style={screenStyle}>
      {/* 部屋名を一番上に固定表示 */}
      <div style={{ fontSize: "6vw", marginBottom: "2vh", fontWeight: "bold", opacity: 0.9 }}>{roomName}</div>
      
      <div style={{ fontSize: data.occupied ? "14vw" : "24vw", fontWeight: "900" }}>{data.occupied ? "使用中" : "空室"}</div>
      
      {data.occupied && (
        <div style={infoBoxStyle}>
          <div style={{ fontSize: "7vw" }}>{data.purpose}</div>
          {data.clientName && <div style={{ fontSize: "6vw", marginTop: "2vh" }}>{data.clientName} 様</div>}
          <div style={{ fontSize: "5vw", marginTop: "2vh" }}>{data.dept} {data.user}</div>
        </div>
      )}

      <button onClick={() => setShowSchedule(true)} style={scheduleBtnStyle}>本日の予定を確認</button>

      {showSchedule && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, height: "70vh", overflowY: "auto"}}>
            <div style={sectionLabel}>本日の予約一覧</div>
            {reservations.filter(r => r.date === getJSTDateStr(new Date())).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(r => (
              <div key={r.id} style={{ padding: "1.5vh 0", borderBottom: "1px solid #eee", fontSize: "4vw" }}>
                <div><strong>{r.startTime} - {r.endTime}</strong></div>
                <div>{r.name} ({r.department}) - {r.purpose} {r.clientName ? `${r.clientName} 様` : ""}</div>
              </div>
            ))}
            <button onClick={() => setShowSchedule(false)} style={{...actionBtnStyle, backgroundColor:"#888", marginTop: "2vh"}}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

const screenStyle = { height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center", fontFamily: "sans-serif", backgroundColor: "#2B9348" };
// 状態による背景色変更は style内で直接指定するか、この値を動的に切り替えてください
// 今回は上記screenStyleで標準を空室カラーにしています
// 実装上は style={{...screenStyle, backgroundColor: data.occupied ? "#D90429" : "#2B9348"}} としてください

const infoBoxStyle = { backgroundColor: "rgba(0,0,0,0.15)", padding: "4vh 5vw", borderRadius: "40px", width: "85vw" };
const scheduleBtnStyle = { marginTop: "5vh", padding: "2vh 6vw", fontSize: "4vw", borderRadius: "50px", border: "2px solid white", backgroundColor: "transparent", color: "white", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "#fff", padding: "4vh", borderRadius: "30px", width: "85vw", display: "flex", flexDirection: "column", gap: "2.5vh", color: "#333" };
const sectionLabel = { fontSize: "4vw", fontWeight: "900", textAlign: "left", color: "#222" };
const actionBtnStyle = { padding: "2.5vh", fontSize: "4vw", color: "white", border: "none", borderRadius: "15px", fontWeight: "900", cursor: "pointer" };
