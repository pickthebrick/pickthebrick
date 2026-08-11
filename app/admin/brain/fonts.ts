import { Inter, JetBrains_Mono } from "next/font/google";

// This workspace's own type system (Inter for UI text, JetBrains Mono for
// numeric/technical values) is deliberately distinct from the site's
// Raleway (see app/layout.tsx) - it's an internal tool, not a public page.
export const inter = Inter({ subsets: ["latin"], variable: "--brain-font-sans", weight: ["400", "500", "600", "700", "800"] });
export const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--brain-font-mono", weight: ["500", "700"] });
