"use client";
import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, query, where, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from "firebase/firestore";

// --- Firebase 設定 ---
const firebaseConfig = {
  apiKey: "AIzaSyD-PNODScbGy7MMK3pZ6kmcljILm9BN6PU",
  authDomain: "kotaniapp-4f017.firebaseapp.com",
  projectId: "kotaniapp-4f017",
  storageBucket: "kotaniapp-4f017.firebasestorage.app",
  messagingSenderId: "623409374889",
  appId: "1:623409374889:web:1931dc594ed5d4fd23abb8"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [reservations, setReservations] = useState([]); 
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [roomName, setRoomName] = useState("会議室"); 
  
  // ★ 編集中の予約IDを管理
  const [editingId, setEditingId] = useState(null);

  const getJSTDateStr = (date) => {
    const jstNow = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    const y = jstNow.getUTCFullYear();
    const m = String(jstNow.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jstNow.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getJSTTimeStr = (date) => {
    const jstNow = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    const h = String(jstNow.getUTCHours()).padStart(2, '0');
    const min = String(jstNow.getUTCMinutes()).padStart(2, '0');
    return `${h}:${min}`;
  };

  const deptPresets = ["新門司製造部", "新門司セラミック", "総務部", "役員", "その他"];
  const userPresets = ["社長", "専務", "常務", "取締役", "部長", "次長", "課長", "係長", "主任", "その他"];
  const purposePresets = ["会議", "来客", "面談", "面接", "その他"];
  
  const [form, setForm] = useState({ dept: "", user: [], purpose: "", clientName: "", guestCount: "1", startTime: "08:00", endTime: "09:00" });

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
    const q = query(collection(db, "reservations"), where("room", "==", roomName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentDateStr = getJSTDateStr(currentTime);
      const currentTimeStr = getJSTTimeStr(currentTime);
      const allRes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const todayRes = allRes.filter(res => res.date === currentDateStr);

      todayRes.forEach(async (res) => {
        if (res.endTime < currentTimeStr) {
          try { await deleteDoc(doc(db, "reservations", res.id)); } catch (e) { console.error(e); }
        }
      });

      const activeRes = todayRes
        .filter(res => res.endTime >= currentTimeStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      setReservations(activeRes);
      const current = activeRes.find(res => res.startTime <= currentTimeStr && res.endTime >= currentTimeStr);

      if (current) {
        setData({ 
          id: current.id, occupied: true, dept: current.department, user: current.name, 
          purpose: current.purpose, clientName: current.clientName || "", 
          guestCount: current.guestCount || "1", startTime: current.startTime, endTime: current.endTime 
        });
      } else {
        setData({ occupied: false });
      }
    });
    return () => unsubscribe();
  }, [roomName, currentTime]);

  // ★ 編集を開始する関数
  const startEdit = (res) => {
    setEditingId(res.id);
    setForm({
      dept: res.department,
      user: res.name.split("、"),
      purpose: res.purpose,
      clientName: res.clientName || "",
      guestCount: res.guestCount || "1",
      startTime: res.startTime,
      endTime: res.endTime
    });
  };

  const handleReserve = async () => {
    if (!form.dept || form.user.length === 0 || !form.purpose) return alert("項目をすべて選択してください");
    if (form.startTime >= form.endTime) return alert("終了時間は開始時間より後に設定してください");
    
    // 重複チェック（自分自身は除く）
    const isOverlapping = reservations.some(res => 
      res.id !== editingId && res.startTime < form.endTime && form.startTime < res.endTime
    );
    if (isOverlapping) return alert("⚠️エラー：この時間帯は既に予約が入っています。");

    const dateStr = getJSTDateStr(new Date());
    const reservationData = {
      room: roomName, 
      department: form.dept, 
      name: form.user.join("、"), 
      purpose: form.purpose, 
      clientName: form.clientName, 
      guestCount: form.guestCount,
      startTime: form.startTime, 
      endTime: form.endTime, 
      date: dateStr, 
    };
    
    try {
      if (editingId) {
        // ★ 更新処理
        await updateDoc(doc(db, "reservations", editingId), reservationData);
      } else {
        // 新規追加
        await addDoc(collection(db, "reservations"), { ...reservationData, createdAt: new Date() });
      }
      setIsEditing(false);
      setEditingId(null);
      setForm({ dept: "", user: [], clientName: "", guestCount: "1", purpose: "", startTime: "08:00", endTime: "09:00" });
    } catch (e) { alert("保存に失敗しました"); }
  };

  const handleRelease = async () => {
    if (data.id && window.confirm(`${roomName}を空室に戻しますか？`)) await deleteDoc(doc(db, "reservations", data.id));
  };

  const timeOptions = [];
  for (let h = 8; h <= 18; h++) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:00`);
    if (h !== 18) timeOptions.push(`${h.toString().padStart(2, '0')}:30`);
  }

  const Clock = () => (
    <div style={{ position: "absolute", top: "2.5vh", right: "4vw", fontSize: "4vw", fontWeight: "bold", color: "rgba(255,255,255,0.9)" }}>
      {getJSTTimeStr(currentTime)}
    </div>
  );

  const renderInputForm = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh", flex: 1, overflowY: "auto" }}>
      <div style={{...sectionLabel, color: "#D90429", fontSize: "3vw", borderLeft: "8px solid #D90429"}}>
        {editingId ? "【編集モード】予約内容を修正中" : "新規予約入力"}
      </div>
      <div style={sectionBox}><div style={sectionLabel}>1. 利用部署</div><div style={gridStyle}>{deptPresets.map(d => <button key={d} onClick={() => setForm({...form, dept: d})} style={pBtnStyle(form.dept === d)}>{d}</button>)}</div></div>
      <div style={sectionBox}><div style={sectionLabel}>2. 利用者</div><div style={gridStyle}>{userPresets.map(u => <button key={u} onClick={() => { const current = form.user; const next = current.includes(u) ? current.filter(x => x !== u) : [...current, u]; setForm({...form, user: next}) }} style={pBtnStyle(form.user.includes(u))}>{u}</button>)}</div></div>
      <div style={sectionBox}><div style={sectionLabel}>3. 目的 & 4. 人数</div><div style={{display:"flex", gap:"2vw"}}><div style={gridStyle}>{purposePresets.map(p => <button key={p} onClick={() => setForm({...form, purpose: p})} style={pBtnStyle(form.purpose === p)}>{p}</button>)}</div><select style={selectStyle} value={form.guestCount} onChange={e => setForm({...form, guestCount: e.target.value})}>{[...Array(9)].map((_, i) => <option key={i+1} value={i+1}>{i+1}名</option>)}</select></div>
      {form.purpose === "来客" && <input placeholder="社名を入力" style={inputStyle} value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} />}</div>
      <div style={sectionBox}><div style={sectionLabel}>5. 時間</div><div style={{display:"flex", justifyContent:"center", gap:"3vw"}}><select style={selectStyle} value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select><span>〜</span><select style={selectStyle} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></div></div>
    </div>
  );

  const renderReservationsList = () => (
    <div style={sectionBox}>
      <div style={sectionLabel}>{roomName} 今日の予約（タップで編集）</div>
      <div style={resListStyle}>
        {reservations.length > 0 ? reservations.map(res => (
          <div key={res.id} onClick={() => startEdit(res)} style={{...resCardStyle, border: editingId === res.id ? "4px solid #D90429" : "none", backgroundColor: editingId === res.id ? "#fff" : "#eee"}}>
            <b>{res.startTime}-{res.endTime}</b><br/>{res.purpose} ({res.guestCount}名)<br/><small>{res.name}</small>
            {editingId === res.id && <div style={{color: "#D90429", fontWeight: "bold", fontSize: "1vw"}}>選択中</div>}
          </div>
        )) : <span style={{color:"#999"}}>予約なし</span>}
      </div>
    </div>
  );

  return (
    <div style={{ ...screenStyle, backgroundColor: data.occupied ? "#D90429" : "#2B9348" }}>
      <Clock />
      <div style={{ fontSize: data.occupied ? "14vw" : "24vw", fontWeight: "900" }}>{data.occupied ? "使用中" : "空室"}</div>
      
      {data.occupied ? (
        <div style={infoBoxStyle}>
          <div style={{ fontSize: "7vw", fontWeight: "900" }}>{data.purpose} ({data.guestCount}名)</div>
          {data.clientName && <div style={{ fontSize: "5vw", color: "#FFD166" }}>{data.clientName} 様</div>}
          <div style={{ fontSize: "4vw", marginTop: "2vh" }}>{data.dept} ({data.user})</div>
          <div style={timeBadgeStyle}>{data.startTime} 〜 {data.endTime}</div>
        </div>
      ) : (
        <div style={{ fontSize: "5vw", marginBottom: "6vh" }}>{roomName}</div>
      )}

      <button onClick={() => { setIsEditing(true); setEditingId(null); }} style={data.occupied ? finishBtnStyle : startBtnStyle}>
        {data.occupied ? "利用終了" : "予約 / 今すぐ利用"}
      </button>
      
      {data.occupied && (
        <button onClick={() => setIsEditing(true)} style={subBtnStyle}>予約状況 / 新規予約</button>
      )}

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {renderReservationsList()}
            {renderInputForm()}
            <div style={{display:"flex", gap:"2vw"}}>
              <button onClick={handleReserve} style={{...actionBtnStyle, backgroundColor:"#2B9348"}}>
                {editingId ? "更新して保存" : "確定"}
              </button>
              <button onClick={() => { setIsEditing(false); setEditingId(null); }} style={{...actionBtnStyle, backgroundColor:"#666"}}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- スタイル定義（変更なし） ---
const screenStyle = { height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center", overflow: "hidden", fontFamily: "sans-serif" };
const infoBoxStyle = { backgroundColor: "rgba(0,0,0,0.15)", padding: "4vh 5vw", borderRadius: "40px", width: "85vw", marginBottom: "3vh" };
const timeBadgeStyle = { display: "block", backgroundColor: "white", color: "#D90429", padding: "1vh", borderRadius: "60px", fontSize: "6vw", fontWeight: "900", marginTop: "2vh" };
const finishBtnStyle = { width: "70vw", height: "12vh", backgroundColor: "white", color: "#D90429", fontSize: "6vw", fontWeight: "900", borderRadius: "30px", border: "none", marginBottom: "2vh", cursor: "pointer" };
const subBtnStyle = { width: "70vw", height: "7vh", backgroundColor: "rgba(255,255,255,0.2)", color: "white", borderRadius: "20px", border: "2px solid white", cursor: "pointer" };
const startBtnStyle = { padding: "4vh 12vw", fontSize: "7vw", borderRadius: "120px", border: "none", backgroundColor: "white", color: "#2B9348", fontWeight: "900", cursor: "pointer" };
const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.95)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "#f0f0f0", padding: "3vh", borderRadius: "30px", width: "95vw", height: "95vh", display: "flex", flexDirection: "column", gap: "1.5vh", color: "#333" };
const sectionBox = { backgroundColor: "white", padding: "1.5vh", borderRadius: "15px" };
const sectionLabel = { fontSize: "2vw", fontWeight: "900", textAlign: "left", borderLeft: "5px solid #2B9348", paddingLeft: "1vw", marginBottom: "1vh" };
const resListStyle = { display: "flex", gap: "1vw", overflowX: "auto", paddingBottom: "1vh" };
const resCardStyle = { padding: "1.5vh", borderRadius: "10px", minWidth: "20vw", fontSize: "1.5vw", textAlign: "left", cursor: "pointer", transition: "all 0.2s" };
const gridStyle = { display: "flex", flexWrap: "wrap", gap: "1vw" };
const pBtnStyle = (s) => ({ padding: "1.5vh 2vw", fontSize: "2vw", borderRadius: "10px", border: "none", backgroundColor: s ? "#1D3557" : "#ddd", color: s ? "#fff" : "#333", cursor: "pointer" });
const selectStyle = { padding: "1vh", fontSize: "2vw", borderRadius: "10px" };
const inputStyle = { width: "100%", padding: "1.5vh", fontSize: "2.5vw", borderRadius: "10px", border: "2px solid #2B9348", marginTop: "1vh" };
const actionBtnStyle = { flex: 1, padding: "2vh", fontSize: "3vw", color: "white", border: "none", borderRadius: "15px", fontWeight: "900", cursor: "pointer" };
