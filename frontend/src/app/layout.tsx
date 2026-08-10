import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business Management System",
  description: "Sand and Construction Materials Business Management",
  // Installed to the home screen the app runs without browser chrome, which is
  // what makes the bottom tab bar read as a real app bar rather than a web nav.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Business Manager",
  },
};

// `viewportFit: 'cover'` is what makes env(safe-area-inset-*) resolve to real
// numbers on notched phones. Without it the bottom tab bar sits under the iOS
// home indicator. `maximumScale` is deliberately left alone: pinch-zoom is an
// accessibility feature and locking it out fails WCAG 1.4.4.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0fdfa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
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
