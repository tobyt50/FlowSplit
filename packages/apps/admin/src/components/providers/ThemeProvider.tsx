'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';

/**
 * This is the corrected type for our wrapper component's props.
 * It combines the library's configuration props (`ThemeProviderProps`)
 * with React's standard `children` prop. This is the explicit and
 * type-safe way to define a wrapper component.
 */
type CustomThemeProviderProps = ThemeProviderProps & {
  children: React.ReactNode;
};

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  // With the corrected type above:
  // - `children` is correctly identified as React.ReactNode.
  // - `...props` is correctly identified as ThemeProviderProps.
  // The TypeScript error is now resolved at its source.
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}