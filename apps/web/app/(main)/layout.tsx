import { Header } from "@/components/global/Header";
import { Sidebar } from "@/components/global/Sidebar";
import React from "react";

/**
 * The main layout for the authenticated part of the application.
 * It establishes the persistent structure with a sidebar for navigation
 * and a main content area that includes a header.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F0F0F0] dark:bg-[#111111]">
      {/* Sidebar - sticky on desktop, hidden on mobile (Sheet in Header) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Header */}
        <Header />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F0F0F0] dark:bg-[#111111]">
          {children}
        </main>
      </div>
    </div>
  );
}