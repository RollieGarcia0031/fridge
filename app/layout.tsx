import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import AppHeader from "@/components/AppHeader";
import { themeInitScript } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fridge",
  description: "AI agent for generating meal suggestions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publicEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
  return (
    // theme-init mutates documentElement's class before hydration;
    // suppress the expected attribute mismatch on this element only
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="runtime-public-env"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.__ENV=${JSON.stringify(publicEnv)};`,
          }}
        />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="grid grid-rows-[auto_1fr] min-h-screen">
          <AppHeader />
          {children}
        </div>

        <ToastContainer />
      </body>
    </html>
  );
}
