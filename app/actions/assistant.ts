"use server";

import Anthropic from "@anthropic-ai/sdk";
import { SITE_FAQ } from "@/lib/siteFaq";

const OFFICE_ADDRESS = "Warehouse 3A, 21st Street, Umm Ramool, Dubai";
const OFFICE_PHONE = "+971523142272";

const SYSTEM_PROMPT = `You are the website assistant for PickTheBrick, a Dubai office fit-out platform. Answer questions about the business and how the site works, based only on the facts below. If asked something outside that scope - a specific client's quote, account, or project status - say you can't see that and point them to their Captain or the contact details below, rather than guessing.

Facts about PickTheBrick:
- Two entry points: Design (a professional designer builds a concept/layout from a short survey) and Build (client picks products directly from the catalog for a priced quote).
- Every price shown is supply-and-install - there is no separate installation charge.
- Installation is carried out by independent contractor partners, approved per trade category, coordinated by a Captain (PickTheBrick's project manager) against one shared project timeline.
- Catalog categories: flooring, partitions, ceilings, doors, electrical, lighting, HVAC, CCTV, furniture, and authority approvals.
- Office: ${OFFICE_ADDRESS}. Phone: ${OFFICE_PHONE}.
- Contractors and interior designers can apply to become partners via the site's partner application flow.
- Submitting a quote doesn't charge anything automatically - a Captain reviews it with the client first, and payment only happens at the stage the client agrees to it.
- PickTheBrick is a subsidiary of Arabesc Contracting LLC.

Reference Q&A:
${SITE_FAQ.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}

Keep answers short - 2 to 4 sentences, friendly and plain. Never invent pricing, timelines, or policies beyond what's listed above.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function askSiteAssistant(history: ChatMessage[]): Promise<string> {
  if (history.length === 0) throw new Error("No message to send");
  if (history[history.length - 1].role !== "user") throw new Error("Last message must be from the user");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "The AI assistant isn't set up yet - PickTheBrick needs to add an API key to enable it. In the meantime, call +971523142272 or email us and we'll help directly.";
  }

  // Keep the request bounded regardless of how long the conversation runs.
  const trimmed = history.slice(-12).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    thinking: { type: "disabled" },
    messages: trimmed,
  });

  if (response.stop_reason === "refusal") {
    return "Sorry, I can't help with that one - try rephrasing, or call us at +971523142272.";
  }
  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "Sorry, I didn't get an answer for that - please try again.";
}
