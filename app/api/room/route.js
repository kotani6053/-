// app/api/room/route.js
let roomData = { user: "未使用", purpose: "空室", time: "" };

export async function GET() {
  return Response.json(roomData);
}

export async function POST(req) {
  try {
    const data = await req.json();
    console.log("受信データ:", data); // Vercelのログやターミナルで確認できます

    if (data.action === "release") {
      roomData = { user: "未使用", purpose: "空室", time: "" };
    } else {
      // フォームからの送信時
      roomData = {
        user: data.user || "未使用",
        purpose: data.purpose || "会議中",
        time: data.time || ""
      };
    }
    return Response.json({ status: "ok" });
  } catch (error) {
    return Response.json({ status: "error", message: error.message }, { status: 400 });
  }
}
