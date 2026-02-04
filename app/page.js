"use client";
import { useState, useEffect } from "react";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false, user: "", purpose: "", startTime: "", endTime: "" });
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

  const fetchStatus = async () => {
    try {
      // 常に新しいURLとして認識させるためミリ秒を付与
      const res = await fetch(`/api/room?nocache=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("更新に失敗しました");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000); // 2秒間隔
    return () => clearInterval(interval);
  }, []);

  const handleReserve = async () => {
    if (!form.user || !form.purpose) {
      alert("選択してください");
      return;
    }
    await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setIsEditing(false);
    setTimeout(fetchStatus, 500); // 0.5秒後に強制再読込
  };

  const handleRelease = async () => {
    await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release" }),
    });
    setTimeout(fetchStatus, 500); // 0.5秒後に強制再読込
  };

  const isOccupied = data.occupied;

  return (
    <div style={{
      backgroundColor: isOccupied ? "#D90429" : "#2B9348",
      color: "white", height: "100vh", width: "100vw",
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      fontFamily: "sans-serif", textAlign: "center", position: "relative", overflow: "hidden"
    }}>
      <h1 style={{ fontSize: "20vw", margin: 0, fontWeight: "900" }}>
        {isOccupied ? "使用中" : "空室"}
      </h1>

      <div style={{ fontSize: "5vw", fontWeight: "bold" }}>
        {isOccupied ? (
          <div>
            <p style={{ margin: "5px 0", fontSize: "7vw" }}>{data.purpose}</p>
            <p style={{ margin: 0 }}>{data.user}</p>
            <p style={{ margin: "10px 0", backgroundColor: "rgba(0,0,0,0.2)", padding: "10px 40px", borderRadius: "50px", display: "inline-block" }}>
              {data.startTime} 〜 {data.endTime}
            </p>
          </div>
        ) : (
          <p style={{ opacity: 0.8 }}>予約はありません</p>
        )}
      </div>

      <div style={{ marginTop: "5vh" }}>
        {isOccupied ? (
          <button onClick={handleRelease} style={btnStyle("#fff", "#D90429")}>会議終了</button>
        ) : (
          <button onClick={() => setIsEditing(true)} style={btnStyle("#fff", "#2B9348")}>今から使う</button>
        )}
      </div>

      {isEditing && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{color:"#333", fontSize:"3vw"}}>利用登録</h2>
            <div style={label}>利用者</div>
            <div style={group}>{userPresets.map(u => (<button key={u} onClick={() => setForm({...form, user: u})} style={presetBtn(form.user === u)}>{u}</button>))}</div>
            <div style={label}>目的</div>
            <div style={group}>{purposePresets.map(p => (<button key={p} onClick={() => setForm({...form, purpose: p})} style={presetBtn(form.purpose === p)}>{p}</button>))}</div>
            <div style={label}>時間</div>
            <div style={{display:"flex", gap:"10px", justifyContent:"center", alignItems:"center"}}>
              <select style={sel} value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <span style={{color:"#333"}}>〜</span>
              <select style={sel} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            <div style={{display:"flex", gap:"15px", marginTop:"20px", justifyContent:"center"}}>
              <button onClick={handleReserve} style={btnStyle("#2B9348", "#fff", "3vw")}>登録</button>
              <button onClick={() => setIsEditing(false)} style={btnStyle("#666", "#fff", "3vw")}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイル略記
const btnStyle = (bg, col, fs="4.5vw") => ({ padding: "2.5vh 8vw", fontSize: fs, borderRadius: "100px", border: "none", backgroundColor: bg, color: col, fontWeight: "900", cursor: "pointer" });
const modalOverlay = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 };
const modalContent = { backgroundColor: "white", padding: "3vw", borderRadius: "30px", display: "flex", flexDirection: "column", gap: "10px", width: "90%", maxWidth: "900px" };
const label = { color: "#555", fontSize: "1.8vw", textAlign: "left", width: "90%", margin: "10px auto 0", fontWeight: "bold" };
const group = { display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" };
const presetBtn = (s) => ({ padding: "1.5vh 3vw", fontSize: "2vw", borderRadius: "10px", border: s ? "none" : "2px solid #eee", backgroundColor: s ? "#1D3557" : "#f8f9fa", color: s ? "#fff" : "#333", fontWeight: "bold" });
const sel = { padding: "1.5vh 2vw", fontSize: "3vw", borderRadius: "10px", border: "2px solid #ddd" };
