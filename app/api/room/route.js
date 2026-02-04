export const dynamic = "force-dynamic";

let roomState = {
  occupied: false,
  dept: "",
  user: "",
  purpose: "",
  clientName: "", // 来客社名用
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
    roomState = { occupied: false, dept: "", user: "", purpose: "", clientName: "", startTime: "", endTime: "" };
  } else {
    roomState = {
      occupied: true,
      dept: data.dept || "",
      user: data.user || "",
      purpose: data.purpose || "",
      clientName: data.clientName || "",
      startTime: data.startTime || "",
      endTime: data.endTime || ""
    };
  }
  return Response.json({ status: "ok" });
}
