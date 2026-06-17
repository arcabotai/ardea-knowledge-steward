import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/answer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ ok: false, error: "question is required" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ...answerQuestion(question) });
}
