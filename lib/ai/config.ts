import "server-only";

// Single place to change which Claude model AI Assist calls, and its request
// shape - swap MODEL here (e.g. to a newer Claude model, or a different
// provider's SDK call inside app/actions/aiAssist.ts) without touching the
// action's product-matching/formula logic at all. Requires ANTHROPIC_API_KEY
// to be set in the deployment environment (Vercel project settings, etc.) -
// PickTheBrick's own Anthropic account is billed for these calls, the same
// key app/actions/assistant.ts (the /ask-ai site assistant) also reads.
export const AI_ASSIST_MODEL = "claude-sonnet-5";
export const AI_ASSIST_MAX_TOKENS = 1500;
