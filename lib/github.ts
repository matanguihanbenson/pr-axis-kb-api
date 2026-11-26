import type { KbEntry } from "./kb";

const OWNER = "matanguihanbenson";
const REPO = "pr-axis-kb-api";
const BRANCH = "main";

function filePath(topic: string): string {
  return `data/kb/${topic}.json`;
}

function githubHeaders(token: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function readTopicFile(
  topic: string,
  token: string,
): Promise<{ sha: string; entries: KbEntry[] }> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath(topic)}?ref=${BRANCH}`,
    { headers: githubHeaders(token) },
  );
  if (!res.ok) {
    throw new Error(`GitHub read failed for ${topic}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { sha: string; content: string };
  const parsed = JSON.parse(
    Buffer.from(data.content, "base64").toString("utf-8"),
  ) as { entries: KbEntry[] };
  return { sha: data.sha, entries: parsed.entries };
}

export async function writeTopicFile(
  topic: string,
  entries: KbEntry[],
  sha: string,
  message: string,
  token: string,
): Promise<string> {
  const content = Buffer.from(
    JSON.stringify({ topic, entries }, null, 2) + "\n",
    "utf-8",
  ).toString("base64");
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath(topic)}`,
    {
      body: JSON.stringify({
        branch: BRANCH,
        content,
        message,
        sha,
      }),
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      method: "PUT",
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub write failed for ${topic}: HTTP ${res.status} ${text}`);
  }
  const data = (await res.json()) as { commit: { sha: string } };
  return data.commit.sha;
}
