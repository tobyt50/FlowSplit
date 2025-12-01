import * as React from 'react';
import { cn } from '../../lib/utils'; // Our utility for merging Tailwind CSS classes

// Define the props interface. It extends all standard HTML input attributes,
// making this component a fully-featured drop-in replacement for the <input> tag.
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * A reusable, themed input component for the FlowSplit application.
 *
 * It uses `React.forwardRef` to pass a ref down to the underlying DOM `input` element.
 * This is crucial for form libraries (like react-hook-form) that need direct access
 * to the input for state management and validation.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles for the input field, aligned with our design system.
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          // Styles for placeholder text.
          'placeholder:text-muted-foreground',
          // Styles for focus state, providing clear visual feedback for accessibility.
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // Styles for disabled state.
          'disabled:cursor-not-allowed disabled:opacity-50',
          // File input specific styles.
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          // Merge with any custom classes passed via props.
          className
        )}
        ref={ref} // Forward the ref to the input element.
        {...props} // Spread the rest of the props (e.g., value, onChange, placeholder).
      />
    );
  }
);
// Assigning a display name is a best practice for debugging React components.
Input.displayName = 'Input';

export { Input };