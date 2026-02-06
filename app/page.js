"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, orderBy } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [reservations, setReservations] = useState([]); 
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const roomName = "3階応接室"; 

  // プリセット項目
  const deptPresets = ["新門司製造部", "新門司セラミック", "総務部", "役員", "その他"];
  const userPresets = ["役員", "部長", "次長", "課長", "係長", "主任", "その他"];
  const purposePresets = ["会議", "来客", "面談", "面接", "その他"];
  
  const [form, setForm] = useState({ dept: "", user: "", purpose: "", clientName: "", startTime: "09:00", endTime: "10:00" });

  // 時刻更新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Firebase監視
  useEffect(() => {
    const q = query(collection(db, "reservations"), where("room", "==", roomName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const y = now.getFullYear();
      const m = (now.getMonth() + 1).toString().padStart(2, '0');
      const d = now.getDate().toString().padStart(2, '0');
      const currentDateStr = `${y}-${m}-${d}`;
      const currentTimeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

      const allRes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const todayRes = allRes
        .filter(res => res.date === currentDateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      setReservations(todayRes);

      const current = todayRes.find(res => res.startTime <= currentTimeStr && res.endTime >= currentTimeStr);

      if (current) {
        setData({ id: current.id, occupied: true, dept: current.department, user: current.name, purpose: current.purpose, clientName: current.clientName || "", startTime: current.startTime, endTime: current.endTime });
      } else {
        setData({ occupied: false });
      }
    });
    return () => unsubscribe();
  }, [roomName]);

  const handleReserve = async () => {
    if (!form.dept || !form.user || !form.purpose) return alert("未入力の項目があります");
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    try {
      await addDoc(collection(db, "reservations"), {
        room: roomName, department: form.dept, name: form.user, purpose: form.purpose, clientName: form.clientName, startTime: form.startTime, endTime: form.endTime, date: dateStr, createdAt: new Date()
      });
      setIsEditing(false);
    } catch (e) { alert("予約失敗"); }
  };

  const handleRelease = async () => {
    if (data.id && window.confirm("会議を終了し、空室に戻しますか？")) {
      await deleteDoc(doc(db, "reservations", data.id));
    }
  };

  // 共通UI
  const Clock = () => (
    <div style={{ position: "absolute", top: "20px", right: "30px", fontSize: "3vw", fontWeight: "bold", color: "rgba(255,255,255,0.8)" }}>
      {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
    </div>
  );

  // --- メイン画面（使用中） ---
  if (data.occupied) {
    return (
      <div style={{ ...screenStyle, backgroundColor: "#E63946" }}>
        <Clock />
        <div style={{ fontSize: "10vw", fontWeight: "900", letterSpacing: "10px" }}>使用中</div>
        <div style={infoBoxStyle}>
          <div style={{ fontSize: "6vw", fontWeight: "bold" }}>{data.purpose}{data.clientName && `（${data.clientName}様）`}</div>
          <div style={{ fontSize: "4vw", margin: "10px 0" }}>{data.dept}：{data.user}</div>
          <div style={timeBadgeStyle}>{data.startTime} 〜 {data.endTime}</div>
        </div>
        <button onClick={handleRelease} style={finishBtnStyle}>会議を終了する</button>
      </div>
    );
  }

  // --- メイン画面（空室） ---
  return (
    <div style={{ ...screenStyle, backgroundColor: "#2D6A4F" }}>
      <Clock />
      <div style={{ fontSize: "20vw", fontWeight: "900", letterSpacing: "15px" }}>空室</div>
      <div style={{ fontSize: "4vw", marginBottom: "4vh", opacity: 0.9 }}>{roomName} は現在予約されていません</div>
      <button onClick={() => setIsEditing(true)} style={startBtnStyle}>今すぐ利用 / 予約確認</button>

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={scheduleSection}>
              <h4 style={{ margin: "0 0 10px 0", color: "#1b4332" }}>本日の予定</h4>
              <div style={resListStyle}>
                {reservations.length > 0 ? reservations.map(res => (
                  <div key={res.id} style={resCardStyle}><b>{res.startTime}-{res.endTime}</b><br/>{res.name}</div>
                )) : <span style={{ color: "#999" }}>本日の予定はありません</span>}
              </div>
            </div>

            <div style={formSection}>
              <h4 style={{ margin: "5px 0", color: "#1b4332" }}>利用登録</h4>
              <div style={gridStyle}>
                {deptPresets.map(d => <button key={d} onClick={() => setForm({...form, dept: d})} style={pBtnStyle(form.dept === d)}>{d}</button>)}
              </div>
              <div style={gridStyle}>
                {userPresets.map(u => <button key={u} onClick={() => setForm({...form, user: u})} style={pBtnStyle(form.user === u)}>{u}</button>)}
              </div>
              <div style={gridStyle}>
                {purposePresets.map(p => <button key={p} onClick={() => setForm({...form, purpose: p})} style={pBtnStyle(form.purpose === p)}>{p}</button>)}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "10px" }}>
                <select style={selectStyle} value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}>
                  {Array.from({length: 24*6}, (_, i) => {
                    const h = Math.floor(i/6).toString().padStart(2,'0');
                    const m = (i%6*10).toString().padStart(2,'0');
                    return <option key={i} value={`${h}:${m}`}>{h}:{m}</option>;
                  })}
                </select>
                <span style={{ alignSelf: "center", color: "#333", fontWeight: "bold" }}>〜</span>
                <select style={selectStyle} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}>
                  {/* 同様に生成 */}
                  {Array.from({length: 24*6}, (_, i) => {
                    const h = Math.floor(i/6).toString().padStart(2,'0');
                    const m = (i%6*10).toString().padStart(2,'0');
                    return <option key={i} value={`${h}:${m}`}>{h}:{m}</option>;
                  })}
                </select>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "20px", marginTop: "auto" }}>
              <button onClick={handleReserve} style={{ ...actionBtnStyle, backgroundColor: "#2D6A4F" }}>登録</button>
              <button onClick={() => setIsEditing(false)} style={{ ...actionBtnStyle, backgroundColor: "#666" }}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- スタイル定義（使い勝手重視） ---
const screenStyle = { height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Helvetica Neue', Arial, sans-serif", transition: "background-color 0.5s ease" };
const infoBoxStyle = { backgroundColor: "rgba(0,0,0,0.15)", padding: "30px 60px", borderRadius: "30px", margin: "20px 0", textAlign: "center", border: "1px solid rgba(255,255,255,0.2)" };
const timeBadgeStyle = { display: "inline-block", backgroundColor: "white", color: "#E63946", padding: "10px 40px", borderRadius: "50px", fontSize: "4vw", fontWeight: "900", marginTop: "20px" };
const finishBtnStyle = { width: "50vw", height: "12vh", backgroundColor: "white", color: "#E63946", fontSize: "5vw", fontWeight: "900", borderRadius: "20px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", cursor: "pointer", marginTop: "2vh" };
const startBtnStyle = { padding: "3vh 8vw", fontSize: "5vw", borderRadius: "100px", border: "none", backgroundColor: "white", color: "#2D6A4F", fontWeight: "900", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", cursor: "pointer" };

const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" };
const modalContentStyle = { backgroundColor: "#F8F9FA", padding: "30px", borderRadius: "30px", width: "95%", height: "90%", maxWidth: "1100px", display: "flex", flexDirection: "column", gap: "15px" };
const scheduleSection = { backgroundColor: "white", padding: "15px", borderRadius: "15px", border: "1px solid #dee2e6" };
const resListStyle = { display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px" };
const resCardStyle = { backgroundColor: "#e9ecef", color: "#495057", padding: "10px 20px", borderRadius: "10px", fontSize: "1.5vw", minWidth: "140px", textAlign: "center", borderLeft: "5px solid #2D6A4F" };
const formSection = { flex: 1, display: "flex", flexDirection: "column", gap: "10px" };
const gridStyle = { display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" };
const pBtnStyle = (s) => ({ padding: "12px 20px", fontSize: "1.8vw", borderRadius: "12px", border: s ? "3px solid #1D3557" : "1px solid #ccc", backgroundColor: s ? "#1D3557" : "white", color: s ? "white" : "#333", fontWeight: "bold", cursor: "pointer", flex: "1 1 18%" });
const selectStyle = { padding: "15px", fontSize: "2vw", borderRadius: "12px", border: "2px solid #ddd", backgroundColor: "white" };
const actionBtnStyle = { flex: 1, padding: "20px", fontSize: "2.5vw", color: "white", border: "none", borderRadius: "15px", fontWeight: "bold", cursor: "pointer" };
