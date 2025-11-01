import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business Management System",
  description: "Sand and Construction Materials Business Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
