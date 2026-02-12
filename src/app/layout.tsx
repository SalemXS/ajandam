import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kişisel Ajanda - Görev & Finans Takibi",
  description: "Kişisel görev yönetimi, finans takibi, hedef planlama ve hatırlatma uygulaması",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        <AuthProvider>
          <ThemeProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
