import type { Metadata } from "next";
import RootLayoutClient from "@/components/root-layout-client";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrintHub",
  description: "Your local 3D printing marketplace",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
