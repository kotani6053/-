"use client";
import { useState } from "react";
// ★ 正しい階層（2つ上のフォルダ）から db をインポート
import { db } from "../../firebase";
// ★ Firestoreの保存に必要な関数をインポート
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function EditPage() {
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
    const m = String(jstNow.getUTCHonth() + 1).padStart(2, '0');
    const d = String(jstNow.getUTCDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    try {
      await addDoc(collection(db, "reservations"), {
        selectedItem: "会議室①",
        room: "会議室①",
        department: form.form.dept,
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
      alert("変更を保存しました！");
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>予約内容の編集</h1>
      <button onClick={updateRoom} style={{ padding: "15px", width: "100%", backgroundColor: "#1D3557", color: "white", border: "none", borderRadius: "8px", fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer" }}>
        変更を確定する
      </button>
    </div>
  );
}
