"use client";
import { useState } from "react";

export default function EditRoom() {
  const [form, setForm] = useState({ user: "", purpose: "", time: "" });

  const updateRoom = async () => {
    const res = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("会議室を表示中にしました！");
    }
  };

  const inputStyle = {
    fontSize: "1.5rem",
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    width: "100%"
  };

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>会議室 予約入力</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <input placeholder="誰が使いますか？" style={inputStyle} onChange={e => setForm({...form, user: e.target.value})} />
        <input placeholder="何に使いますか？" style={inputStyle} onChange={e => setForm({...form, purpose: e.target.value})} />
        <input type="time" style={inputStyle} onChange={e => setForm({...form, time: e.target.value})} />
        
        <button 
          onClick={updateRoom} 
          style={{
            padding: "20px", 
            backgroundColor: "#1D3557", 
            color: "white", 
            fontSize: "1.8rem", 
            fontWeight: "bold", 
            borderRadius: "8px", 
            border: "none", 
            cursor: "pointer",
            marginTop: "20px"
          }}
        >
          この内容で「使用中」にする
        </button>
      </div>
      <p style={{ textAlign: "center", marginTop: "30px", color: "#666" }}>
        ※パスコードは不要です。ボタンを押すと即座に入口の画面が変わります。
      </p>
    </div>
  );
}
