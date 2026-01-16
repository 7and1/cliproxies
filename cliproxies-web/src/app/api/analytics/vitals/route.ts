import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const vitals = await request.json();

    // Log the vitals (in production, send to your analytics service)
    console.log("[Web Vitals]", {
      url: vitals.url,
      lcp: vitals.lcp?.value,
      fid: vitals.fid?.value,
      cls: vitals.cls?.value,
      fcp: vitals.fcp?.value,
      ttfb: vitals.ttfb?.value,
    });

    // Return success
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
