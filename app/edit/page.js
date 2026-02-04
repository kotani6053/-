"use client";
import { useState, useEffect } from "react";

export default function RoomDisplay() {
  const [data, setData] = useState({ user: "確認中...", purpose: "", time: "" });

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/room");
      const json = await res.json();
      setData(json);
    } catch (e) { console.error("データ取得失敗"); }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // 3秒ごとに自動更新
    return () => clearInterval(interval);
  }, []);

  const handleRelease = async () => {
    if (!confirm("会議を終了して空室にしますか？")) return;
    await fetch("/api/room", {
      method: "POST",
      body: JSON.stringify({ action: "release" }),
    });
    fetchStatus();
  };

  const isOccupied = data.user !== "未使用";

  return (
    <div style={{
      backgroundColor: isOccupied ? "#D90429" : "#2B9348", // 使用中は赤、空室は緑
      color: "white",
      height: "100vh",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      textAlign: "center"
    }}>
      {/* 状態表示：画面横幅の約18%の大きさ */}
      <div style={{ fontSize: "18vw", fontWeight: "900", lineHeight: "1" }}>
        {isOccupied ? "使用中" : "空室"}
      </div>

      {/* 会議詳細：画面横幅の約5%の大きさ */}
      <div style={{ fontSize: "5vw", marginTop: "4vh", fontWeight: "bold" }}>
        {isOccupied ? (
          <>
            <div>{data.purpose}</div>
            <div style={{ opacity: 0.8 }}>{data.user} {data.time && `| ${data.time}~`}</div>
          </>
        ) : (
          <div style={{ opacity: 0.7 }}>ご自由にお使いください</div>
        )}
      </div>

      {/* クイック退室ボタン：使用中のみ右下に配置（または中央） */}
      {isOccupied && (
        <button
          onClick={handleRelease}
          style={{
            marginTop: "10vh",
            padding: "20px 50px",
            fontSize: "3vw",
            borderRadius: "50px",
            border: "none",
            backgroundColor: "white",
            color: "#D90429",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 10px 20px rgba(0,0,0,0.3)"
          }}
        >
          ■ 会議終了
        </button>
      )}
    </div>
  );
}
