import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-surface/60 backdrop-blur-xl py-8 text-center text-sm text-text-muted mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-medium text-xs sm:text-sm">
          Made with love and tea by <span className="text-text-primary font-semibold hover:text-accent transition-colors">Pratyaksh Tomar</span> and{' '}
          <span className="text-text-primary font-semibold hover:text-accent transition-colors">Preet Chaudhary</span>
        </p>
        <p className="text-xs text-text-subtle font-mono">
          Rehearsal AI &copy; {new Date().getFullYear()} &bull; Master Your Engineering Interviews
        </p>
      </div>
    </footer>
  );
}

