'use client'; // This component MUST be a client component

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';

/**
 * We define a new type for our specific ThemeProvider component's props.
 * This correctly combines the configuration props from the `next-themes` library
 * with React's own `children` prop.
 */
type Props = ThemeProviderProps & {
  children: React.ReactNode;
};

/**
 * The ThemeProvider is a client-side component that wraps the entire application.
 * It leverages the `next-themes` library to manage and persist the user's
 * preferred color scheme (light/dark mode).
 */
export function ThemeProvider({ children, ...props }: Props) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}