// Reference metadata for the 5 jobs the Marketing employee is split into -
// all backed by the same OpenAI model/API (lib/ai/marketingProvider.ts), but
// each with its own system prompt and its own scoped tool access, so
// behavior and authority stay independently readable rather than tangled
// into one mega-prompt. This file is UI/display metadata only (the "meet
// the team" strip on the Overview page); each role's actual system prompt
// lives next to its implementation in marketingProvider.ts.
export type MarketingRoleId = "manager" | "analyst" | "content" | "growth" | "reporting";

export type MarketingRole = {
  id: MarketingRoleId;
  name: string;
  icon: string;
  mission: string;
};

export const MARKETING_ROLES: Record<MarketingRoleId, MarketingRole> = {
  manager: {
    id: "manager",
    name: "Marketing Manager",
    icon: "🧑‍💼",
    mission: "Decides what matters - the one you talk to; can pull in the team below.",
  },
  analyst: {
    id: "analyst",
    name: "Performance Analyst",
    icon: "📊",
    mission: "Analyzes Google Ads, Meta, and website data for patterns and problems.",
  },
  content: {
    id: "content",
    name: "Content Manager",
    icon: "🎨",
    mission: "Creates content concepts and campaign copy.",
  },
  growth: {
    id: "growth",
    name: "Growth Manager",
    icon: "📈",
    mission: "Finds untapped opportunities across channels.",
  },
  reporting: {
    id: "reporting",
    name: "Reporting Manager",
    icon: "📝",
    mission: "Produces daily and weekly performance reports.",
  },
};

export const MARKETING_ROLE_LIST: MarketingRole[] = Object.values(MARKETING_ROLES);
