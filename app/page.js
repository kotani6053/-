"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, setDoc } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [reservations, setReservations] = useState([]);
  const [tabletStatus, setTabletStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false); // 終了中フラグ
  const [showSchedule, setShowSchedule] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [roomName, setRoomName] = useState("会議室①");

  const getJSTDateStr = (date) => new Date(date.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const getJSTTimeStr = (date) => new Date(date.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[1].substring(0, 5);

  const deptPresets = ["新門司製造部", "新門司セラミック", "総務部", "役員", "その他"];
  const userPresets = ["会長", "社長", "専務", "常務", "執行役員", "部長", "次長", "課長", "係長", "主任", "その他"];
  const [form, setForm] = useState({ dept: "", user: [] });

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
  }, [roomName]);

  useEffect(() => {
    if (isFinishing) return; // 終了処理中は判定をスキップ
    const nowStr = getJSTTimeStr(currentTime);
    const dateStr = getJSTDateStr(currentTime);
    const official = reservations.find(r => r.date === dateStr && r.startTime <= nowStr && r.endTime >= nowStr);
    if (official) {
      setData({ occupied: true, id: official.id, dept: official.department || official.dept, user: official.name || official.user, purpose: official.purpose, clientName: official.clientName, type: 'official' });
    } else if (tabletStatus) {
      setData({ occupied: true, dept: tabletStatus.dept, user: tabletStatus.user, purpose: "今すぐ利用", type: 'tablet' });
    } else {
      setData({ occupied: false });
    }
  }, [reservations, tabletStatus, currentTime, isFinishing]);

  const handleStart = async () => {
    if (!form.dept || form.user.length === 0) return;
    await addDoc(collection(db, "tablet_status"), { room: roomName, dept: form.dept, user: form.user.join("、"), date: getJSTDateStr(new Date()) });
    setIsEditing(false);
    setForm({ dept: "", user: [] });
  };

  const handleFinish = async () => {
    if(!window.confirm("利用を終了しますか？")) return;
    setIsFinishing(true);
    setData({ occupied: false });
    if (data.type === 'official') {
      await setDoc(doc(db, "reservations", data.id), { endTime: getJSTTimeStr(new Date()) }, { merge: true });
    } else if (tabletStatus) {
      await deleteDoc(doc(db, "tablet_status", tabletStatus.id));
    }
    setTimeout(() => setIsFinishing(false), 3000); // 3秒間は判定を止める
  };

  const isFormValid = form.dept !== "" && form.user.length > 0;

  return (
    <div style={{ ...screenStyle, backgroundColor: data.occupied ? "#D90429" : "#2B9348" }}>
      <div style={{ fontSize: data.occupied ? "14vw" : "24vw", fontWeight: "900" }}>{data.occupied ? "使用中" : "空室"}</div>
      {data.occupied ? (
        <div style={infoBoxStyle}>
          <div style={{ fontSize: "7vw" }}>{data.purpose}</div>
          {data.clientName && <div style={{ fontSize: "6vw", marginTop: "2vh" }}>{data.clientName} 様</div>}
          <div style={{ fontSize: "5vw", marginTop: "2vh" }}>{data.dept} {data.user}</div>
          <button onClick={handleFinish} style={finishBtnStyle}>利用終了</button>
        </div>
      ) : (
        <button onClick={() => setIsEditing(true)} style={startBtnStyle}>今すぐ利用開始</button>
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
      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={sectionLabel}>利用部署</div>
            <div style={gridStyle}>{deptPresets.map(d => <button key={d} onClick={() => setForm({...form, dept: d})} style={pBtnStyle(form.dept === d)}>{d}</button>)}</div>
            <div style={sectionLabel}>利用者</div>
            <div style={gridStyle}>{userPresets.map(u => <button key={u} onClick={() => { const n = form.user.includes(u) ? form.user.filter(x=>x!==u) : [...form.user, u]; setForm({...form, user: n}) }} style={pBtnStyle(form.user.includes(u))}>{u}</button>)}</div>
            <button onClick={handleStart} style={{...actionBtnStyle, backgroundColor: isFormValid ? "#2B9348" : "#ccc"}}>開始する</button>
            <button onClick={() => setIsEditing(false)} style={{...actionBtnStyle, backgroundColor:"#888"}}>戻る</button>
          </div>
        </div>
      )}
    </div>
  );
}

const screenStyle = { height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center", fontFamily: "sans-serif" };
const infoBoxStyle = { backgroundColor: "rgba(0,0,0,0.15)", padding: "4vh 5vw", borderRadius: "40px", width: "85vw" };
const finishBtnStyle = { width: "60vw", height: "10vh", backgroundColor: "white", color: "#D90429", fontSize: "5vw", fontWeight: "900", borderRadius: "30px", border: "none", marginTop: "4vh", cursor: "pointer" };
const startBtnStyle = { padding: "4vh 10vw", fontSize: "6vw", borderRadius: "100px", border: "none", backgroundColor: "white", color: "#2B9348", fontWeight: "900", cursor: "pointer" };
const scheduleBtnStyle = { marginTop: "5vh", padding: "2vh 6vw", fontSize: "4vw", borderRadius: "50px", border: "2px solid white", backgroundColor: "transparent", color: "white", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "#fff", padding: "4vh", borderRadius: "30px", width: "85vw", display: "flex", flexDirection: "column", gap: "2.5vh", color: "#333" };
const sectionLabel = { fontSize: "4vw", fontWeight: "900", textAlign: "left", color: "#222" };
const gridStyle = { display: "flex", flexWrap: "wrap", gap: "1.5vw" };
const pBtnStyle = (s) => ({ padding: "2vh 3vw", fontSize: "3.5vw", borderRadius: "12px", border: "none", backgroundColor: s ? "#2B9348" : "#eee", color: s ? "#fff" : "#333", cursor: "pointer" });
const actionBtnStyle = { padding: "2.5vh", fontSize: "4vw", color: "white", border: "none", borderRadius: "15px", fontWeight: "900", cursor: "pointer" };
