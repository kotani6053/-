"use client";
import { useState } from "react";

export default function EditRoom() {
  const [form, setForm] = useState({ user: "", purpose: "", time: "", pass: "" });

  const updateRoom = async () => {
    if (form.pass !== "1234") { // パスコード例
      alert("パスコードが違います");
      return;
    }
    await fetch("/api/room", {
      method: "POST",
      body: JSON.stringify(form),
    });
    alert("更新しました！");
  };

  return (
    <div style={{ padding: "50px", fontSize: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>会議室 予約入力</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <input type="text" placeholder="利用者名" onChange={e => setForm({...form, user: e.target.value})} style={{fontSize: "20px", padding: "10px"}} />
        <input type="text" placeholder="利用目的" onChange={e => setForm({...form, purpose: e.target.value})} style={{fontSize: "20px", padding: "10px"}} />
        <input type="time" onChange={e => setForm({...form, time: e.target.value})} style={{fontSize: "20px", padding: "10px"}} />
        <hr />
        <input type="password" placeholder="パスコード" onChange={e => setForm({...form, pass: e.target.value})} style={{fontSize: "20px", padding: "10px"}} />
        <button onClick={updateRoom} style={{padding: "20px", backgroundColor: "#0070f3", color: "white", border: "none", fontSize: "20px", cursor: "pointer"}}>
          表示を更新する
        </button>
      </div>
    </div>
  );
}
