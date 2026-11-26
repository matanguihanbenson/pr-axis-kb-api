import type { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "Knowledge base API for the Ask Marcus chatbot on pr-axisdev.com.",
  title: "pr-axis KB API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
