import type { Metadata } from "next";
import "./globals.css";

import QueryProvider from "@/components/providers/query-provider";

import { ThemeProvider } from "@/components/theme-provider";
import { IosToast } from "@/components/ui/ios-toast";

export const metadata: Metadata = {
  title: "Qridify - Smart, Secure, Seamless Attendance",
  description: "QR & RFID Attendance System",
  icons: {
    icon: "/logo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans bg-background text-foreground overflow-x-hidden">
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
