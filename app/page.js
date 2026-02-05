"use client";
import { useState, useEffect } from "react";
// --- 追加：Firebaseの設定を読み込む ---
import { db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [isEditing, setIsEditing] = useState(false);
  
  // 【画像に合わせて修正】部屋名を「3階応接室」に固定
  const roomName = "3階応接室"; 

  // --- 大幅変更：画像データの形式（文字列）に合わせてデータを取得する ---
  useEffect(() => {
    // 【画像に合わせて修正】検索する項目名を roomName ではなく room に変更
    const q = query(
      collection(db, "reservations"),
      where("room", "==", roomName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      
      // 今日の日付 (例: "2026-02-06")
      const currentDateStr = now.toLocaleDateString('sv-SE'); 
      // 現在の時刻 (例: "08:45")
      const currentTimeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

      const reservations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 画像のデータ形式（文字列の比較）で「いま」の予約を探す
      const current = reservations.find(res => {
        return res.date === currentDateStr && 
               res.startTime <= currentTimeStr && 
               res.endTime >= currentTimeStr;
      });

      if (current) {
        setData({
          occupied: true,
          dept: current.department, // 【画像に合わせて修正】departmentを表示
          user: current.name,       // 【画像に合わせて修正】nameを表示
          purpose: current.purpose,
          clientName: current.clientName || "",
          startTime: current.startTime,
          endTime: current.endTime
        });
      } else {
        setData({ occupied: false });
      }
    });

    return () => unsubscribe();
  }, [roomName]);

  // --- 以降は元のデザインをそのまま維持 ---
  const handleReserve = async () => {
    alert("kotaniappから予約してください（このボタンは表示専用です）");
    setIsEditing(false);
  };

  if (data.occupied) {
    return (
      <div style={{ backgroundColor: "#D90429", color: "white", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", textAlign: "center" }}>
        <div style={{ fontSize: "8vw", fontWeight: "900" }}>使用中</div>
        <div style={{ fontSize: "5vw", margin: "15px 0", lineHeight: "1.3" }}>
          <strong style={{ fontSize: "7vw" }}>{data.purpose}{data.clientName && `（${data.clientName}様）`}</strong><br />
          {data.dept}：{data.user}<br />
          <span style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "5px 30px", borderRadius: "50px", fontSize: "4vw" }}>
            {data.startTime} 〜 {data.endTime}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#2B9348", color: "white", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: "20vw", fontWeight: "900" }}>空室</div>
      <p style={{ fontSize: "4vw", marginBottom: "2vh" }}>{roomName}</p>
      <button onClick={() => setIsEditing(true)} style={{ marginTop: "2vh", padding: "3vh 10vw", fontSize: "6vw", borderRadius: "100px", border: "none", backgroundColor: "white", color: "#2B9348", fontWeight: "900" }}>
        予約状況
      </button>

      {isEditing && (
        <div style={modalStyle}>
          <div style={contentStyle}>
            <h2 style={{ color: "#333", fontSize: "3vw", margin: "0" }}>利用登録（閲覧モード）</h2>
            <p style={{ color: "#666" }}>予約はkotaniappから行ってください。</p>
            <button onClick={() => setIsEditing(false)} style={actBtn("#666")}>戻る</button>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイル
const modalStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 };
const contentStyle = { backgroundColor: "white", padding: "2.5vw", borderRadius: "30px", width: "90%", maxWidth: "950px", display: "flex", flexDirection: "column", gap: "10px", textAlign: "center" };
const actBtn = (bg) => ({ padding: "1.5vh 5vw", fontSize: "2.5vw", borderRadius: "15px", border: "none", backgroundColor: bg, color: "white", fontWeight: "bold" });
