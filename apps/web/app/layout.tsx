import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import Script from "next/script";


// Define the metadata for the application (title, description, etc.)
export const metadata: Metadata = {
  title: "PageSmith - Real-Time Collaborative Canvas",
  description: "A feature-rich, collaborative canvas application",
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
<link href="https://fonts.googleapis.com/css2?family=Agdasima:wght@400;700&family=Germania+One&display=swap" rel="stylesheet"/>
        </head>
        <body >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
