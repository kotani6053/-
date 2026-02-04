export const dynamic = "force-dynamic";

// サーバーメモリ上でデータを保持
let roomData = {
  user: "未使用",
  purpose: "空室",
  time: ""
};

export async function GET() {
  return Response.json(roomData, {
    headers: { "Cache-Control": "no-store" }
  });
}

export async function POST(req) {
  try {
    const data = await req.json();

    if (data.action === "release") {
      roomData = { user: "未使用", purpose: "空室", time: "" };
    } else {
      roomData = {
        user: data.user || "未使用",
        purpose: data.purpose || "会議中",
        time: data.time || ""
      };
    }
    return Response.json({ status: "ok" });
  } catch (error) {
    return Response.json({ status: "error" }, { status: 400 });
  }
}
