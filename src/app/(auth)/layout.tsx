import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'RentRight — Sign In',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-brand-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2.5 px-6 py-5">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-xl">RentRight</span>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-surface-500 text-xs">
          © {new Date().getFullYear()} RentRight. All rights reserved.{' '}
          <Link href="#" className="text-surface-400 hover:text-white transition-colors">Privacy Policy</Link>
          {' · '}
          <Link href="#" className="text-surface-400 hover:text-white transition-colors">Terms of Service</Link>
        </p>
      </footer>
    </div>
  );
}
