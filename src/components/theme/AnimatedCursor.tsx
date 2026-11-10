'use client';

import SplashCursor from '@/components/SplashCursor';
import { useTheme } from './ThemeProvider';

export function AnimatedCursor() {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  return (
    <SplashCursor
      colors={[isDarkTheme ? '#000000' : '#ef476f']}
      rainbow={false}
      colorSpeed={0}
      intensity={0.9}
      size={0.8}
      force={0.7}
      swirl={3}
      trail={1.2}
      momentum={0.8}
      shading={0.8}
      quality="medium"
      clickSplash
      intro={false}
      // The light shader renders black absorbing ink; the dark shader renders the pink-red color directly.
      theme={isDarkTheme ? 'light' : 'dark'}
      zIndex={50}
    />
  );
}
