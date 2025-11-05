import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeListText(content: string): string {
  if (!content) return content;

  let result = content;
  result = result.replace(/(\d+\.\s*)(?=[A-Z0-9])/g, '\n$1');
  result = result.replace(/(\\-\s*)(?=[A-Z0-9])/g, '\n$1');
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
