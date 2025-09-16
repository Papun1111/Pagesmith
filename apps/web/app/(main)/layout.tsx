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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - fixed on desktop, potentially hidden on mobile */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content - this is where the actual page components will be rendered */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
}
