"use client";
import { useState, useEffect } from "react";

export default function TabletDisplay() {
  const [data, setData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ user: "", purpose: "", startTime: "10:00", endTime: "11:00" });

  const userPresets = ["新門司製造部", "新門司セラミック", "総務部", "役員", "その他"];
  const purposePresets = ["会議", "来客", "面談", "面接", "その他"];

  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 10) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  // --- ここが修正ポイント：キャッシュを破壊して取得する ---
  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/room?t=${new Date().getTime()}`, { 
        method: 'GET',
        cache: 'no-store', // キャッシュを使わない
        headers: { 'Cache-Control': 'no-cache' }
      });
      const json = await res.json();
      setData(json);
    } catch (e) { 
      console.error("Fetch Error:", e); 
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000); // 2秒おきにチェック
    return () => clearInterval(interval);
  }, []);

  const handleReserve = async () => {
    if (!form.user || !form.purpose) {
      alert("利用者と目的を選択してください");
      return;
    }
    const res = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setIsEditing(false);
      fetchStatus(); // 送信直後に再取得
    }
  };

  const handleRelease = async () => {
    const res = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release" }),
    });
    if (res.ok) {
      fetchStatus(); // 送信直後に再取得
    }
  };

  if (!data) return <div style={{background:"#000", height:"100vh", color:"white", display:"flex", alignItems:"center", justifyContent:"center"}}>読み込み中...</div>;

  const isOccupied = data.occupied;

  return (
    <div style={containerStyle(isOccupied)}>
      <h1 style={{ fontSize: "20vw", margin: 0, fontWeight: "900" }}>
        {isOccupied ? "使用中" : "空室"}
      </h1>

      <div style={{ fontSize: "5vw", fontWeight: "bold" }}>
        {isOccupied ? (
          <div>
            <p style={{ margin: "5px 0", fontSize: "7vw" }}>{data.purpose}</p>
            <p style={{ margin: 0 }}>{data.user}</p>
            <p style={timeLabelStyle}>{data.startTime} 〜 {data.endTime}</p>
          </div>
        ) : (
          <p style={{ opacity: 0.8 }}>予約はありません</p>
        )}
      </div>

      <div style={{ marginTop: "5vh" }}>
        {isOccupied ? (
          <button onClick={handleRelease} style={buttonStyle("#fff", "#D90429")}>会議終了</button>
        ) : (
          <button onClick={() => setIsEditing(true)} style={buttonStyle("#fff", "#2B9348")}>今から使う</button>
        )}
      </div>

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{color:"#333", fontSize:"3vw", marginBottom: "10px"}}>利用登録</h2>
            <div style={labelStyle}>利用者（部署名）</div>
            <div style={presetGroupStyle}>
              {userPresets.map(u => (
                <button key={u} onClick={() => setForm({...form, user: u})} style={presetButtonStyle(form.user === u)}>{u}</button>
              ))}
            </div>
            <div style={labelStyle}>利用目的</div>
            <div style={presetGroupStyle}>
              {purposePresets.map(p => (
                <button key={p} onClick={() => setForm({...form, purpose: p})} style={presetButtonStyle(form.purpose === p)}>{p}</button>
              ))}
            </div>
            <div style={labelStyle}>利用時間</div>
            <div style={{display:"flex", alignItems:"center", gap:"15px", justifyContent:"center"}}>
              <select style={selectStyle} value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}>
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span style={{color:"#333", fontSize:"3vw"}}>〜</span>
              <select style={selectStyle} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}>
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{display:"flex", gap:"15px", marginTop:"30px", justifyContent: "center"}}>
              <button onClick={handleReserve} style={buttonStyle("#2B9348", "#fff", "3vw")}>登録する</button>
              <button onClick={() => setIsEditing(false)} style={buttonStyle("#666", "#fff", "3vw")}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイル（変更なし）
const containerStyle = (occupied) => ({ backgroundColor: occupied ? "#D90429" : "#2B9348", color: "white", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontFamily: "sans-serif", textAlign: "center", position: "relative", overflow: "hidden" });
const timeLabelStyle = { margin: "10px 0", backgroundColor: "rgba(0,0,0,0.2)", padding: "10px 40px", borderRadius: "50px", display: "inline-block" };
const labelStyle = { color: "#555", fontSize: "1.8vw", textAlign: "left", width: "90%", margin: "10px auto 5px", fontWeight: "bold" };
const presetGroupStyle = { display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", width: "100%" };
const presetButtonStyle = (isSelected) => ({ padding: "1.8vh 3.5vw", fontSize: "2.2vw", borderRadius: "12px", border: isSelected ? "none" : "2px solid #eee", backgroundColor: isSelected ? "#1D3557" : "#f8f9fa", color: isSelected ? "#fff" : "#333", cursor: "pointer", fontWeight: "bold" });
const buttonStyle = (bg, col, fsize = "4.5vw") => ({ padding: "2.5vh 8vw", fontSize: fsize, borderRadius: "100px", border: "none", backgroundColor: bg, color: col, fontWeight: "900", cursor: "pointer", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" });
const modalOverlayStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 };
const modalContentStyle = { backgroundColor: "white", padding: "4vw", borderRadius: "40px", display: "flex", flexDirection: "column", gap: "10px", width: "90%", maxWidth: "1000px" };
const selectStyle = { padding: "1.5vh 3vw", fontSize: "3.5vw", borderRadius: "15px", border: "2px solid #ddd", backgroundColor: "#fff", color: "#333" };
