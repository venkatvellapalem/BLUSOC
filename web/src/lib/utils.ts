import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toISOString().replace("T", " ").substring(0, 19) + " UTC";
  } catch {
    return isoString;
  }
}
