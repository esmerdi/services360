import React, { useState } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  navItems: { label: string; to: string }[];
  title: string;
}

export default function Layout({ children, navItems, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        navItems={navItems}
        title={title}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
      <main
        className={`px-4 py-6 md:pt-20 md:pr-8 lg:pr-10 transition-[padding] duration-300 ${
          sidebarOpen ? 'md:pl-[19rem]' : 'md:pl-8'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
