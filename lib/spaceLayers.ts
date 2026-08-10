import type { SpaceQuestion } from "./spaceQuestions";

// Builds/parses the `slot` strings stored on SpaceLayerImage (see
// prisma/schema.prisma) - the single source of truth for that vocabulary so
// the admin uploader and the client-facing survey/wizard never drift apart.

export function buttonSlot(): string {
  return "button";
}
export function baseSlot(): string {
  return "base";
}
export function featureSlot(questionKey: string): string {
  return `feature:${questionKey}`;
}
export function choiceSlot(questionKey: string, value: string): string {
  return `choice:${questionKey}:${value}`;
}

export type LayerSlotDescriptor = { slot: string; label: string; group: "button" | "base" | "feature" | "choice" };

// Every uploadable slot for a space, in display order - used to render the
// admin uploader's grid for whichever space is selected. Takes the already-
// merged question list (hardcoded + admin-added, see mergedSpaceQuestions in
// lib/spaceQuestions.ts) rather than looking questions up itself, so this
// file has no dependency on where those questions came from.
export function slotsForSpace(questions: SpaceQuestion[]): LayerSlotDescriptor[] {
  const slots: LayerSlotDescriptor[] = [
    { slot: buttonSlot(), label: "Space-picker button image", group: "button" },
    { slot: baseSlot(), label: "Base room image (always shown)", group: "base" },
  ];
  for (const q of questions) {
    if (q.type === "boolean") {
      slots.push({ slot: featureSlot(q.key), label: q.label, group: "feature" });
    } else {
      for (const opt of q.options) {
        slots.push({ slot: choiceSlot(q.key, opt), label: `${q.label} — ${opt}`, group: "choice" });
      }
    }
  }
  return slots;
}

export type LayerImage = { url: string; sortOrder: number };

// Given a space's current answers and its uploaded slot images, returns the
// ordered stack of image URLs to render (base first - always the bottom
// layer regardless of sortOrder - then every active feature/choice layer in
// admin-controlled stacking order) - or null if no base image has been
// uploaded yet, meaning the caller should fall back to the SpaceIcon SVG
// entirely.
export function resolveLayerImages(
  questions: SpaceQuestion[],
  answers: Record<string, string>,
  images: Record<string, LayerImage>,
): string[] | null {
  const base = images[baseSlot()];
  if (!base) return null;

  const active: LayerImage[] = [];
  for (const q of questions) {
    if (q.type === "boolean") {
      if (answers[q.key] === "true") {
        const img = images[featureSlot(q.key)];
        if (img) active.push(img);
      }
    } else {
      const value = answers[q.key];
      if (value) {
        const img = images[choiceSlot(q.key, value)];
        if (img) active.push(img);
      }
    }
  }
  active.sort((a, b) => a.sortOrder - b.sortOrder);
  return [base.url, ...active.map((l) => l.url)];
}
