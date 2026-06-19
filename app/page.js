"use client";
import { useState } from "react";
// ★ 正しい階層（1つ上のフォルダ）から db をインポート
import { db } from "../lib/firebase";
// ★ Firestoreの保存に必要な関数をインポート
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function EditRoom() {
  // タブレット側のフォーム構造（dept, user, purpose など）に合わせて初期値を設定
  const [form, setForm] = useState({ 
    dept: "その他", 
    user: "", 
    purpose: "", 
    startTime: "08:00", 
    endTime: "09:00",
    clientName: "",
    guestCount: "1"
  });

  const updateRoom = async () => {
    if (!form.user || !form.purpose) {
      return alert("項目をすべて入力してください");
    }

    const jstNow = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const y = jstNow.getUTCFullYear();
    const m = String(jstNow.getUTCMonth() + 1).padStart(2, '0');
    const d = String(jstNow.getUTCDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    // ★ Firestoreの「reservations」コレクションに直接保存する
    try {
      await addDoc(collection(db, "reservations"), {
        selectedItem: "会議室①", // デフォルトの部屋名
        room: "会議室①",
        department: form.dept,
        dept: form.dept,
        name: form.user,
        user: form.user,
        purpose: form.purpose,
        startTime: form.startTime,
        endTime: form.endTime,
        date: dateStr,
        clientName: form.clientName,
        extraInfo: form.clientName,
        guestCount: String(form.guestCount),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert("会議室を使用中にしました！");
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。URLや設定を確認してください。");
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
        {/* 入力された値をそれぞれの適切な項目にセット */}
        <input placeholder="誰が使いますか？" style={inputStyle} onChange={e => setForm({...form, user: e.target.value})} />
        <input placeholder="何に使いますか？" style={inputStyle} onChange={e => setForm({...form, purpose: e.target.value})} />
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input type="time" style={inputStyle} value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
          <span>〜</span>
          <input type="time" style={inputStyle} value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
        </div>
        
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
