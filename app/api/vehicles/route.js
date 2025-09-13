// app/api/vehicles/route.js  (หรือ src/app/api/vehicles/route.js)
export const runtime = "nodejs";

// CORS preflight (ถ้าคลientบางตัวยิง OPTIONS มาก่อน)
export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

// ทดสอบ GET ง่าย ๆ (เปิดในเบราว์เซอร์จะขึ้น 200)
export async function GET() {
  return Response.json({
    ok: true,
    hint: "POST to this endpoint with your payload",
  });
}

export async function POST(req) {
  try {
    const payload = await req.json();

    // ถ้า ERP ต้องการ GET ให้สลับไปใช้บล็อก GET ด้านล่าง
    const erpRes = await fetch(
      "https://demo.erpeazy.com/api/method/erpnext.api.get_vehicles",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    // Forward เนื้อหาเดิมกลับ (บางครั้ง ERP ตอบเป็น text)
    const text = await erpRes.text();
    return new Response(text, {
      status: erpRes.status,
      headers: { "Content-Type": "application/json" },
    });

    /*  // ← ใช้กรณี ERP รองรับ "GET ?query=params" เท่านั้น
    const url = new URL("https://demo.erpeazy.com/api/method/erpnext.api.get_vehicles");
    Object.entries(payload || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        url.searchParams.set(k, String(v));
      }
    });
    const erpRes = await fetch(url, { method: "GET" });
    const text = await erpRes.text();
    return new Response(text, { status: erpRes.status, headers: { "Content-Type": "application/json" } });
    */
  } catch (e) {
    return Response.json(
      { message: "proxy error", error: String(e) },
      { status: 500 }
    );
  }
}
