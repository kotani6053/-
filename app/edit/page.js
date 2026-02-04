"use client";
import { useState } from "react";

export default function Edit() {
  const [user, setUser] = useState("");
  const [purpose, setPurpose] = useState("");
  const [time, setTime] = useState("");
  const [pin, setPin] = useState("");

  const submit = async () => {
    if (pin !== "1234") {
      alert("パスコードが違います");
      return;
    }

    await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, purpose, time })
    });

    location.href = "/";
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      justifyContent: "center",
      alignItems: "center"
    }}>
      <h1>使用情報入力</h1>
      <input placeholder="使用者" onChange={e => setUser(e.target.value)} />
      <input placeholder="使用目的" onChange={e => setPurpose(e.target.value)} />
      <input placeholder="使用時間" onChange={e => setTime(e.target.value)} />
      <input placeholder="パスコード" type="password" onChange={e => setPin(e.target.value)} />
      <button onClick={submit}>確定</button>
    </div>
  );
}