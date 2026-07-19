import { Prisma } from '@prisma/client';

/**
 * Extracts string bullet points from a Prisma Json field.
 * Returns null if the value is not an array.
 */
export function extractBullets(
  aiBullets: Prisma.JsonValue | null,
): string[] | null {
  return Array.isArray(aiBullets)
    ? aiBullets.filter((item): item is string => typeof item === 'string')
    : null;
}
