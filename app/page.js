"use client";
import { useState, useEffect } from "react";

export default function RoomDisplay() {
  const [data, setData] = useState({ user: "読込中...", purpose: "", time: "" });

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/room?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (e) { console.error("通信エラー"); }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // 3秒おきに最新化
    return () => clearInterval(interval);
  }, []);

  const handleRelease = async () => {
    await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release" }),
    });
    fetchStatus();
  };

  const isOccupied = data.user !== "未使用";

  return (
    <div style={{
      backgroundColor: isOccupied ? "#E63946" : "#2A9D8F",
      color: "white",
      height: "100vh",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'Inter', sans-serif",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "22vw", margin: 0, fontWeight: "900", letterSpacing: "-0.05em" }}>
        {isOccupied ? "使用中" : "空室"}
      </h1>

      <div style={{ fontSize: "6vw", fontWeight: "bold", marginTop: "20px" }}>
        {isOccupied ? (
          <div>
            <p style={{ margin: 0 }}>{data.purpose}</p>
            <p style={{ margin: 0, opacity: 0.8 }}>{data.user} {data.time && `| ${data.time}~`}</p>
          </div>
        ) : (
          <p style={{ opacity: 0.7 }}>ご自由にお入りください</p>
        )}
      </div>

      {isOccupied && (
        <button
          onClick={handleRelease}
          style={{
            marginTop: "10vh",
            padding: "3vh 10vw",
            fontSize: "5vw",
            borderRadius: "100px",
            border: "none",
            backgroundColor: "white",
            color: "#E63946",
            fontWeight: "900",
            cursor: "pointer",
            boxShadow: "0 15px 50px rgba(0,0,0,0.3)"
          }}
        >
          終了（空室にする）
        </button>
      )}
    </div>
  );
}
