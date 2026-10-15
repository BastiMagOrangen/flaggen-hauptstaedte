import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import { SwRegister } from "@/components/sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Flaggen & Hauptstädte",
  description: "Flaggen und Hauptstädte lernen",
  manifest: `${base}/manifest.webmanifest`,
  icons: { icon: `${base}/icon-192.png`, apple: `${base}/icon-192.png` },
};

export const viewport: Viewport = { themeColor: "#0f172a" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
