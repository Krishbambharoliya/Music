import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "S.P Hostel — Estd. 1956 | Retro Radio",
  description: "A nostalgic retro radio station from the courtyard of S.P Hostel. The songs that echo through hostel corridors, chai stalls, and cricket matches on dusty Indian streets.",
  applicationName: "S.P Hostel Radio",
  keywords: "nostalgia, retro radio, Indian hostel, chai stall music, street cricket, old songs, hostel radio",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SP Radio",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16110e",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className="h-full antialiased dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Share+Tech+Mono&family=Rozha+One&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icon.jpg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-ink text-cream font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
