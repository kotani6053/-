export const dynamic = "force-dynamic";

let roomState = {
  occupied: false,
  dept: "",     // 利用部署
  user: "",     // 利用者（役職）
  purpose: "",  // 利用目的
  startTime: "",
  endTime: ""
};

export async function GET() {
  return Response.json(roomState, {
    headers: { "Cache-Control": "no-store, max-age=0" }
  });
}

export async function POST(req) {
  const data = await req.json();
  
  if (data.action === "release") {
    roomState = { occupied: false, dept: "", user: "", purpose: "", startTime: "", endTime: "" };
  } else {
    roomState = {
      occupied: true,
      dept: data.dept || "不明",
      user: data.user || "不明",
      purpose: data.purpose || "会議",
      startTime: data.startTime || "",
      endTime: data.endTime || ""
    };
  }
  return Response.json({ status: "ok" });
}
