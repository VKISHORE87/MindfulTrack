import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse JSON strings, returning defaultValue if parsing fails.
 * Useful for handling potentially invalid JSON responses from APIs.
 *
 * @param jsonString - The JSON string to parse
 * @param defaultValue - Value to return if parsing fails
 * @returns Parsed JSON object or defaultValue
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return defaultValue;
  }
}
