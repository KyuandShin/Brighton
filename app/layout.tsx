import type { Metadata } from "next";
import { AuthUIProvider } from '@neondatabase/auth/react';
import { authClient } from '@/lib/auth/client';
import "./globals.css";

export const metadata: Metadata = {
  title: "Brighton",
  description: "Tutor Website built with Next.js and Neon Auth",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[#fdfcfb] min-h-screen">
        <AuthUIProvider authClient={authClient as any}>
          {children}
        </AuthUIProvider>
      </body>
    </html>
  );
}
