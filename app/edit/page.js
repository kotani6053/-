"use client";
import { useState, useEffect } from "react";

export default function RoomDisplay() {
  const [data, setData] = useState({ user: "読込中...", purpose: "", time: "" });

  const fetchStatus = async () => {
    try {
      // キャッシュを避けるためにタイムスタンプを付与
      const res = await fetch(`/api/room?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Fetch error");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
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
      backgroundColor: isOccupied ? "#d00000" : "#008000",
      color: "white",
      height: "100vh",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "sans-serif",
      textAlign: "center",
      overflow: "hidden"
    }}>
      {/* 巨大ステータス表示 */}
      <h1 style={{ fontSize: "20vw", margin: 0, fontWeight: "900", lineHeight: 1 }}>
        {isOccupied ? "使用中" : "空室"}
      </h1>

      {/* 詳細情報 */}
      <div style={{ fontSize: "6vw", marginTop: "2vh", fontWeight: "bold" }}>
        {isOccupied ? (
          <>
            <div>{data.purpose}</div>
            <div style={{ opacity: 0.8 }}>{data.user} {data.time && `(${data.time}~)`}</div>
          </>
        ) : (
          <div style={{ opacity: 0.6 }}>予約なし</div>
        )}
      </div>

      {/* ワンタッチ空室ボタン */}
      {isOccupied && (
        <button
          onClick={handleRelease}
          style={{
            marginTop: "8vh",
            padding: "4vh 8vw",
            fontSize: "5vw",
            borderRadius: "100px",
            border: "none",
            backgroundColor: "white",
            color: "#d00000",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
          }}
        >
          ■ 終了して空室にする
        </button>
      )}
    </div>
  );
}
