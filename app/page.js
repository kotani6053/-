"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [reservations, setReservations] = useState([]); 
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 初期値は「会議室」。URLに ?room=xxx があればそちらを優先
  const [roomName, setRoomName] = useState("会議室"); 

  const deptPresets = ["新門司製造部", "新門司セラミック", "総務部", "役員", "その他"];
  const userPresets = ["役員", "部長", "次長", "課長", "係長", "主任", "その他"];
  const purposePresets = ["会議", "来客", "面談", "面接", "その他"];
  
  const [form, setForm] = useState({ dept: "", user: [], purpose: "", clientName: "", startTime: "08:00", endTime: "09:00" });

  // 1. URLパラメータの読み取り
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      setRoomName(roomParam);
    }
  }, []);

  // 2. 30秒ごとに現在時刻を更新（これにより自動で空室判定が走り直す）
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // 30秒ごとにチェック
    return () => clearInterval(timer);
  }, []);

  // 3. リアルタイム監視と判定
  useEffect(() => {
    const q = query(collection(db, "reservations"), where("room", "==", roomName));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = currentTime; // 常に最新の時刻を使用
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

      // 現在の時間で「使用中」の予約があるか探す
      const current = todayRes.find(res => res.startTime <= currentTimeStr && res.endTime >= currentTimeStr);

      if (current) {
        setData({ id: current.id, occupied: true, dept: current.department, user: current.name, purpose: current.purpose, clientName: current.clientName || "", startTime: current.startTime, endTime: current.endTime });
      } else {
        setData({ occupied: false });
      }
    });
    return () => unsubscribe();
  }, [roomName, currentTime]); // roomName か currentTime が変わるたびに再判定

  const toggleUser = (u) => {
    setForm(prev => {
      const currentUsers = prev.user;
      if (currentUsers.includes(u)) {
        return { ...prev, user: currentUsers.filter(item => item !== u) };
      } else {
        return { ...prev, user: [...currentUsers, u] };
      }
    });
  };

  const handleReserve = async () => {
    if (!form.dept || form.user.length === 0 || !form.purpose) return alert("項目をすべて選択してください");
    if (form.startTime >= form.endTime) return alert("終了時間は開始時間より後に設定してください");

    const isOverlapping = reservations.some(res => {
      return res.startTime < form.endTime && form.startTime < res.endTime;
    });

    if (isOverlapping) {
      alert(`⚠️エラー：この時間帯は既に予約が入っています。`);
      return;
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    try {
      await addDoc(collection(db, "reservations"), {
        room: roomName, 
        department: form.dept, 
        name: form.user.join("、"), 
        purpose: form.purpose, 
        clientName: form.clientName, 
        startTime: form.startTime, 
        endTime: form.endTime, 
        date: dateStr, 
        createdAt: new Date()
      });
      setIsEditing(false);
      setForm({ ...form, user: [], clientName: "" });
    } catch (e) { alert("予約に失敗しました"); }
  };

  const handleRelease = async () => {
    if (data.id && window.confirm(`${roomName}を空室に戻しますか？`)) {
      await deleteDoc(doc(db, "reservations", data.id));
    }
  };

  const timeOptions = [];
  for (let h = 8; h <= 18; h++) {
    timeOptions.push(`${h.toString().padStart(2, '0')}:00`);
    if (h !== 18) timeOptions.push(`${h.toString().padStart(2, '0')}:30`);
  }

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
        <div style={{ fontSize: "3vw", opacity: 0.8 }}>{roomName}</div>
        <div style={infoBoxStyle}>
          <div style={{ fontSize: "6vw", fontWeight: "bold" }}>{data.purpose}{data.clientName && `（${data.clientName}様）`}</div>
          <div style={{ fontSize: "4vw", margin: "10px 0" }}>{data.dept}：{data.user}</div>
          <div style={timeBadgeStyle}>{data.startTime} 〜 {data.endTime}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2vh", marginTop: "2vh" }}>
          <button onClick={handleRelease} style={finishBtnStyle}>今すぐ終了する</button>
          <button onClick={() => setIsEditing(true)} style={subBtnStyle}>予約状況を確認</button>
        </div>
        {isEditing && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <div style={sectionBox}>
                <div style={sectionLabel}>{roomName} 本日の予約状況</div>
                <div style={resListStyle}>
                  {reservations.length > 0 ? reservations.map(res => (
                    <div key={res.id} style={resCardStyle}><b>{res.startTime}-{res.endTime}</b><br/>{res.name}</div>
                  )) : <span style={{ color: "#999", padding: "10px", fontSize: "1.5vw" }}>本日の予定はありません</span>}
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: "auto" }}>
                <button onClick={() => setIsEditing(false)} style={{ ...actionBtnStyle, backgroundColor: "#666", width: "100%" }}>閉じる</button>
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
      <div style={{ fontSize: "20vw", fontWeight: "900" }}>空室</div>
      <div style={{ fontSize: "4vw", marginBottom: "4vh" }}>{roomName}</div>
      <button onClick={() => setIsEditing(true)} style={startBtnStyle}>予約状況 / 今すぐ利用</button>
      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={sectionBox}>
              <div style={sectionLabel}>{roomName} 本日の予約状況</div>
              <div style={resListStyle}>
                {reservations.length > 0 ? reservations.map(res => (
                  <div key={res.id} style={resCardStyle}><b>{res.startTime}-{res.endTime}</b><br/>{res.name}</div>
                )) : <span style={{ color: "#999", padding: "10px", fontSize: "1.5vw" }}>本日の予定はありません</span>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, overflowY: "auto", paddingRight: "5px" }}>
              <div style={sectionBox}>
                <div style={sectionLabel}>1. 利用部署</div>
                <div style={gridStyle}>
                  {deptPresets.map(d => <button key={d} onClick={() => setForm({...form, dept: d})} style={pBtnStyle(form.dept === d)}>{d}</button>)}
                </div>
              </div>
              <div style={sectionBox}>
                <div style={sectionLabel}>2. 利用者（役職/複数可）</div>
                <div style={gridStyle}>
                  {userPresets.map(u => (
                    <button key={u} onClick={() => toggleUser(u)} style={pBtnStyle(form.user.includes(u))}>{u}</button>
                  ))}
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
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ alignSelf: "center", fontSize: "3vw", fontWeight: "bold", color: "#333" }}>〜</span>
                  <select style={selectStyle} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}>
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "20px", paddingTop: "10px" }}>
              <button onClick={handleReserve} style={{ ...actionBtnStyle, backgroundColor: "#2B9348" }}>利用登録を確定する</button>
              <button onClick={() => setIsEditing(false)} style={{ ...actionBtnStyle, backgroundColor: "#666" }}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const screenStyle = { height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif", textAlign: "center", overflow: "hidden" };
const infoBoxStyle = { backgroundColor: "rgba(0,0,0,0.1)", padding: "40px", borderRadius: "30px", margin: "20px 0" };
const timeBadgeStyle = { display: "inline-block", backgroundColor: "white", color: "#D90429", padding: "10px 40px", borderRadius: "50px", fontSize: "4vw", fontWeight: "900" };
const finishBtnStyle = { width: "60vw", height: "12vh", backgroundColor: "white", color: "#D90429", fontSize: "5vw", fontWeight: "900", borderRadius: "25px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", cursor: "pointer" };
const subBtnStyle = { width: "60vw", height: "8vh", backgroundColor: "rgba(255,255,255,0.2)", color: "white", fontSize: "3.5vw", fontWeight: "900", borderRadius: "20px", border: "2px solid white", cursor: "pointer" };
const startBtnStyle = { padding: "3vh 10vw", fontSize: "6vw", borderRadius: "100px", border: "none", backgroundColor: "white", color: "#2B9348", fontWeight: "900", cursor: "pointer", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" };
const modalOverlayStyle = { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "#eee", padding: "25px", borderRadius: "30px", width: "95%", height: "95%", display: "flex", flexDirection: "column", gap: "10px" };
const sectionBox = { backgroundColor: "white", padding: "15px", borderRadius: "15px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" };
const sectionLabel = { fontSize: "1.8vw", fontWeight: "900", color: "#444", marginBottom: "12px", textAlign: "left", borderLeft: "8px solid #2B9348", paddingLeft: "15px" };
const resListStyle = { display: "flex", gap: "10px", overflowX: "auto" };
const resCardStyle = { backgroundColor: "#f0f2f5", color: "#1a1a1a", padding: "12px", borderRadius: "10px", fontSize: "1.6vw", minWidth: "160px", border: "1px solid #ccc", fontWeight: "bold" };
const gridStyle = { display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "flex-start" };
const pBtnStyle = (s) => ({ padding: "15px 10px", fontSize: "2.2vw", borderRadius: "12px", border: s ? "4px solid #1D3557" : "1px solid #bbb", backgroundColor: s ? "#1D3557" : "#fdfdfd", color: s ? "#ffffff" : "#1a1a1a", fontWeight: "900", flex: "1 1 18%", minWidth: "140px" });
const selectStyle = { padding: "12px 25px", fontSize: "2.5vw", borderRadius: "12px", border: "2px solid #ddd", fontWeight: "bold" };
const inputStyle = { width: "90%", padding: "15px", fontSize: "2.5vw", borderRadius: "12px", border: "3px solid #2B9348", marginTop: "10px", textAlign: "center", fontWeight: "bold" };
const actionBtnStyle = { flex: 1, padding: "20px", fontSize: "3.5vw", color: "white", border: "none", borderRadius: "20px", fontWeight: "900" };
