import { NextResponse } from "next/server";
import { extractTextFromUpload } from "@/server/services/extract";
import { analyzeLeaseText } from "@/server/services/lease-analysis";
import { checkRateLimit } from "@/server/services/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    checkRateLimit(ip);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Attach a lease document before analyzing." }, { status: 400 });
    }

    const text = await extractTextFromUpload(file);
    const result = await analyzeLeaseText({ text, fileName: file.name });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze this document.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
