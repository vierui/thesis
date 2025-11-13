import type { Metadata } from "next"
import { Inter as FontSans } from "next/font/google"
import "./globals.css";
import { cn } from "@/lib/cn"
import { Toaster } from "sonner"
import { ClerkProvider } from '@clerk/nextjs'

// Force dynamic rendering (prevents static generation issues with Clerk)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Lab Knowledge Container",
  description: "Knowledge Transfer System",
};
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        { children }
        <Toaster/>
      </body>
    </html>
    </ClerkProvider>
  );
}
