"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc } from "firebase/firestore";

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    if (!form.dept || !form.user || !form.purpose) return alert("項目をすべて選択してください");
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

  const Clock = () => (
    <div style={{ position: "absolute", top: "20px", right: "30px", fontSize: "3vw", fontWeight: "bold", color: "rgba(255,255,255,0.9)" }}>
      {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
    </div>
  );

  if (data.occupied) {
    return (
      <div style={{ ...screenStyle, backgroundColor: "#D90429" }}>
        <Clock />
        <div style={{ fontSize: "10vw", fontWeight: "900" }}>使用中</div>
        <div style={infoBoxStyle}>
          <div style={{ fontSize: "6vw", fontWeight: "bold" }}>{data.purpose}{data.clientName && `（${data.clientName}様）`}</div>
          <div style={{ fontSize: "4vw", margin: "10px 0" }}>{data.dept}：{data.user}</div>
          <div style={timeBadgeStyle}>{data.startTime} 〜 {data.endTime}</div>
        </div>
        <button onClick={handleRelease} style={finishBtnStyle}>会議を終了する</button>
      </div>
    );
  }

  return (
    <div style={{ ...screenStyle, backgroundColor: "#2B9348" }}>
      <Clock />
      <div style={{ fontSize: "20vw", fontWeight: "900" }}>空室</div>
      <div style={{ fontSize: "4vw", marginBottom: "4vh" }}>{roomName}</div>
      <button onClick={() => setIsEditing(true)} style={startBtnStyle}>予約状況 / 今すぐ利用</button>

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {/* 上段：スケジュール確認 */}
            <div style={sectionBox}>
              <div style={sectionLabel}>本日の予約状況</div>
              <div style={resListStyle}>
                {reservations.length > 0 ? reservations.map(res => (
                  <div key={res.id} style={resCardStyle}><b>{res.startTime}-{res.endTime}</b><br/>{res.name}</div>
                )) : <span style={{ color: "#999", padding: "10px" }}>本日の予定はありません</span>}
              </div>
            </div>

            {/* 中段：入力フォーム（セクション分け） */}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", flex: 1, overflowY: "auto" }}>
              <div style={sectionBox}>
                <div style={sectionLabel}>1. 利用部署</div>
                <div style={gridStyle}>
                  {deptPresets.map(d => <button key={d} onClick={() => setForm({...form, dept: d})} style={pBtnStyle(form.dept === d)}>{d}</button>)}
                </div>
              </div>

              <div style={sectionBox}>
                <div style={sectionLabel}>2. 利用者（役職）</div>
                <div style={gridStyle}>
                  {userPresets.map(u => <button key={u} onClick={() => setForm({...form, user: u})} style={pBtnStyle(form.user === u)}>{u}</button>)}
                </div>
              </div>

              <div style={sectionBox}>
                <div style={sectionLabel}>3. 利用目的</div>
                <div style={gridStyle}>
                  {purposePresets.map(p => <button key={p} onClick={() => setForm({...form, purpose: p})} style={pBtnStyle(form.purpose === p)}>{p}</button>)}
                </div>
                {form.purpose === "来客" && (
                  <input placeholder="来客社名を入力" style={inputStyle} value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} />
                )}
              </div>

              <div style={sectionBox}>
                <div style={sectionLabel}>4. 利用時間</div>
                <div style={{ display: "flex", justifyContent: "center", gap: "20px", padding: "10px" }}>
                  <select style={selectStyle} value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}>
                    {Array.from({length: 24*6}, (_, i) => {
                      const h = Math.floor(i/6).toString().padStart(2,'0');
                      const m = (i%6*10).toString().padStart(2,'0');
                      return <option key={i} value={`${h}:${m}`}>{h}:{m}</option>;
                    })}
                  </select>
                  <span style={{ alignSelf: "center", fontSize: "2vw", fontWeight: "bold", color: "#333" }}>〜</span>
                  <select style={selectStyle} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}>
                    {Array.from({length: 24*6}, (_, i) => {
                      const h = Math.floor(i/6).toString().padStart(2,'0');
                      const m = (i%6*10).toString().padStart(2,'0');
                      return <option key={i} value={`${h}:${m}`}>{h}:{m}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "20px", paddingTop: "10px" }}>
              <button onClick={handleReserve} style={{ ...actionBtnStyle, backgroundColor: "#2B9348" }}>利用登録</button>
              <button onClick={() => setIsEditing(false)} style={{ ...actionBtnStyle, backgroundColor: "#666" }}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- スタイル定義 ---
const screenStyle = { height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "sans-serif", textAlign: "center" };
const infoBoxStyle = { backgroundColor: "rgba(0,0,0,0.1)", padding: "40px", borderRadius: "30px", margin: "20px 0" };
const timeBadgeStyle = { display: "inline-block", backgroundColor: "white", color: "#D90429", padding: "10px 40px", borderRadius: "50px", fontSize: "4vw", fontWeight: "900" };
const finishBtnStyle = { width: "60vw", height: "15vh", backgroundColor: "white", color: "#D90429", fontSize: "6vw", fontWeight: "900", borderRadius: "30px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" };
const startBtnStyle = { padding: "3vh 10vw", fontSize: "6vw", borderRadius: "100px", border: "none", backgroundColor: "white", color: "#2B9348", fontWeight: "900" };

const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "#eee", padding: "20px", borderRadius: "30px", width: "95%", height: "95%", display: "flex", flexDirection: "column", gap: "10px" };

const sectionBox = { backgroundColor: "white", padding: "15px", borderRadius: "15px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" };
const sectionLabel = { fontSize: "1.5vw", fontWeight: "bold", color: "#666", marginBottom: "10px", textAlign: "left", borderLeft: "5px solid #2B9348", paddingLeft: "10px" };

const resListStyle = { display: "flex", gap: "10px", overflowX: "auto" };
const resCardStyle = { backgroundColor: "#f8f9fa", color: "#333", padding: "10px", borderRadius: "10px", fontSize: "1.4vw", minWidth: "150px", border: "1px solid #ddd" };

const gridStyle = { display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-start" };
const pBtnStyle = (s) => ({ padding: "12px 18px", fontSize: "1.6vw", borderRadius: "10px", border: "none", backgroundColor: s ? "#1D3557" : "#e0e0e0", color: s ? "white" : "#333", fontWeight: "bold", flex: "1 1 18%", minWidth: "120px" });

const selectStyle = { padding: "10px 20px", fontSize: "2vw", borderRadius: "10px", border: "2px solid #ddd" };
const inputStyle = { width: "90%", padding: "10px", fontSize: "2vw", borderRadius: "10px", border: "2px solid #2B9348", marginTop: "10px", textAlign: "center" };
const actionBtnStyle = { flex: 1, padding: "20px", fontSize: "3vw", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold" };
