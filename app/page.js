"use client";
import { useState, useEffect } from "react";

export default function TabletDisplay() {
  const [data, setData] = useState({ occupied: false });
  const [isEditing, setIsEditing] = useState(false);
  
  // 選択肢の設定
  const deptPresets = ["新門司製造部", "新門司セラミック", "総務部", "役員", "その他"];
  const userPresets = ["役員", "部長", "次長", "課長", "係長", "主任", "その他"];
  const purposePresets = ["会議", "来客", "面談", "面接", "その他"];

  const [form, setForm] = useState({ dept: "", user: "", purpose: "", startTime: "10:00", endTime: "11:00" });

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/room?nocache=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      setData(json);
    } catch (e) { console.error("Update failed"); }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleReserve = async () => {
    if (!form.dept || !form.user || !form.purpose) {
      alert("すべての項目を選択してください");
      return;
    }
    await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setIsEditing(false);
    fetchStatus();
  };

  const handleRelease = async () => {
    await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release" }),
    });
    // 強制リロードでキャッシュを完全にクリア
    setTimeout(() => { window.location.reload(); }, 200);
  };

  if (data.occupied) {
    // 【使用中画面】
    return (
      <div style={{ backgroundColor: "#D90429", color: "white", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", textAlign: "center" }}>
        <div style={{ fontSize: "10vw", fontWeight: "900" }}>使用中</div>
        <div style={{ fontSize: "5vw", margin: "20px 0", lineHeight: "1.4" }}>
          <strong style={{ fontSize: "7vw" }}>{data.purpose}</strong><br />
          {data.dept}：{data.user}<br />
          <span style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "5px 20px", borderRadius: "50px" }}>
            {data.startTime} 〜 {data.endTime}
          </span>
        </div>
        <button onClick={handleRelease} style={{ width: "80vw", height: "25vh", backgroundColor: "white", color: "#D90429", fontSize: "8vw", fontWeight: "900", borderRadius: "30px", border: "none", boxShadow: "0 15px 40px rgba(0,0,0,0.4)", cursor: "pointer" }}>
          会議終了
        </button>
      </div>
    );
  }

  // 【空室画面】
  return (
    <div style={{ backgroundColor: "#2B9348", color: "white", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: "20vw", fontWeight: "900" }}>空室</div>
      <button onClick={() => setIsEditing(true)} style={{ marginTop: "5vh", padding: "3vh 10vw", fontSize: "6vw", borderRadius: "100px", border: "none", backgroundColor: "white", color: "#2B9348", fontWeight: "900", cursor: "pointer" }}>
        予約入力
      </button>

      {isEditing && (
        <div style={modalStyle}>
          <div style={contentStyle}>
            <h2 style={{ color: "#333", fontSize: "3vw", margin: "0" }}>利用登録</h2>
            
            <div style={label}>1. 利用部署</div>
            <div style={group}>{deptPresets.map(d => (<button key={d} onClick={() => setForm({...form, dept: d})} style={pBtn(form.dept === d)}>{d}</button>))}</div>
            
            <div style={label}>2. 利用者（役職）</div>
            <div style={group}>{userPresets.map(u => (<button key={u} onClick={() => setForm({...form, user: u})} style={pBtn(form.user === u)}>{u}</button>))}</div>
            
            <div style={label}>3. 利用目的</div>
            <div style={group}>{purposePresets.map(p => (<button key={p} onClick={() => setForm({...form, purpose: p})} style={pBtn(form.purpose === p)}>{p}</button>))}</div>
            
            <div style={{ display: "flex", gap: "20px", marginTop: "20px", justifyContent: "center" }}>
              <button onClick={handleReserve} style={actBtn("#2B9348")}>登録</button>
              <button onClick={() => setIsEditing(false)} style={actBtn("#666")}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// スタイル定義
const modalStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 };
const contentStyle = { backgroundColor: "white", padding: "3vw", borderRadius: "30px", width: "90%", maxWidth: "1000px", display: "flex", flexDirection: "column", gap: "10px" };
const label = { color: "#666", fontSize: "1.5vw", fontWeight: "bold", textAlign: "left", marginLeft: "5%" };
const group = { display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" };
const pBtn = (s) => ({ padding: "1.5vh 2.5vw", fontSize: "2vw", borderRadius: "10px", border: "none", backgroundColor: s ? "#1D3557" : "#eee", color: s ? "#fff" : "#333", fontWeight: "bold", transition: "0.2s" });
const actBtn = (bg) => ({ padding: "2vh 6vw", fontSize: "3vw", borderRadius: "15px", border: "none", backgroundColor: bg, color: "white", fontWeight: "bold", cursor: "pointer" });
