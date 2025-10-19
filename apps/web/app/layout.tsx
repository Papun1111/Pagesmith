import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { cn } from "@/lib/utils";
import Script from "next/script";
// Initialize the Inter font for the application.
const font = Inter({ subsets: ["latin"] });

// Define the metadata for the application (title, description, etc.)
export const metadata: Metadata = {
  title: "PageSmith - Real-Time Collaborative Canvas",
  description: "A feature-rich, collaborative canvas application inspired by Notion.",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" />
<link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet"></link>
<Script src="https://checkout.razorpay.com/v1/checkout.js" />
        </head>
        <body >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
