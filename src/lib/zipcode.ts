/**
 * Utility functions for ZIP code validation and formatting
 */

/**
 * Validates if a string is a valid 5-digit US ZIP code
 * @param zipCode - The ZIP code string to validate
 * @returns boolean - True if valid ZIP code, false otherwise
 */
export function isValidZipCode(zipCode: string): boolean {
  return /^\d{5}$/.test(zipCode);
}

/**
 * Formats a ZIP code string by removing non-numeric characters and limiting to 5 digits
 * @param input - The input string to format
 * @returns string - Formatted ZIP code (up to 5 digits)
 */
export function formatZipCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, 5);
}

/**
 * Validates and formats a ZIP code input
 * @param input - The raw input string
 * @returns object - { isValid: boolean, formatted: string }
 */
export function validateAndFormatZipCode(input: string): { isValid: boolean; formatted: string } {
  const formatted = formatZipCode(input);
  return {
    isValid: isValidZipCode(formatted),
    formatted
  };
}
