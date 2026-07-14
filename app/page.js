"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [reservations, setReservations] = useState([]); // PC側の正式予約
  const [tabletStatus, setTabletStatus] = useState(null); // タブレットの独自ステータス
  const [isEditing, setIsEditing] = useState(false);
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

    // 1. PC側の正式予約を監視
    const q1 = query(collection(db, "reservations"), where("selectedItem", "==", roomParam));
    const unsub1 = onSnapshot(q1, (snap) => setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    // 2. タブレット専用の状態を監視
    const q2 = query(collection(db, "tablet_status"), where("room", "==", roomParam));
    const unsub2 = onSnapshot(q2, (snap) => {
      const status = snap.docs.find(d => d.data().date === getJSTDateStr(new Date()));
      setTabletStatus(status ? { id: status.id, ...status.data() } : null);
    });

    return () => { unsub1(); unsub2(); };
  }, [roomName]);

  // 表示判定：PC側の正式予約があればそれを優先、なければタブレットの独自ステータスを表示
  useEffect(() => {
    const nowStr = getJSTTimeStr(currentTime);
    const dateStr = getJSTDateStr(currentTime);
    const official = reservations.find(r => r.date === dateStr && r.startTime <= nowStr && r.endTime >= nowStr);

    if (official) {
      setData({ occupied: true, ...official, type: 'official' });
    } else if (tabletStatus) {
      setData({ occupied: true, dept: tabletStatus.dept, user: tabletStatus.user, purpose: "今すぐ利用", startTime: tabletStatus.startTime, endTime: "18:00", type: 'tablet' });
    } else {
      setData({ occupied: false });
    }
  }, [reservations, tabletStatus, currentTime]);

  const handleStart = async () => {
    if (!form.dept || form.user.length === 0) return alert("入力してください");
    await addDoc(collection(db, "tablet_status"), {
      room: roomName, dept: form.dept, user: form.user.join("、"),
      startTime: getJSTTimeStr(new Date()), date: getJSTDateStr(new Date())
    });
    setIsEditing(false);
  };

  const handleFinish = async () => {
    if (tabletStatus && window.confirm("利用を終了しますか？")) {
      await deleteDoc(doc(db, "tablet_status", tabletStatus.id));
    }
  };

  return (
    <div style={{ ...screenStyle, backgroundColor: data.occupied ? "#D90429" : "#2B9348" }}>
      <div style={{ fontSize: data.occupied ? "14vw" : "24vw", fontWeight: "900" }}>{data.occupied ? "使用中" : "空室"}</div>
      {data.occupied ? (
        <>
          <div style={infoBoxStyle}>
            <div style={{ fontSize: "7vw" }}>{data.type === 'official' ? data.purpose : "今すぐ利用"}</div>
            <div style={{ fontSize: "4vw" }}>{data.dept} ({data.user})</div>
            <div style={timeBadgeStyle}>{data.startTime} 〜 {data.endTime}</div>
          </div>
          {data.type === 'tablet' && <button onClick={handleFinish} style={finishBtnStyle}>利用終了</button>}
        </>
      ) : (
        <button onClick={() => setIsEditing(true)} style={startBtnStyle}>今すぐ利用開始</button>
      )}
      {/* 予約状況閲覧エリア（デザイン維持） */}
      <div style={{ marginTop: "5vh", width: "80vw" }}>
        <div style={{ fontSize: "3vw", color: "white", marginBottom: "2vh" }}>本日の予定</div>
        <div style={{ display: "flex", gap: "1vw", overflowX: "auto" }}>
          {reservations.filter(r => r.date === getJSTDateStr(new Date())).map(r => (
            <div key={r.id} style={resCardStyle}><b>{r.startTime}</b><br/>{r.purpose}</div>
          ))}
        </div>
      </div>
      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={sectionLabel}>利用部署</div>
            <div style={gridStyle}>{deptPresets.map(d => <button key={d} onClick={() => setForm({...form, dept: d})} style={pBtnStyle(form.dept === d)}>{d}</button>)}</div>
            <div style={sectionLabel}>利用者</div>
            <div style={gridStyle}>{userPresets.map(u => <button key={u} onClick={() => { const n = form.user.includes(u) ? form.user.filter(x=>x!==u) : [...form.user, u]; setForm({...form, user: n}) }} style={pBtnStyle(form.user.includes(u))}>{u}</button>)}</div>
            <button onClick={handleStart} style={actionBtnStyle}>開始する</button>
            <button onClick={() => setIsEditing(false)} style={{...actionBtnStyle, backgroundColor:"#666"}}>戻る</button>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイルは元のコードのまま維持しています
const screenStyle = { height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center", overflow: "hidden", fontFamily: "sans-serif" };
const infoBoxStyle = { backgroundColor: "rgba(0,0,0,0.15)", padding: "4vh 5vw", borderRadius: "40px", width: "85vw", marginBottom: "3vh" };
const timeBadgeStyle = { display: "block", backgroundColor: "white", color: "#D90429", padding: "1vh", borderRadius: "60px", fontSize: "6vw", fontWeight: "900", marginTop: "2vh" };
const finishBtnStyle = { width: "70vw", height: "12vh", backgroundColor: "white", color: "#D90429", fontSize: "6vw", fontWeight: "900", borderRadius: "30px", border: "none", cursor: "pointer" };
const startBtnStyle = { padding: "4vh 12vw", fontSize: "7vw", borderRadius: "120px", border: "none", backgroundColor: "white", color: "#2B9348", fontWeight: "900", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "#f0f0f0", padding: "3vh", borderRadius: "30px", width: "90vw", display: "flex", flexDirection: "column", gap: "2vh" };
const sectionLabel = { fontSize: "3vw", fontWeight: "900", textAlign: "left" };
const gridStyle = { display: "flex", flexWrap: "wrap", gap: "1vw" };
const pBtnStyle = (s) => ({ padding: "2vh", fontSize: "3vw", borderRadius: "10px", border: "none", backgroundColor: s ? "#1D3557" : "#ddd", color: s ? "#fff" : "#333" });
const actionBtnStyle = { padding: "3vh", fontSize: "4vw", color: "white", border: "none", borderRadius: "15px", fontWeight: "900" };
const resCardStyle = { padding: "1.5vh", borderRadius: "10px", backgroundColor: "white", color: "#333", minWidth: "20vw", fontSize: "1.5vw" };
