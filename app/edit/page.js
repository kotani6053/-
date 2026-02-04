"use client";
import { useState } from "react";

export default function EditRoom() {
  const [form, setForm] = useState({ user: "", purpose: "", time: "", pass: "" });

  const updateRoom = async () => {
    if (form.pass !== "1234") { // 必要に応じてパスコードを変更
      alert("パスコードが正しくありません");
      return;
    }

    const res = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("表示を「使用中」に更新しました！");
    }
  };

  return (
    <div style={{ padding: "30px", fontSize: "1.2rem", maxWidth: "500px", margin: "auto" }}>
      <h2>会議室 表示更新</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input placeholder="利用者" style={{padding: "10px"}} onChange={e => setForm({...form, user: e.target.value})} />
        <input placeholder="目的" style={{padding: "10px"}} onChange={e => setForm({...form, purpose: e.target.value})} />
        <input type="time" style={{padding: "10px"}} onChange={e => setForm({...form, time: e.target.value})} />
        <input type="password" placeholder="パスコード" style={{padding: "10px"}} onChange={e => setForm({...form, pass: e.target.value})} />
        <button onClick={updateRoom} style={{padding: "15px", backgroundColor: "blue", color: "white", fontWeight: "bold"}}>
          更新する
        </button>
      </div>
    </div>
  );
}
