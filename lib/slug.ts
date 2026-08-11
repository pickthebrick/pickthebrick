// Type.key/Subtype.key are camelCase ("singleGlazed", "doubleGlazedAcoustic")
// - fine as internal identifiers, but not what a URL should look like.
// slugify() converts to kebab-case for links; resolveSlug() reverses that to
// find the matching key when a route param comes in, without needing a
// dedicated slug column on either model.

export function slugify(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export function resolveSlug<T extends { key: string }>(items: T[], slug: string): T | undefined {
  return items.find((item) => slugify(item.key) === slug);
}
