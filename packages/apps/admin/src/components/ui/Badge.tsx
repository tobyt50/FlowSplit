import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Defines the visual styles for the different badge variants.
 * Each variant maps to a specific color combination from our theme.
 * - `default`: Primary theme color (teal)
 * - `secondary`: Muted, secondary color
 * - `destructive`: Warning/error color (amber)
 * - `outline`: A simple bordered style
 */
const badgeVariants = cva(
  // Base classes applied to all variants
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Define the props interface for the component.
// It includes all standard div attributes plus our custom 'variant' prop.
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * The Badge component.
 * It uses the cn utility to merge the base styles, variant styles,
 * and any custom className passed in props.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };