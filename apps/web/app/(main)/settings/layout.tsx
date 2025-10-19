import React from 'react';


export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-4xl dark:bg-[#1a1a1a] bg-[#F0F0F0] dark:text-white text-black py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white text-black">Settings</h1>
          <p className="text-muted-foreground mt-1 dark:text-white text-black">
            Manage your account settings and preferences.
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
