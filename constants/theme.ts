/**
 * Quizzory Design System - Theme Constants
 *
 * This file contains all design tokens and component style definitions.
 * Uses a refined, sophisticated design language with subtle depth and rich interactions.
 */

// ============================================
// Color Palette - Slate-based with Blue Accent
// ============================================

export const colors = {
  // Background colors
  background: {
    default: "bg-slate-50",
    alt: "bg-slate-100",
    surface: "bg-white",
  },

  // Text colors
  text: {
    primary: "text-slate-900",
    secondary: "text-slate-600",
    muted: "text-slate-500",
    placeholder: "text-slate-400",
    inverse: "text-white",
  },

  // Accent - Blue
  accent: {
    bg: "bg-blue-600",
    bgHover: "hover:bg-blue-700",
    bgLight: "bg-blue-50",
    bgMuted: "bg-blue-100",
    text: "text-blue-600",
    textHover: "hover:text-blue-700",
    border: "border-blue-600",
    borderLight: "border-blue-200",
  },

  // Success - Emerald
  success: {
    bg: "bg-emerald-600",
    bgLight: "bg-emerald-50",
    bgMuted: "bg-emerald-100",
    text: "text-emerald-600",
    textDark: "text-emerald-700",
    border: "border-emerald-200",
  },

  // Error - Red/Rose
  error: {
    bg: "bg-red-600",
    bgLight: "bg-red-50",
    bgMuted: "bg-red-100",
    text: "text-red-600",
    textDark: "text-red-700",
    border: "border-red-200",
  },

  // Warning - Amber
  warning: {
    bg: "bg-amber-500",
    bgLight: "bg-amber-50",
    bgMuted: "bg-amber-100",
    text: "text-amber-600",
    textDark: "text-amber-700",
    border: "border-amber-200",
  },

  // Border colors
  border: {
    default: "border-slate-200",
    light: "border-slate-100",
    dark: "border-slate-300",
  },
} as const

// ============================================
// Shadow System
// ============================================

export const shadows = {
  xs: "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
  sm: "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
  default: "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.07),0_2px_4px_-1px_rgba(0,0,0,0.04)]",
  md: "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-2px_rgba(0,0,0,0.04)]",
  lg: "shadow-[0_20px_25px_-5px_rgba(0,0,0,0.08),0_10px_10px_-5px_rgba(0,0,0,0.03)]",
  xl: "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]",
} as const

// ============================================
// Component Styles
// ============================================

export const componentStyles = {
  // Button variants
  button: {
    base: "inline-flex items-center justify-center gap-2 font-medium text-sm rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",

    primary: "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800",

    secondary: "bg-white text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100",

    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",

    danger: "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800",

    success: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm hover:from-emerald-600 hover:to-emerald-700",

    outline: "bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50 active:bg-blue-100",

    // Sizes
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5",
    lg: "px-6 py-3 text-base",
  },

  // Input styles
  input: {
    base: "w-full px-3.5 py-2.5 text-[15px] bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70",
    error: "border-red-500 focus:border-red-500 focus:ring-red-500/20",
  },

  // Select styles
  select: {
    base: "w-full px-3.5 py-2.5 text-[15px] bg-white border border-slate-200 rounded-lg text-slate-900 transition-all duration-150 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed cursor-pointer appearance-none",
  },

  // Textarea styles
  textarea: {
    base: "w-full px-3.5 py-2.5 text-[15px] bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed resize-none",
  },

  // Card styles
  card: {
    base: "bg-white rounded-xl border border-slate-200 shadow-sm transition-shadow duration-150",
    hover: "hover:shadow-md",
    padding: "p-6",
    paddingSm: "p-4",
  },

  // Alert/Message styles
  alert: {
    base: "p-4 rounded-lg border text-sm",
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  },

  // Badge styles
  badge: {
    base: "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full",
    default: "bg-slate-100 text-slate-600",
    primary: "bg-blue-100 text-blue-700",
    success: "bg-emerald-100 text-emerald-700",
    error: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
  },

  // Label styles
  label: {
    base: "block text-sm font-medium text-slate-700 mb-1.5",
    required: "after:content-['*'] after:ml-0.5 after:text-red-500",
  },

  // Link styles
  link: {
    base: "text-blue-600 hover:text-blue-700 transition-colors duration-150",
    underline: "underline underline-offset-2 decoration-blue-300 hover:decoration-blue-500",
  },

  // Checkbox/Radio styles
  checkbox: {
    base: "w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500/50 focus:ring-2 cursor-pointer",
  },

  radio: {
    base: "w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500/50 focus:ring-2 cursor-pointer",
  },

  // Modal/Dialog styles
  modal: {
    overlay: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50",
    content: "bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden",
  },

  // Table styles
  table: {
    wrapper: "overflow-x-auto rounded-lg border border-slate-200",
    base: "min-w-full divide-y divide-slate-200",
    header: "bg-slate-50",
    headerCell: "px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider",
    body: "bg-white divide-y divide-slate-100",
    cell: "px-6 py-4 whitespace-nowrap text-sm text-slate-900",
    cellMuted: "px-6 py-4 whitespace-nowrap text-sm text-slate-500",
  },
} as const

// ============================================
// Typography
// ============================================

export const typography = {
  heading: {
    h1: "text-3xl font-bold text-slate-900 tracking-tight",
    h2: "text-2xl font-semibold text-slate-900 tracking-tight",
    h3: "text-xl font-semibold text-slate-900",
    h4: "text-lg font-semibold text-slate-900",
  },
  body: {
    default: "text-base text-slate-600",
    small: "text-sm text-slate-500",
    xs: "text-xs text-slate-500",
  },
} as const

// ============================================
// Spacing
// ============================================

export const spacing = {
  section: "space-y-6",
  content: "space-y-4",
  tight: "space-y-2",

  padding: {
    page: "px-4 sm:px-6 lg:px-8 py-6",
    section: "p-6",
    card: "p-6",
    cardSm: "p-4",
  },

  gap: {
    xs: "gap-2",
    sm: "gap-3",
    default: "gap-4",
    lg: "gap-6",
  },
} as const

// ============================================
// Border Radius
// ============================================

export const borderRadius = {
  sm: "rounded",
  default: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  full: "rounded-full",
} as const

// ============================================
// Utility Functions
// ============================================

/**
 * Combines class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}

/**
 * Creates a button class string from variants
 */
export function buttonClass(
  variant: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline" = "primary",
  size: "sm" | "md" | "lg" = "md"
): string {
  return cn(
    componentStyles.button.base,
    componentStyles.button[variant],
    componentStyles.button[size]
  )
}

/**
 * Creates an input class string with optional error state
 */
export function inputClass(hasError: boolean = false): string {
  return cn(
    componentStyles.input.base,
    hasError && componentStyles.input.error
  )
}

/**
 * Creates a card class string with optional hover effect
 */
export function cardClass(options?: { hover?: boolean; padding?: "default" | "sm" | "none" }): string {
  const { hover = false, padding = "default" } = options || {}
  return cn(
    componentStyles.card.base,
    hover && componentStyles.card.hover,
    padding === "default" && componentStyles.card.padding,
    padding === "sm" && componentStyles.card.paddingSm
  )
}

/**
 * Creates a badge class string from variant
 */
export function badgeClass(variant: "default" | "primary" | "success" | "error" | "warning" = "default"): string {
  return cn(componentStyles.badge.base, componentStyles.badge[variant])
}

/**
 * Creates an alert class string from variant
 */
export function alertClass(variant: "error" | "success" | "warning" | "info"): string {
  return cn(componentStyles.alert.base, componentStyles.alert[variant])
}
