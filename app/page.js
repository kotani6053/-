"use client";
import { useState, useEffect } from "react";

export default function TabletDisplay() {
  const [data, setData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ user: "", purpose: "", startTime: "10:00", endTime: "11:00" });

  // 10分刻みの時間リストを生成 (00:00 〜 23:50)
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 10) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/room?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (e) { console.error("Error"); }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReserve = async () => {
    await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setIsEditing(false);
    fetchStatus();
  };

  const handleRelease = async () => {
    await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release" }),
    });
    fetchStatus();
  };

  if (!data) return <div style={{background:"#000", height:"100vh"}}></div>;

  const isOccupied = data.occupied;

  return (
    <div style={{
      backgroundColor: isOccupied ? "#D90429" : "#2B9348",
      color: "white", height: "100vh", width: "100vw",
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      fontFamily: "sans-serif", textAlign: "center", position: "relative", overflow: "hidden"
    }}>
      
      {/* 状態表示 */}
      <h1 style={{ fontSize: "20vw", margin: 0, fontWeight: "900" }}>
        {isOccupied ? "使用中" : "空室"}
      </h1>

      {/* 会議詳細の表示 */}
      <div style={{ fontSize: "5vw", fontWeight: "bold", marginTop: "10px" }}>
        {isOccupied ? (
          <div>
            <p style={{ margin: "5px 0", fontSize: "7vw" }}>{data.purpose}</p>
            <p style={{ margin: 0 }}>{data.user} 様</p>
            <p style={{ margin: "10px 0", backgroundColor: "rgba(0,0,0,0.2)", padding: "10px 30px", borderRadius: "50px", display: "inline-block" }}>
              {data.startTime} 〜 {data.endTime}
            </p>
          </div>
        ) : (
          <p style={{ opacity: 0.8 }}>予約はありません</p>
        )}
      </div>

      {/* ボタンエリア */}
      <div style={{ marginTop: "5vh" }}>
        {isOccupied ? (
          <button onClick={handleRelease} style={buttonStyle("#fff", "#D90429")}>会議終了</button>
        ) : (
          <button onClick={() => setIsEditing(true)} style={buttonStyle("#fff", "#2B9348")}>今から使う</button>
        )}
      </div>

      {/* 入力モーダル */}
      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{color:"#333", fontSize:"4vw", margin:"0 0 20px 0"}}>利用登録</h2>
            
            <input placeholder="利用者名" style={inputStyle} onChange={e => setForm({...form, user: e.target.value})} />
            <input placeholder="利用目的（例：定例MTG）" style={inputStyle} onChange={e => setForm({...form, purpose: e.target.value})} />
            
            <div style={{display:"flex", alignItems:"center", gap:"10px", justifyContent:"center"}}>
              <select style={selectStyle} value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}>
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span style={{color:"#333", fontSize:"3vw"}}>〜</span>
              <select style={selectStyle} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}>
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div style={{display:"flex", gap:"15px", marginTop:"20px"}}>
              <button onClick={handleReserve} style={buttonStyle("#2B9348", "#fff", "3.5vw")}>登録する</button>
              <button onClick={() => setIsEditing(false)} style={buttonStyle("#666", "#fff", "3.5vw")}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイル
const buttonStyle = (bg, col, fsize = "4vw") => ({
  padding: "2.5vh 6vw", fontSize: fsize, borderRadius: "100px", border: "none",
  backgroundColor: bg, color: col, fontWeight: "900", cursor: "pointer", boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
});

const modalOverlayStyle = {
  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
  backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100
};

const modalContentStyle = {
  backgroundColor: "white", padding: "4vw", borderRadius: "30px",
  display: "flex", flexDirection: "column", gap: "15px", width: "80%", maxWidth: "800px"
};

const inputStyle = {
  padding: "2vh", fontSize: "3vw", borderRadius: "12px", border: "2px solid #eee", width: "90%", alignSelf: "center"
};

const selectStyle = {
  padding: "1.5vh 2vw", fontSize: "3vw", borderRadius: "12px", border: "2px solid #eee", backgroundColor: "#f9f9f9"
};
