import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { I18nProvider } from "@/i18n";

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
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full bg-background text-foreground">
        <I18nProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
