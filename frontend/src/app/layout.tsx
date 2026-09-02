import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { IosToast } from "@/components/ui/ios-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TWCES - Smart, Secure, Seamless Attendance",
  description: "QR Attendance System",
  icons: {
    icon: "/school-logo.jpg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background text-foreground overflow-x-hidden antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <IosToast />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
