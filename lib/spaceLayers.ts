import { SPACE_QUESTIONS } from "./spaceQuestions";

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
// admin uploader's grid for whichever space is selected.
export function slotsForSpace(spaceKey: string): LayerSlotDescriptor[] {
  const slots: LayerSlotDescriptor[] = [
    { slot: buttonSlot(), label: "Space-picker button image", group: "button" },
    { slot: baseSlot(), label: "Base room image (always shown)", group: "base" },
  ];
  for (const q of SPACE_QUESTIONS[spaceKey] ?? []) {
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

// Given a space's current answers and its uploaded slot images, returns the
// ordered stack of image URLs to render (base first, then every active
// feature/choice layer) - or null if no base image has been uploaded yet,
// meaning the caller should fall back to the SpaceIcon SVG entirely.
export function resolveLayerImages(
  spaceKey: string,
  answers: Record<string, string>,
  images: Record<string, string>,
): string[] | null {
  const base = images[baseSlot()];
  if (!base) return null;

  const layers = [base];
  for (const q of SPACE_QUESTIONS[spaceKey] ?? []) {
    if (q.type === "boolean") {
      if (answers[q.key] === "true") {
        const url = images[featureSlot(q.key)];
        if (url) layers.push(url);
      }
    } else {
      const value = answers[q.key];
      if (value) {
        const url = images[choiceSlot(q.key, value)];
        if (url) layers.push(url);
      }
    }
  }
  return layers;
}
