import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import MainWrapper from "@/components/MainWrapper";
import { RoleProvider } from "@/components/RoleProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caliber",
  description: "Evaluate and monitor your agents with Caliber analytics",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${geistMono.variable} antialiased bg-[var(--color-background)] text-[var(--color-text)]`}
        suppressHydrationWarning
      >
        <ToastProvider>
          <RoleProvider>
            <Navbar />
            <MainWrapper>{children}</MainWrapper>
          </RoleProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
