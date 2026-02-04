export const dynamic = "force-dynamic";

let roomState = {
  occupied: false,
  user: "",
  purpose: "",
  time: ""
};

export async function GET() {
  return Response.json(roomState, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req) {
  const data = await req.json();
  if (data.action === "release") {
    roomState = { occupied: false, user: "", purpose: "", time: "" };
  } else {
    roomState = {
      occupied: true,
      user: data.user || "名無し",
      purpose: data.purpose || "会議中",
      time: data.time || ""
    };
  }
  return Response.json({ status: "ok" });
}
