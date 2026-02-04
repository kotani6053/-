// app/edit/page.js
"use client";
import { useState } from "react";

export default function EditRoom() {
  const [form, setForm] = useState({ user: "", purpose: "", time: "", pass: "" });

  const updateRoom = async () => {
    // 簡易バリデーション
    if (form.pass !== "1234") { 
      alert("パスコードが違います");
      return;
    }

    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // これが重要！
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        alert("表示を更新しました！TOP画面を確認してください。");
      } else {
        alert("サーバーエラーが発生しました。");
      }
    } catch (e) {
      alert("通信に失敗しました。");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "500px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2 style={{ borderBottom: "2px solid #333" }}>会議室 表示設定</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
        <label>利用者名: <input type="text" style={{padding:"8px", width:"100%"}} onChange={e => setForm({...form, user: e.target.value})} /></label>
        <label>利用目的: <input type="text" style={{padding:"8px", width:"100%"}} onChange={e => setForm({...form, purpose: e.target.value})} /></label>
        <label>開始時間: <input type="time" style={{padding:"8px", width:"100%"}} onChange={e => setForm({...form, time: e.target.value})} /></label>
        <label style={{marginTop: "20px", color: "red"}}>パスコード: 
          <input type="password" style={{padding:"8px", width:"100%", border: "1px solid red"}} onChange={e => setForm({...form, pass: e.target.value})} />
        </label>
        <button onClick={updateRoom} style={{padding: "15px", backgroundColor: "#0070f3", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", marginTop: "10px"}}>
          この内容で表示を更新
        </button>
      </div>
    </div>
  );
}
