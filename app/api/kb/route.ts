import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { isTopic, listEntries, validateEntry } from "@/lib/kb";
import { readTopicFile, writeTopicFile } from "@/lib/github";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function keysMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get("topic");
  const q = req.nextUrl.searchParams.get("q");
  if (topic && !isTopic(topic)) {
    return NextResponse.json(
      { error: "unknown topic" },
      { headers: NO_STORE, status: 400 },
    );
  }
  const entries = listEntries(topic ?? undefined, q ?? undefined);
  return NextResponse.json({ entries }, { headers: NO_STORE });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.KB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "kb write is not configured" },
      { headers: NO_STORE, status: 503 },
    );
  }
  if (!keysMatch(req.headers.get("X-KB-Key"), apiKey)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { headers: NO_STORE, status: 401 },
    );
  }
  const writeToken = process.env.GH_KB_WRITE_TOKEN;
  if (!writeToken) {
    return NextResponse.json(
      { error: "kb write is not configured" },
      { headers: NO_STORE, status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "body must be valid JSON" },
      { headers: NO_STORE, status: 400 },
    );
  }
  const { entry, error } = validateEntry(body);
  if (!entry) {
    return NextResponse.json(
      { error: error ?? "invalid entry" },
      { headers: NO_STORE, status: 400 },
    );
  }
  let current;
  try {
    current = await readTopicFile(entry.topic, writeToken);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GitHub read failed" },
      { headers: NO_STORE, status: 502 },
    );
  }
  const entries = current.entries.filter((e) => e.id !== entry.id);
  entries.push(entry);
  entries.sort((a, b) => a.id.localeCompare(b.id));
  let commitSha: string;
  try {
    commitSha = await writeTopicFile(
      entry.topic,
      entries,
      current.sha,
      `kb: upsert ${entry.id}`,
      writeToken,
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GitHub write failed" },
      { headers: NO_STORE, status: 502 },
    );
  }
  return NextResponse.json(
    { ...entry, commit_sha: commitSha },
    { headers: NO_STORE },
  );
}
