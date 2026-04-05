import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--surface-border)] bg-[var(--color-background)] py-8 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <span className="text-lg font-bold tracking-tight text-[var(--color-text)] font-sans">
              Caliber
            </span>
            <span className="h-4 w-px bg-[var(--surface-border)]" aria-hidden="true" />
            <span className="text-sm text-[var(--color-text-muted)]">
              Precision AI Evaluation
            </span>
          </div>
          
          <nav className="flex items-center space-x-6 text-sm text-[var(--color-text-muted)] font-medium">
            <Link href="/docs" className="hover:text-[var(--color-text)] transition-colors">Documentation</Link>
            <Link href="/privacy" className="hover:text-[var(--color-text)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--color-text)] transition-colors">Terms</Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[var(--color-text-muted)]">
          <p>&copy; {new Date().getFullYear()} Caliber. All rights reserved.</p>
          <p className="mt-2 md:mt-0 font-mono tracking-tight opacity-70">v1.2.0-stable</p>
        </div>
      </div>
    </footer>
  );
}