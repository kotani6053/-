export const dynamic = "force-dynamic";

import { headers } from "next/headers";

async function getData() {
  const h = headers();
  const host = h.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/room`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch room data");
  }

  return res.json();
}

export default async function Home() {
  const data = await getData();

  return (
    <div
      style={{
        height: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "48px" }}>会議室 使用状況</h1>
      <div style={{ fontSize: "32px", lineHeight: "1.8" }}>
        <p>使用者：{data.user}</p>
        <p>目的　：{data.purpose}</p>
        <p>時間　：{data.time}</p>
      </div>
      <a href="/edit" style={{ marginTop: 40, color: "#aaa" }}>
        変更
      </a>
    </div>
  );
}
