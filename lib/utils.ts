import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toggleItem = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((existing) => existing !== item) : [...list, item]);
