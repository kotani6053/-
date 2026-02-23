"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [reservations, setReservations] = useState([]); 
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [roomName, setRoomName] = useState("会議室"); 

  // --- ヘルパー関数: 常に正確な「日本時間の今日」を YYYY-MM-DD で返す ---
  const getJstDateStr = (date) => {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
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
      // 修正: 確実に日本時間の今日を取得
      const currentDateStr = getJstDateStr(currentTime);
      const currentTimeStr = currentTime.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Tokyo' 
      });

      const allRes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const todayRes = allRes.filter(res => res.date === currentDateStr);

      // 古い予約の削除
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
          id: current.id, 
          occupied: true, 
          dept: current.department, 
          user: current.name, 
          purpose: current.purpose, 
          clientName: current.clientName || "", 
          guestCount: current.guestCount || "1",
          startTime: current.startTime, 
          endTime: current.endTime 
        });
      } else {
        setData({ occupied: false });
      }
    });
    return () => unsubscribe();
  }, [roomName, currentTime]);

  const toggleUser = (u) => {
    setForm(prev => {
      const currentUsers = prev.user;
      if (currentUsers.includes(u)) return { ...prev, user: currentUsers.filter(item => item !== u) };
      return { ...prev, user: [...currentUsers, u] };
    });
  };

  const handleReserve = async () => {
    if (!form.dept || form.user.length === 0 || !form.purpose) return alert("項目をすべて選択してください");
    if (form.startTime >= form.endTime) return alert("終了時間は開始時間より後に設定してください");
    
    const isOverlapping = reservations.some(res => res.startTime < form.endTime && form.startTime < res.endTime);
    if (isOverlapping) return alert("⚠️エラー：この時間帯は既に予約が入っています。");

    // 保存時も確実に日本時間の今日を使用
    const dateStr = getJstDateStr(new Date());
    
    try {
      await addDoc(collection(db, "reservations"), {
        room: roomName, 
        department: form.dept, 
        name: form.user.join("、"), 
        purpose: form.purpose, 
        clientName: form.clientName, 
        guestCount: form.guestCount,
        startTime: form.startTime, 
        endTime: form.endTime, 
        date: dateStr, 
        createdAt: new Date()
      });
      setIsEditing(false);
      setForm({ ...form, user: [], clientName: "", guestCount: "1" });
    } catch (e) { alert("予約に失敗しました"); }
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
      {currentTime.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Tokyo' 
      })}
    </div>
  );

  const renderInputForm = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh", flex: 1, overflowY: "auto" }}>
      <div style={sectionBox}>
        <div style={sectionLabel}>1. 利用部署</div>
        <div style={gridStyle}>
          {deptPresets.map(d => <button key={d} onClick={() => setForm({...form, dept: d})} style={pBtnStyle(form.dept === d)}>{d}</button>)}
        </div>
      </div>
      <div style={sectionBox}>
        <div style={sectionLabel}>2. 利用者（役職）</div>
        <div style={gridStyle}>
          {userPresets.map(u => (
            <button key={u} onClick={() => toggleUser(u)} style={pBtnStyle(form.user.includes(u))}>{u}</button>
          ))}
        </div>
      </div>
      <div style={sectionBox}>
        <div style={sectionLabel}>3. 利用目的 & 4. 参加人数</div>
        <div style={{ display: "flex", gap: "2vw", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 2 }}>
            <div style={gridStyle}>
              {purposePresets.map(p => <button key={p} onClick={() => setForm({...form, purpose: p})} style={pBtnStyle(form.purpose === p)}>{p}</button>)}
            </div>
          </div>
          <div style={{ flex: 1, backgroundColor: "#f9f9f9", padding: "1.5vh", borderRadius: "15px", border: "1px solid #ddd" }}>
            <div style={{ fontSize: "1.8vw", fontWeight: "bold", marginBottom: "1vh", color: "#666" }}>人数</div>
            <select 
              style={{ ...selectStyle, width: "100%" }} 
              value={form.guestCount} 
              onChange={e => setForm({...form, guestCount: e.target.value})}
            >
              {[...Array(9)].map((_, i) => <option key={i+1} value={i+1}>{i+1}名</option>)}
              <option value="10+">10名以上</option>
            </select>
          </div>
        </div>
        {form.purpose === "来客" && (
          <input 
            key="input-client-name"
            placeholder="来客社名を入力" 
            style={inputStyle} 
            value={form.clientName} 
            onChange={e => setForm({...form, clientName: e.target.value})} 
          />
        )}
      </div>
      <div style={sectionBox}>
        <div style={sectionLabel}>5. 利用時間</div>
        <div style={{ display: "flex", justifyContent: "center", gap: "3vw", padding: "1vh" }}>
          <select style={selectStyle} value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}>
            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{ alignSelf: "center", fontSize: "4vw", fontWeight: "bold", color: "#333" }}>〜</span>
          <select style={selectStyle} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}>
            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  const renderReservationsList = () => (
    <div style={sectionBox}>
      <div style={sectionLabel}>{roomName} 本日の予約状況</div>
      <div style={resListStyle}>
        {reservations.length > 0 ? reservations.map(res => (
          <div key={res.id} style={resCardStyle}>
            <div style={{ fontSize: "1.8vw", color: "#D90429", borderBottom: "1px solid #ddd", marginBottom: "0.5vh", paddingBottom: "0.5vh" }}>
              <b>{res.startTime}-{res.endTime}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "2.2vw", fontWeight: "900", color: "#333" }}>{res.purpose}</div>
              <div style={{ fontSize: "1.8vw", backgroundColor: "#eee", padding: "2px 8px", borderRadius: "10px", color: "#666" }}>{res.guestCount}名</div>
            </div>
            {res.clientName && <div style={{ fontSize: "1.8vw", color: "#666", marginTop: "0.5vh" }}>{res.clientName} 様</div>}
            <div style={{ fontSize: "1.8vw", color: "#444", marginTop: "0.5vh", borderTop: "1px dashed #eee", paddingTop: "0.5vh" }}>{res.name}</div>
          </div>
        )) : <span style={{ color: "#999", padding: "10px", fontSize: "2vw" }}>本日の予定はありません</span>}
      </div>
    </div>
  );

  if (data.occupied) {
    return (
      <div style={{ ...screenStyle, backgroundColor: "#D90429" }}>
        <Clock />
        <div style={{ fontSize: "14vw", fontWeight: "900", lineHeight: "1.1", marginBottom: "1vh" }}>使用中</div>
        <div style={{ fontSize: "4vw", opacity: 0.9, fontWeight: "bold", marginBottom: "2vh" }}>【{roomName}】</div>
        
        <div style={infoBoxStyle}>
          <div style={{ fontSize: "8vw", fontWeight: "900", color: "#fff", marginBottom: "2vh" }}>
            {data.purpose} <span style={{fontSize: "4vw", verticalAlign: "middle", opacity: 0.8}}>( {data.guestCount}名 )</span>
            {data.clientName && <div style={{ fontSize: "6vw", color: "#FFD166" }}>{data.clientName} 様</div>}
          </div>
          <div style={{ fontSize: "5vw", fontWeight: "bold", marginBottom: "3vh", borderTop: "2px solid rgba(255,255,255,0.3)", paddingTop: "2vh" }}>
            {data.dept} <span style={{fontSize: "3.5vw", opacity: 0.8}}>（{data.user}）</span>
          </div>
          <div style={timeBadgeStyle}>{data.startTime} <span style={{fontSize: "4vw"}}>〜</span> {data.endTime}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5vh", marginTop: "3vh" }}>
          <button onClick={handleRelease} style={finishBtnStyle}>利用終了</button>
          <button onClick={() => setIsEditing(true)} style={subBtnStyle}>予約状況 / 新規予約</button>
        </div>

        {isEditing && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              {renderReservationsList()}
              {renderInputForm()}
              <div style={{ display: "flex", gap: "2vw", paddingTop: "1vh" }}>
                <button onClick={handleReserve} style={{ ...actionBtnStyle, backgroundColor: "#2B9348" }}>登録確定</button>
                <button onClick={() => setIsEditing(false)} style={{ ...actionBtnStyle, backgroundColor: "#666" }}>戻る</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...screenStyle, backgroundColor: "#2B9348" }}>
      <Clock />
      <div style={{ fontSize: "24vw", fontWeight: "900", lineHeight: "1" }}>空室</div>
      <div style={{ fontSize: "5vw", fontWeight: "bold", marginTop: "2vh", marginBottom: "6vh" }}>{roomName}</div>
      <button onClick={() => setIsEditing(true)} style={startBtnStyle}>予約 / 今すぐ利用</button>
      
      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {renderReservationsList()}
            {renderInputForm()}
            <div style={{ display: "flex", gap: "2vw", paddingTop: "1vh" }}>
              <button onClick={handleReserve} style={{ ...actionBtnStyle, backgroundColor: "#2B9348" }}>登録確定</button>
              <button onClick={() => setIsEditing(false)} style={{ ...actionBtnStyle, backgroundColor: "#666" }}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイル定義
const screenStyle = { height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif", textAlign: "center", overflow: "hidden" };
const infoBoxStyle = { backgroundColor: "rgba(0,0,0,0.15)", padding: "4vh 5vw", borderRadius: "40px", width: "85vw" };
const timeBadgeStyle = { display: "inline-block", backgroundColor: "white", color: "#D90429", padding: "1.5vh 6vw", borderRadius: "60px", fontSize: "7vw", fontWeight: "900", boxShadow: "0 10px 20px rgba(0,0,0,0.2)" };
const finishBtnStyle = { width: "70vw", height: "14vh", backgroundColor: "white", color: "#D90429", fontSize: "6vw", fontWeight: "900", borderRadius: "30px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", cursor: "pointer" };
const subBtnStyle = { width: "70vw", height: "8vh", backgroundColor: "rgba(255,255,255,0.2)", color: "white", fontSize: "4vw", fontWeight: "900", borderRadius: "20px", border: "2px solid white", cursor: "pointer" };
const startBtnStyle = { padding: "4vh 12vw", fontSize: "7vw", borderRadius: "120px", border: "none", backgroundColor: "white", color: "#2B9348", fontWeight: "900", cursor: "pointer", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" };
const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.95)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "#f0f0f0", padding: "3vh", borderRadius: "40px", width: "96vw", height: "96vh", display: "flex", flexDirection: "column", gap: "1.5vh" };
const sectionBox = { backgroundColor: "white", padding: "2vh", borderRadius: "20px" };
const sectionLabel = { fontSize: "2.5vw", fontWeight: "900", color: "#444", marginBottom: "1.5vh", textAlign: "left", borderLeft: "10px solid #2B9348", paddingLeft: "2vw" };
const resListStyle = { display: "flex", gap: "1.5vw", overflowX: "auto", paddingBottom: "1vh" };
const resCardStyle = { backgroundColor: "#f8f9fa", color: "#1a1a1a", padding: "2vh", borderRadius: "15px", minWidth: "25vw", border: "1px solid #ddd", textAlign: "left", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" };
const gridStyle = { display: "flex", flexWrap: "wrap", gap: "1.2vw", justifyContent: "flex-start" };
const pBtnStyle = (s) => ({ padding: "2.5vh 1.5vw", fontSize: "2.8vw", borderRadius: "15px", border: s ? "5px solid #1D3557" : "1px solid #bbb", backgroundColor: s ? "#1D3557" : "#fff", color: s ? "#fff" : "#1a1a1a", fontWeight: "900", flex: "1 1 18%", minWidth: "16vw" });
const selectStyle = { padding: "2vh 3vw", fontSize: "3.2vw", borderRadius: "15px", border: "3px solid #ddd", fontWeight: "bold", backgroundColor: "white" };
const inputStyle = { width: "95%", padding: "2.5vh", fontSize: "3.5vw", borderRadius: "15px", border: "4px solid #2B9348", marginTop: "1.5vh", textAlign: "center", fontWeight: "bold" };
const actionBtnStyle = { flex: 1, padding: "3vh", fontSize: "4.5vw", color: "white", border: "none", borderRadius: "25px", fontWeight: "900" };
