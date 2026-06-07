import { NextResponse } from "next/server";
import { extractTextFromUpload } from "@/server/services/extract";
import { analyzeContractText } from "@/server/services/lease-analysis";
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

    let text = "";
    let fileName = "email.txt";
    let customCrmRecords: any[] | undefined = undefined;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      text = body.text || "";
      fileName = body.fileName || "email.txt";
      customCrmRecords = body.crmRecords;
    } else {
      const formData = await request.formData();
      const file = formData.get("file");
      if (file instanceof File) {
        text = await extractTextFromUpload(file);
        fileName = file.name;
      } else {
        const textParam = formData.get("text");
        if (typeof textParam === "string") {
          text = textParam;
          fileName = (formData.get("fileName") as string) || "email.txt";
        }
      }
    }

    if (!customCrmRecords || !Array.isArray(customCrmRecords) || customCrmRecords.length === 0) {
      return NextResponse.json(
        { error: "CRM records are required for reconciliation. Please upload a CRM CSV file first." },
        { status: 400 }
      );
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: "Please provide valid email text to analyze (min 10 characters)." }, { status: 400 });
    }

    const result = await analyzeContractText({ text, fileName, customCrmRecords });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze this document.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

