import "server-only";
import { mkdir, appendFile, readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Local, human-readable memory trail for the Marketing agent - every chat
// turn, tool call, analysis run, and content generation gets appended here,
// then read back into the agent's system prompt on future calls so it has
// continuity across sessions instead of starting cold each time.
//
// NOTE: this is plain node:fs disk I/O. Fine for local `next dev`, but
// Vercel's serverless functions have a read-only filesystem outside /tmp
// (see lib/storage.ts) - writes here will silently no-op in production.
// The DB (lib/marketingState.ts) remains the source of truth for anything
// the UI depends on; this log is a best-effort supplementary memory, not
// the safety net.
const LOG_DIR = path.join(process.cwd(), "data", "marketing-agent-log");

export type MarketingLogEvent =
  | { type: "chat"; userMessage: string; assistantReply: string; toolCalls: { name: string; args: unknown }[] }
  | { type: "analysis"; workingCount: number; problemsCount: number; recommendationCount: number }
  | { type: "content_generated"; platform: string; format: string; idea?: string }
  | { type: "insights_generated"; channel: string; count: number }
  | { type: "opportunities_generated"; count: number }
  | { type: "report_generated"; period: string };

function todayFilename(date = new Date()) {
  return `${date.toISOString().slice(0, 10)}.jsonl`;
}

export async function logMarketingEvent(event: MarketingLogEvent) {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n";
    await appendFile(path.join(LOG_DIR, todayFilename()), line, "utf-8");
  } catch (err) {
    console.warn("marketingLog: could not write local log (expected on read-only filesystems like Vercel)", err);
  }
}

// Condensed text block of the last few days' events, folded into the
// agent's system prompt as continuity/memory. Kept short (last ~25 lines)
// so it doesn't blow out the prompt budget.
export async function getRecentLogContext(days = 3): Promise<string> {
  try {
    const files = await readdir(LOG_DIR).catch(() => [] as string[]);
    const recentFiles = files
      .filter((f) => f.endsWith(".jsonl"))
      .sort()
      .slice(-days);
    if (recentFiles.length === 0) return "No prior activity logged yet.";

    const lines: string[] = [];
    for (const file of recentFiles) {
      const content = await readFile(path.join(LOG_DIR, file), "utf-8");
      lines.push(...content.trim().split("\n").filter(Boolean));
    }
    const recent = lines.slice(-25);
    const summarized = recent.map((line) => {
      try {
        const e = JSON.parse(line);
        if (e.type === "chat") return `[${e.ts}] Chat - asked: "${e.userMessage.slice(0, 120)}" -> replied: "${e.assistantReply.slice(0, 160)}"${e.toolCalls?.length ? ` (ran: ${e.toolCalls.map((t: { name: string }) => t.name).join(", ")})` : ""}`;
        if (e.type === "analysis") return `[${e.ts}] Ran analysis - ${e.workingCount} working, ${e.problemsCount} problems, ${e.recommendationCount} recommendations.`;
        if (e.type === "content_generated") return `[${e.ts}] Generated ${e.platform}/${e.format} content${e.idea ? ` from idea "${e.idea.slice(0, 80)}"` : ""}.`;
        if (e.type === "insights_generated") return `[${e.ts}] Analyzed ${e.channel} - ${e.count} insight(s).`;
        if (e.type === "opportunities_generated") return `[${e.ts}] Found ${e.count} growth opportunit${e.count === 1 ? "y" : "ies"}.`;
        if (e.type === "report_generated") return `[${e.ts}] Generated a ${e.period} report.`;
        return `[${e.ts}] ${e.type}`;
      } catch {
        return null;
      }
    }).filter(Boolean);

    return summarized.length ? summarized.join("\n") : "No prior activity logged yet.";
  } catch (err) {
    console.warn("marketingLog: could not read local log", err);
    return "No prior activity logged yet.";
  }
}
