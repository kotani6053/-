"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [isEditing, setIsEditing] = useState(false);
  const roomName = "3階応接室"; 

  useEffect(() => {
    const q = query(
      collection(db, "reservations"),
      where("room", "==", roomName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const currentDateStr = now.toLocaleDateString('sv-SE'); 
      const currentTimeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

      const reservations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const current = reservations.find(res => {
        return res.date === currentDateStr && 
               res.startTime <= currentTimeStr && 
               res.endTime >= currentTimeStr;
      });

      if (current) {
        setData({
          id: current.id, // 削除・更新用にIDを保持
          occupied: true,
          dept: current.department,
          user: current.name,
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

  // --- 追加：即座に空室に戻す処理 ---
  const handleRelease = async () => {
    if (!data.id) return;
    
    if (window.confirm("会議を終了して空室に戻しますか？")) {
      try {
        // 方法1：データを削除する場合（一番確実）
        await deleteDoc(doc(db, "reservations", data.id));
        
        // もしデータを消したくない場合は、終了時刻を1分前に書き換える方法もあります
        // await updateDoc(doc(db, "reservations", data.id), { endTime: "00:00" });
        
        alert("空室に戻しました");
      } catch (error) {
        console.error("Error releasing room:", error);
        alert("エラーが発生しました");
      }
    }
  };

  if (data.occupied) {
    return (
      <div style={{ backgroundColor: "#D90429", color: "white", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", textAlign: "center" }}>
        <div style={{ fontSize: "8vw", fontWeight: "900" }}>使用中</div>
        <div style={{ fontSize: "5vw", margin: "10px 0", lineHeight: "1.2" }}>
          <strong style={{ fontSize: "7vw" }}>{data.purpose}{data.clientName && `（${data.clientName}様）`}</strong><br />
          {data.dept}：{data.user}<br />
          <span style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "5px 30px", borderRadius: "50px", fontSize: "4vw" }}>
            {data.startTime} 〜 {data.endTime}
          </span>
        </div>
        
        {/* --- 追加：終了ボタン --- */}
        <button 
          onClick={handleRelease} 
          style={{ 
            marginTop: "3vh", 
            width: "60vw", 
            height: "15vh", 
            backgroundColor: "white", 
            color: "#D90429", 
            fontSize: "6vw", 
            fontWeight: "900", 
            borderRadius: "30px", 
            border: "none", 
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            cursor: "pointer"
          }}
        >
          会議終了（空室にする）
        </button>
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

// スタイルは変更なし
const modalStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 };
const contentStyle = { backgroundColor: "white", padding: "2.5vw", borderRadius: "30px", width: "90%", maxWidth: "950px", display: "flex", flexDirection: "column", gap: "10px", textAlign: "center" };
const actBtn = (bg) => ({ padding: "1.5vh 5vw", fontSize: "2.5vw", borderRadius: "15px", border: "none", backgroundColor: bg, color: "white", fontWeight: "bold" });
