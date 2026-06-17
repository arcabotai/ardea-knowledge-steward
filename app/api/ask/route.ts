import { NextRequest, NextResponse } from "next/server";
import { answerQuestionWithModel } from "@/lib/answer";

export const runtime = "nodejs";

const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 30;

function clientId(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function allowed(id: string): boolean {
  const now = Date.now();
  const current = hits.get(id);
  if (!current || current.resetAt < now) {
    hits.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ ok: false, error: "question is required" }, { status: 400 });
  }
  if (question.length > 1800) {
    return NextResponse.json({ ok: false, error: "question is too long" }, { status: 413 });
  }
  if (!allowed(clientId(request))) {
    return NextResponse.json({ ok: false, error: "rate limit exceeded" }, { status: 429 });
  }
  return NextResponse.json({ ok: true, ...(await answerQuestionWithModel(question)) });
}
