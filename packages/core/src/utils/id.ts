import { nanoid } from 'nanoid';

/**
 * Generate a unique ID for entities
 * Uses nanoid for URL-safe, unique IDs
 */
export function generateId(prefix?: string): string {
  const id = nanoid(12);
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate a short ID (8 characters)
 * Useful for display purposes
 */
export function generateShortId(): string {
  return nanoid(8);
}

/**
 * Validate that a string is a valid ID format
 */
export function isValidId(id: string): boolean {
  // Must be alphanumeric with optional underscores/hyphens
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length >= 6;
}

/**
 * Extract prefix from prefixed ID
 */
export function getIdPrefix(id: string): string | null {
  const parts = id.split('_');
  return parts.length > 1 ? parts[0] ?? null : null;
}
