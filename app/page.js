"use client";
import { useState, useEffect } from "react";
// --- 追加：Firebaseの設定を読み込む ---
import { db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [isEditing, setIsEditing] = useState(false);
  const roomName = "会議室A"; // kotaniappで登録している部屋名と一致させてください

  const deptPresets = ["新門司製造部", "新門司セラミック", "総務部", "役員", "その他"];
  const userPresets = ["役員", "部長", "次長", "課長", "係長", "主任", "その他"];
  const purposePresets = ["会議", "来客", "面談", "面接", "その他"];

  const [form, setForm] = useState({ dept: "", user: "", purpose: "", clientName: "", startTime: "10:00", endTime: "11:00" });

  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 10) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  // --- 大幅変更：APIではなくFirebaseからリアルタイムにデータを取得する ---
  useEffect(() => {
    const q = query(
      collection(db, "reservations"),
      where("roomName", "==", roomName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const reservations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 現在時刻が「予約開始〜終了」の間にあるものを探す
      const current = reservations.find(res => {
        if (!res.startTime || !res.endTime) return false;
        const start = res.startTime.toDate();
        const end = res.endTime.toDate();
        return start <= now && end >= now;
      });

      if (current) {
        setData({
          occupied: true,
          dept: current.dept,
          user: current.user,
          purpose: current.purpose,
          clientName: current.clientName,
          startTime: current.startTime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          endTime: current.endTime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
      } else {
        setData({ occupied: false });
      }
    });

    return () => unsubscribe();
  }, [roomName]);

  // --- handleReserve（登録）もFirebaseに直接書き込む形に ---
  const handleReserve = async () => {
    if (!form.dept || !form.user || !form.purpose) {
      alert("項目を選択してください");
      return;
    }
    
    // ※今回は表示の連動を優先するため、書き込み処理は一旦シンプルにしています
    // kotaniapp側で予約すれば、こちらに自動反映されます
    alert("kotaniappから予約してください（このボタンは表示専用です）");
    setIsEditing(false);
  };

  const handleRelease = () => {
    alert("kotaniapp側で予約を終了させてください");
  };

  // --- ここから下は元のデザインをそのまま維持 ---
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
      <button onClick={() => setIsEditing(true)} style={{ marginTop: "5vh", padding: "3vh 10vw", fontSize: "6vw", borderRadius: "100px", border: "none", backgroundColor: "white", color: "#2B9348", fontWeight: "900" }}>
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

// スタイル（そのまま）
const modalStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 };
const contentStyle = { backgroundColor: "white", padding: "2.5vw", borderRadius: "30px", width: "90%", maxWidth: "950px", display: "flex", flexDirection: "column", gap: "10px", textAlign: "center" };
const label = { color: "#666", fontSize: "1.4vw", fontWeight: "bold", textAlign: "left", marginLeft: "5%" };
const group = { display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" };
const pBtn = (s) => ({ padding: "1.2vh 2vw", fontSize: "1.8vw", borderRadius: "10px", border: "none", backgroundColor: s ? "#1D3557" : "#eee", color: s ? "#fff" : "#333", fontWeight: "bold" });
const actBtn = (bg) => ({ padding: "1.5vh 5vw", fontSize: "2.5vw", borderRadius: "15px", border: "none", backgroundColor: bg, color: "white", fontWeight: "bold" });
const selStyle = { padding: "1vh 2vw", fontSize: "2.5vw", borderRadius: "10px", border: "2px solid #ddd" };
const inputStyle = { width: "80%", padding: "1.5vh", fontSize: "2.5vw", borderRadius: "10px", border: "2px solid #2B9348", marginTop: "5px", textAlign: "center" };
