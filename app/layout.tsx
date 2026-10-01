import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Garden Room Framing Designer",
  description: "Dimensioned four-wall timber framing diagrams, schedules and PDF export.",
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
