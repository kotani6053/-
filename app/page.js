async function getData() {
  const res = await fetch(process.env.NEXT_PUBLIC_BASE_URL + "/api/room", { cache: "no-store" });
  return res.json();
}

export default async function Home() {
  const data = await getData();

  return (
    <div style={{
      height: "100vh",
      background: "#000",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <h1 style={{ fontSize: "48px" }}>会議室 使用状況</h1>
      <div style={{ fontSize: "32px", lineHeight: "1.8" }}>
        <p>使用者：{data.user}</p>
        <p>目的　：{data.purpose}</p>
        <p>時間　：{data.time}</p>
      </div>
      <a href="/edit" style={{ marginTop: 40, color: "#aaa" }}>変更</a>
    </div>
  );
}