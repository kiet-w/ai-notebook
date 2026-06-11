import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secondary Brain",
  description: "Capture thoughts, let AI organize the chaos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
