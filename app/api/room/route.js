let roomData = {
  user: "未使用",
  purpose: "",
  time: ""
};

export async function GET() {
  return Response.json(roomData);
}

export async function POST(req) {
  roomData = await req.json();
  return Response.json({ status: "ok" });
}