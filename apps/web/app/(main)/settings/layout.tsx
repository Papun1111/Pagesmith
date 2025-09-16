import React from 'react';

/**
 * A layout component that wraps all pages within the settings section.
 * It provides a consistent container with padding and a main heading
 * for a unified look and feel across all settings pages (e.g., Billing, Profile).
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences.
          </p>
        </div>
        {/* The content of the specific settings page (e.g., BillingPage) will be rendered here */}
        {children}
      </div>
    </div>
  );
}
