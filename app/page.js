"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, orderBy } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [reservations, setReservations] = useState([]); // 当日の全予約用
  const [isEditing, setIsEditing] = useState(false);
  const roomName = "3階応接室"; 

  const deptPresets = ["新門司製造部", "新門司セラミック", "総務部", "役員", "その他"];
  const userPresets = ["役員", "部長", "次長", "課長", "係長", "主任", "その他"];
  const purposePresets = ["会議", "来客", "面談", "面接", "その他"];

  const [form, setForm] = useState({ dept: "", user: "", purpose: "", clientName: "", startTime: "10:00", endTime: "11:00" });

  const timeOptions = [];
  for (let h = 7; h < 22; h++) {
    for (let m = 0; m < 60; m += 10) {
      timeOptions.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }

  useEffect(() => {
    const q = query(
      collection(db, "reservations"),
      where("room", "==", roomName),
      orderBy("startTime", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const currentDateStr = now.toLocaleDateString('sv-SE'); 
      const currentTimeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

      const allRes = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(res => res.date === currentDateStr); // 今日分だけに絞り込み

      setReservations(allRes);

      const current = allRes.find(res => {
        return res.startTime <= currentTimeStr && res.endTime >= currentTimeStr;
      });

      if (current) {
        setData({
          id: current.id,
          occupied: true,
          dept: current.department,
          user: current.name,
          purpose: current.purpose,
          clientName: current.clientName || "",
          startTime: current.startTime,
          endTime: current.endTime
        });
      } else {
        setData({ occupied: false });
      }
    });

    return () => unsubscribe();
  }, [roomName]);

  // その場ですぐ予約（Firebaseへの書き込み）
  const handleReserve = async () => {
    if (!form.dept || !form.user || !form.purpose) {
      alert("項目を選択してください");
      return;
    }

    try {
      await addDoc(collection(db, "reservations"), {
        room: roomName,
        department: form.dept,
        name: form.user,
        purpose: form.purpose,
        clientName: form.clientName,
        startTime: form.startTime,
        endTime: form.endTime,
        date: new Date().toLocaleDateString('sv-SE'),
        createdAt: new Date()
      });
      setIsEditing(false);
      setForm({ dept: "", user: "", purpose: "", clientName: "", startTime: "10:00", endTime: "11:00" });
    } catch (e) {
      alert("予約に失敗しました");
    }
  };

  const handleRelease = async () => {
    if (data.id && window.confirm("会議を終了して空室に戻しますか？")) {
      await deleteDoc(doc(db, "reservations", data.id));
    }
  };

  if (data.occupied) {
    return (
      <div style={{ backgroundColor: "#D90429", color: "white", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", textAlign: "center" }}>
        <div style={{ fontSize: "8vw", fontWeight: "900" }}>使用中</div>
        <div style={{ fontSize: "5vw", margin: "10px 0", lineHeight: "1.2" }}>
          <strong style={{ fontSize: "7vw" }}>{data.purpose}{data.clientName && `（${data.clientName}様）`}</strong><br />
          {data.dept}：{data.user}<br />
          <span style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "5px 30px", borderRadius: "50px", fontSize: "4vw" }}>
            {data.startTime} 〜 {data.endTime}
          </span>
        </div>
        <button onClick={handleRelease} style={bigBtn("#fff", "#D90429")}>会議終了</button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#2B9348", color: "white", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: "20vw", fontWeight: "900" }}>空室</div>
      <p style={{ fontSize: "4vw", marginBottom: "2vh" }}>{roomName}</p>
      <button onClick={() => setIsEditing(true)} style={bigBtn("#fff", "#2B9348")}>予約・状況確認</button>

      {isEditing && (
        <div style={modalStyle}>
          <div style={contentStyle}>
            {/* スケジュール表示部分 */}
            <div style={{ borderBottom: "2px solid #eee", paddingBottom: "10px", marginBottom: "10px" }}>
              <h3 style={{ color: "#333", margin: "0 0 10px 0" }}>本日の予約状況</h3>
              <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "5px" }}>
                {reservations.length > 0 ? reservations.map(res => (
                  <div key={res.id} style={timeCard}>
                    {res.startTime}-{res.endTime}<br/>{res.name.slice(0,4)}
                  </div>
                )) : <p style={{ color: "#999", fontSize: "1.5vw" }}>本日の予約はありません</p>}
              </div>
            </div>

            <h3 style={{ color: "#333", margin: "0" }}>その場で利用登録</h3>
            <div style={label}>1. 部署 / 2. 利用者 / 3. 目的</div>
            <div style={group}>{deptPresets.map(d => (<button key={d} onClick={() => setForm({...form, dept: d})} style={pBtn(form.dept === d)}>{d}</button>))}</div>
            <div style={group}>{userPresets.map(u => (<button key={u} onClick={() => setForm({...form, user: u})} style={pBtn(form.user === u)}>{u}</button>))}</div>
            <div style={group}>{purposePresets.map(p => (<button key={p} onClick={() => setForm({...form, purpose: p})} style={pBtn(form.purpose === p)}>{p}</button>))}</div>
            
            {form.purpose === "来客" && <input placeholder="来客社名" style={inputStyle} value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} />}

            <div style={label}>4. 利用時間</div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center" }}>
              <select style={selStyle} value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <span style={{ color: "#333" }}>〜</span>
              <select style={selStyle} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            
            <div style={{ display: "flex", gap: "20px", marginTop: "10px", justifyContent: "center" }}>
              <button onClick={handleReserve} style={actBtn("#2B9348")}>登録して使用開始</button>
              <button onClick={() => setIsEditing(false)} style={actBtn("#666")}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイル追加・修正
const modalStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 };
const contentStyle = { backgroundColor: "white", padding: "20px", borderRadius: "20px", width: "95%", maxWidth: "1000px", display: "flex", flexDirection: "column", gap: "8px" };
const timeCard = { backgroundColor: "#f0f0f0", color: "#333", padding: "8px 15px", borderRadius: "10px", fontSize: "1.2vw", minWidth: "100px", textAlign: "center", fontWeight: "bold", border: "1px solid #ddd" };
const bigBtn = (bg, col) => ({ marginTop: "3vh", width: "60vw", height: "12vh", backgroundColor: bg, color: col, fontSize: "6vw", fontWeight: "900", borderRadius: "30px", border: "none" });
const label = { color: "#666", fontSize: "1.2vw", fontWeight: "bold", textAlign: "center" };
const group = { display: "flex", flexWrap: "wrap", gap: "5px", justifyContent: "center" };
const pBtn = (s) => ({ padding: "8px 12px", fontSize: "1.4vw", borderRadius: "8px", border: "none", backgroundColor: s ? "#1D3557" : "#eee", color: s ? "#fff" : "#333", fontWeight: "bold" });
const actBtn = (bg) => ({ padding: "12px 30px", fontSize: "2vw", borderRadius: "12px", border: "none", backgroundColor: bg, color: "white", fontWeight: "bold" });
const selStyle = { padding: "8px", fontSize: "1.8vw", borderRadius: "8px" };
const inputStyle = { width: "50%", alignSelf: "center", padding: "8px", fontSize: "1.8vw", borderRadius: "8px", border: "2px solid #2B9348", textAlign: "center" };
