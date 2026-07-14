"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [reservations, setReservations] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [roomName, setRoomName] = useState("会議室①");
  const [editingId, setEditingId] = useState(null);

  const getJSTDateStr = (date) => {
    const jstNow = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    return jstNow.toISOString().split('T')[0];
  };

  const getJSTTimeStr = (date) => {
    const jstNow = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    return jstNow.toISOString().split('T')[1].substring(0, 5);
  };

  const deptPresets = ["新門司製造部", "新門司セラミック", "総務部", "役員", "その他"];
  const userPresets = ["会長", "社長", "専務", "常務", "執行役員", "部長", "次長", "課長", "係長", "主任", "その他"];
  const purposePresets = ["会議", "来客", "面談", "面接", "その他"];

  const [form, setForm] = useState({ dept: "", user: [], purpose: "会議", clientName: "", guestCount: "1" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) setRoomName(roomParam);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "reservations"), where("selectedItem", "==", roomName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReservations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [roomName]);

  useEffect(() => {
    const currentDateStr = getJSTDateStr(currentTime);
    const currentTimeStr = getJSTTimeStr(currentTime);
    const current = reservations.find(res => res.date === currentDateStr && res.startTime <= currentTimeStr && res.endTime >= currentTimeStr);

    if (current) {
      setData({ id: current.id, occupied: true, dept: current.department, user: current.name, purpose: current.purpose, clientName: current.extraInfo, guestCount: current.guestCount, startTime: current.startTime, endTime: current.endTime });
    } else {
      setData({ occupied: false });
    }
  }, [reservations, currentTime]);

  const handleFinishNow = async () => {
    if (data.id && window.confirm("利用を終了しますか？")) {
      try { await deleteDoc(doc(db, "reservations", data.id)); } catch (e) { alert("失敗しました"); }
    }
  };

  const handleReserve = async () => {
    if (!form.dept || form.user.length === 0) return alert("部署と利用者を選択してください");

    const now = new Date();
    const reservationData = {
      selectedItem: roomName,
      room: roomName,
      department: form.dept,
      dept: form.dept,
      name: form.user.join("、"),
      user: form.user.join("、"),
      purpose: form.purpose,
      extraInfo: form.clientName,
      clientName: form.clientName,
      guestCount: form.guestCount,
      startTime: getJSTTimeStr(now),
      endTime: "18:00", // 今すぐ利用は18時までとする
      date: getJSTDateStr(now),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "reservations"), reservationData);
      closeModal();
    } catch (e) { alert("保存に失敗しました"); }
  };

  const closeModal = () => { setIsEditing(false); setForm({ dept: "", user: [], purpose: "会議", clientName: "", guestCount: "1" }); };

  return (
    <div style={{ ...screenStyle, backgroundColor: data.occupied ? "#D90429" : "#2B9348" }}>
      <div style={{ position: "absolute", top: "2.5vh", right: "4vw", fontSize: "4vw", fontWeight: "bold", color: "white" }}>{getJSTTimeStr(currentTime)}</div>
      <div style={{ fontSize: data.occupied ? "14vw" : "24vw", fontWeight: "900" }}>{data.occupied ? "使用中" : "空室"}</div>
      {data.occupied ? (
        <>
          <div style={infoBoxStyle}>
            <div style={{ fontSize: "7vw", fontWeight: "900" }}>{data.purpose} ({data.guestCount}名)</div>
            {data.clientName && <div style={{ fontSize: "5vw", color: "#FFD166" }}>{data.clientName} 様</div>}
            <div style={{ fontSize: "4vw", marginTop: "2vh" }}>{data.dept} ({data.user})</div>
            <div style={timeBadgeStyle}>{data.startTime} 〜 {data.endTime}</div>
          </div>
          <button onClick={handleFinishNow} style={finishBtnStyle}>利用終了</button>
        </>
      ) : (
        <button onClick={() => setIsEditing(true)} style={startBtnStyle}>今すぐ利用開始</button>
      )}

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={sectionBox}><div style={sectionLabel}>1. 利用部署</div><div style={gridStyle}>{deptPresets.map(d => <button key={d} onClick={() => setForm({...form, dept: d})} style={pBtnStyle(form.dept === d)}>{d}</button>)}</div></div>
            <div style={sectionBox}><div style={sectionLabel}>2. 利用者</div><div style={gridStyle}>{userPresets.map(u => <button key={u} onClick={() => { const next = form.user.includes(u) ? form.user.filter(x => x !== u) : [...form.user, u]; setForm({...form, user: next}) }} style={pBtnStyle(form.user.includes(u))}>{u}</button>)}</div></div>
            <div style={{display:"flex", gap:"2vw"}}>
              <button onClick={handleReserve} style={{...actionBtnStyle, backgroundColor:"#2B9348"}}>開始する</button>
              <button onClick={closeModal} style={{...actionBtnStyle, backgroundColor:"#666"}}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const screenStyle = { height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center", overflow: "hidden", fontFamily: "sans-serif" };
const infoBoxStyle = { backgroundColor: "rgba(0,0,0,0.15)", padding: "4vh 5vw", borderRadius: "40px", width: "85vw", marginBottom: "3vh" };
const timeBadgeStyle = { display: "block", backgroundColor: "white", color: "#D90429", padding: "1vh", borderRadius: "60px", fontSize: "6vw", fontWeight: "900", marginTop: "2vh" };
const finishBtnStyle = { width: "70vw", height: "12vh", backgroundColor: "white", color: "#D90429", fontSize: "6vw", fontWeight: "900", borderRadius: "30px", border: "none", cursor: "pointer" };
const startBtnStyle = { padding: "4vh 12vw", fontSize: "7vw", borderRadius: "120px", border: "none", backgroundColor: "white", color: "#2B9348", fontWeight: "900", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "#f0f0f0", padding: "3vh", borderRadius: "30px", width: "90vw", display: "flex", flexDirection: "column", gap: "2vh" };
const sectionBox = { backgroundColor: "white", padding: "2vh", borderRadius: "15px" };
const sectionLabel = { fontSize: "3vw", fontWeight: "900", textAlign: "left", marginBottom: "1vh" };
const gridStyle = { display: "flex", flexWrap: "wrap", gap: "1vw" };
const pBtnStyle = (s) => ({ padding: "2vh", fontSize: "3vw", borderRadius: "10px", border: "none", backgroundColor: s ? "#1D3557" : "#ddd", color: s ? "#fff" : "#333" });
const actionBtnStyle = { flex: 1, padding: "3vh", fontSize: "4vw", color: "white", border: "none", borderRadius: "15px", fontWeight: "900" };
