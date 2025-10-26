import type { Variants, Transition } from "framer-motion";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const palette = {
  background: "#FAFAFA",
  backgroundDark: "#1C1C1E",
  surface: "#FFFFFF",
  surfaceDark: "#2C2C2E",
  primary: "#007AFF",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  textPrimary: "#1C1C1E",
  textPrimaryDark: "#FFFFFF",
  textSecondary: "#8E8E93",
  chart: ["#007AFF", "#5856D6", "#AF52DE", "#FF2D55"],
} as const;

export const glassSurface = {
  base:
    "glass-card border border-white/40 bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#2C2C2E]/80 dark:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
  interactive:
    "glass-card hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]",
};

export const surfaces = {
  panel:
    "surface-card border border-black/5 bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-white/5 dark:bg-[#1D1D1F]/80 dark:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
  muted:
    "rounded-2xl border border-black/5 bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-[#2C2C2E]/70",
  elevated:
    "rounded-3xl border border-black/5 bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-white/5 dark:bg-[#161618]/85 dark:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
};

const easeOutBack = [0.16, 1, 0.3, 1] as Transition["ease"];

export const transitions = {
  default: { duration: 0.5, ease: easeOutBack } satisfies Transition,
  subtle: { duration: 0.35, ease: easeOutBack } satisfies Transition,
};

export const motionVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  } satisfies Variants,
  fadeUp: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  } satisfies Variants,
  scaleIn: {
    hidden: { opacity: 0, scale: 0.96 },
    show: { opacity: 1, scale: 1 },
  } satisfies Variants,
  stagger: {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.08,
      },
    },
  } satisfies Variants,
  listItem: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  } satisfies Variants,
} as const;

export const chartConfig = {
  strokeWidth: 2.4,
  curveType: "monotoneX" as const,
  dotRadius: 4,
};

export const buttonStyles = {
  primary:
    "relative inline-flex items-center justify-center rounded-full bg-[#007AFF] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,122,255,0.2)] transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/40",
  secondary:
    "relative inline-flex items-center justify-center rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-[#1C1C1E] transition-transform duration-200 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/20 dark:border-white/10 dark:bg-[#2C2C2E]/80 dark:text-white",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
