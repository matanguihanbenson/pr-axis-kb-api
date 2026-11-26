import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { TOPICS, getEntry, listEntries } from "@/lib/kb";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const entry = getEntry(id);
  if (!entry) {
    return NextResponse.json(
      { status: "not_ready" },
      { headers: NO_STORE, status: 404 },
    );
  }
  return NextResponse.json(entry, { headers: NO_STORE });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const { id } = await params;
  const entry = getEntry(id);
  if (!entry) {
    return NextResponse.json(
      { status: "not_ready" },
      { headers: NO_STORE, status: 404 },
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
  const entries = current.entries.filter((e) => e.id !== id);
  let commitSha: string;
  try {
    commitSha = await writeTopicFile(
      entry.topic,
      entries,
      current.sha,
      `kb: delete ${id}`,
      writeToken,
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GitHub write failed" },
      { headers: NO_STORE, status: 502 },
    );
  }
  return NextResponse.json(
    { deleted: id, commit_sha: commitSha },
    { headers: NO_STORE },
  );
}
