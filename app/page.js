"use client";
import { useState, useEffect } from "react";

export default function TabletDisplay() {
  const [data, setData] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // 入力モードかどうかの管理
  const [form, setForm] = useState({ user: "", purpose: "", time: "" });

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

  // 予約する
  const handleReserve = async () => {
    await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setIsEditing(false); // フォームを閉じる
    fetchStatus();
  };

  // 空室にする
  const handleRelease = async () => {
    await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release" }),
    });
    fetchStatus();
  };

  if (!data) return <div style={{background:"#000", height:"100vh"}}></div>;

  return (
    <div style={{
      backgroundColor: data.occupied ? "#D90429" : "#2B9348",
      color: "white",
      height: "100vh",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "sans-serif",
      textAlign: "center",
      position: "relative"
    }}>
      
      {/* メイン表示 */}
      <h1 style={{ fontSize: "22vw", margin: 0, fontWeight: "900" }}>
        {data.occupied ? "使用中" : "空室"}
      </h1>

      <div style={{ fontSize: "6vw", fontWeight: "bold", marginTop: "20px" }}>
        {data.occupied ? (
          <div>
            <p style={{ margin: 0 }}>{data.purpose}</p>
            <p style={{ margin: 0, opacity: 0.8 }}>{data.user} {data.time && `| ${data.time}~`}</p>
          </div>
        ) : (
          <p style={{ opacity: 0.7 }}>ご自由にお入りください</p>
        )}
      </div>

      {/* 操作ボタンエリア */}
      <div style={{ marginTop: "8vh" }}>
        {data.occupied ? (
          // 使用中は「終了」ボタンだけ出す
          <button onClick={handleRelease} style={buttonStyle("#fff", "#D90429")}>
            ■ 会議終了（空室にする）
          </button>
        ) : (
          // 空室の時は「予約入力」ボタンを出す
          <button onClick={() => setIsEditing(true)} style={buttonStyle("#fff", "#2B9348")}>
            ＋ 今から使う（予約）
          </button>
        )}
      </div>

      {/* 入力モーダル（編集ボタンを押した時だけ重なって表示） */}
      {isEditing && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{color:"#333", fontSize:"3vw"}}>利用登録</h2>
            <input placeholder="利用者名" style={inputStyle} onChange={e => setForm({...form, user: e.target.value})} />
            <input placeholder="利用目的" style={inputStyle} onChange={e => setForm({...form, purpose: e.target.value})} />
            <input type="time" style={inputStyle} onChange={e => setForm({...form, time: e.target.value})} />
            
            <div style={{display:"flex", gap:"10px", marginTop:"20px"}}>
              <button onClick={handleReserve} style={buttonStyle("#2B9348", "#fff")}>登録</button>
              <button onClick={() => setIsEditing(false)} style={buttonStyle("#666", "#fff")}>戻る</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイル定義
const buttonStyle = (bg, col) => ({
  padding: "3vh 6vw",
  fontSize: "4vw",
  borderRadius: "100px",
  border: "none",
  backgroundColor: bg,
  color: col,
  fontWeight: "900",
  cursor: "pointer",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
});

const modalOverlayStyle = {
  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
  backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center"
};

const modalContentStyle = {
  backgroundColor: "white", padding: "5vw", borderRadius: "20px",
  display: "flex", flexDirection: "column", gap: "20px", width: "70%"
};

const inputStyle = {
  padding: "2vh", fontSize: "3vw", borderRadius: "10px", border: "1px solid #ccc"
};
