// 簡易的なメモリ保存（Vercel再起動でリセットされます）
let roomData = {
  user: "未使用",
  purpose: "空室",
  time: ""
};

export async function GET() {
  return Response.json(roomData);
}

export async function POST(req) {
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
}
