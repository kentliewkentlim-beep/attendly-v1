import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Staff Attendance App",
  description: "A simple and clean attendance tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}