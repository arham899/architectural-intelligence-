import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARCHON — AI Architect Studio",
  description: "Prompt-driven 3D floor plan generation and architectural modeling. Design buildings with natural language.",
  keywords: ["AI", "architecture", "floor plan", "3D modeling", "house design"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
