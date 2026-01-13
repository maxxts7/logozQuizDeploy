/**
 * Centralized theme configuration for LogosQuiz
 * All colors, spacing, and common styles are defined here for easy theme changes
 */

export const colors = {
  // Primary brand color (blue)
  primary: {
    50: 'bg-blue-50',
    500: 'bg-blue-500',
    600: 'bg-blue-600',
    700: 'bg-blue-700',
  },
  primaryText: {
    50: 'text-blue-50',
    500: 'text-blue-500',
    600: 'text-blue-600',
    700: 'text-blue-700',
  },
  primaryBorder: {
    500: 'border-blue-500',
    600: 'border-blue-600',
  },
  primaryRing: {
    500: 'ring-blue-500',
    600: 'ring-blue-600',
  },

  // Error/Danger color (red)
  error: {
    50: 'bg-red-50',
    200: 'bg-red-200',
    600: 'bg-red-600',
    700: 'bg-red-700',
  },
  errorText: {
    600: 'text-red-600',
    700: 'text-red-700',
  },
  errorBorder: {
    200: 'border-red-200',
    600: 'border-red-600',
  },

  // Success color (green)
  success: {
    50: 'bg-green-50',
    600: 'bg-green-600',
    700: 'bg-green-700',
  },
  successText: {
    600: 'text-green-600',
    700: 'text-green-700',
  },

  // Warning color (yellow)
  warning: {
    50: 'bg-yellow-50',
    600: 'bg-yellow-600',
  },
  warningText: {
    600: 'text-yellow-600',
  },

  // Neutral/Gray colors
  gray: {
    50: 'bg-gray-50',
    200: 'bg-gray-200',
    300: 'bg-gray-300',
    600: 'bg-gray-600',
    700: 'bg-gray-700',
    900: 'bg-gray-900',
  },
  grayText: {
    50: 'text-gray-50',
    200: 'text-gray-200',
    300: 'text-gray-300',
    600: 'text-gray-600',
    700: 'text-gray-700',
    900: 'text-gray-900',
  },
  grayBorder: {
    200: 'border-gray-200',
    300: 'border-gray-300',
  },

  // Special colors
  white: 'bg-white',
  whiteText: 'text-white',
} as const;

/**
 * Common spacing values used throughout the app
 */
export const spacing = {
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',

  // Padding X (horizontal)
  px: {
    xs: 'px-2',
    sm: 'px-3',
    md: 'px-4',
    lg: 'px-6',
    xl: 'px-8',
  },

  // Padding Y (vertical)
  py: {
    xs: 'py-2',
    sm: 'py-3',
    md: 'py-4',
    lg: 'py-6',
    xl: 'py-8',
  },

  // Margins
  m: {
    xs: 'm-2',
    sm: 'm-3',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
  },

  // Margin bottom
  mb: {
    1: 'mb-1',
    2: 'mb-2',
    4: 'mb-4',
    6: 'mb-6',
    8: 'mb-8',
  },
} as const;

/**
 * Common component styles to ensure consistency
 */
export const componentStyles = {
  // Button variants
  button: {
    primary: `${colors.primary[600]} ${colors.whiteText} hover:${colors.primary[700]} focus:outline-none focus:${colors.primaryRing[500]} focus:ring-2`,
    secondary: `${colors.grayBorder[300]} ${colors.grayText[700]} hover:${colors.gray[50]} border`,
    danger: `${colors.error[600]} ${colors.whiteText} hover:${colors.error[700]}`,
    outline: `border ${colors.primaryBorder[600]} ${colors.primaryText[600]} hover:${colors.primary[50]}`,
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  },

  // Form input styles
  input: {
    base: `w-full ${spacing.px.sm} ${spacing.py.xs} border ${colors.grayBorder[300]} rounded-md focus:outline-none focus:ring-2 focus:${colors.primaryRing[500]}`,
    error: `border-${colors.errorBorder[600]} focus:${colors.errorBorder[600]}`,
  },

  // Checkbox/Radio styles
  checkbox: {
    base: `w-4 h-4 ${colors.primaryText[600]} focus:${colors.primaryRing[500]}`,
  },

  // Alert/Error message styles
  alert: {
    error: `${colors.error[50]} border ${colors.errorBorder[200]} ${colors.errorText[700]} ${spacing.px.md} ${spacing.py.sm} rounded`,
    success: `${colors.success[50]} ${colors.successText[700]} ${spacing.px.md} ${spacing.py.sm} rounded`,
    warning: `${colors.warning[50]} ${colors.warningText[600]} ${spacing.px.md} ${spacing.py.sm} rounded`,
  },

  // Label styles
  label: {
    base: `block text-sm font-medium ${colors.grayText[700]}`,
  },

  // Heading styles
  heading: {
    h1: `text-3xl font-bold ${colors.grayText[900]}`,
    h2: `text-2xl font-bold ${colors.grayText[900]}`,
    h3: `text-xl font-bold ${colors.grayText[900]}`,
  },
} as const;

/**
 * Border radius values
 */
export const borderRadius = {
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

/**
 * Helper function to combine class names
 * Useful for merging theme classes with component-specific classes
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
