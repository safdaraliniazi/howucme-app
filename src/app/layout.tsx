import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Howucme - Kindness & Connection",
  description: "A platform for building chosen families and sharing kindness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${poppins.variable} antialiased`}
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: 'var(--color-background-primary, #ffffff)',
          color: 'var(--color-text-primary, #0f172a)',
          fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
          lineHeight: 1.6,
          minHeight: '100vh'
        }}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
