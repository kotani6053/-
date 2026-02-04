export const dynamic = "force-dynamic";

let roomState = {
  occupied: false,
  user: "",
  purpose: "",
  startTime: "",
  endTime: ""
};

export async function GET() {
  return new Response(JSON.stringify(roomState), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

export async function POST(req) {
  const data = await req.json();
  if (data.action === "release") {
    roomState = { occupied: false, user: "", purpose: "", startTime: "", endTime: "" };
  } else {
    roomState = {
      occupied: true,
      user: data.user || "名無し",
      purpose: data.purpose || "会議中",
      startTime: data.startTime || "",
      endTime: data.endTime || ""
    };
  }
  return Response.json({ status: "ok" });
}
