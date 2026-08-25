import { randomInt } from 'crypto';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

/**
 * Generates a unique 12-digit retail-style barcode (prefix 890 + 9 digits).
 * Uniqueness is verified against the database; crypto random is used (not Math.random alone).
 */
export async function generateUniqueBarcode(maxAttempts = 50): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const digits = randomInt(100_000_000, 1_000_000_000).toString();
    const barcode = `890${digits}`;

    const existing = await prisma.product.findUnique({
      where: { barcode },
      select: { id: true },
    });

    if (!existing) {
      return barcode;
    }
  }

  // Timestamp + random fallback, still checked for uniqueness
  for (let attempt = 0; attempt < 20; attempt++) {
    const barcode = `890${Date.now().toString().slice(-7)}${randomInt(10, 99)}`;
    const existing = await prisma.product.findUnique({
      where: { barcode },
      select: { id: true },
    });
    if (!existing) return barcode;
  }

  throw new AppError('Unable to generate a unique barcode. Please try again.', 500);
}

export async function ensureBarcodeAvailable(barcode: string, excludeProductId?: string) {
  const existing = await prisma.product.findUnique({ where: { barcode } });
  if (existing && existing.id !== excludeProductId) {
    throw new AppError('Barcode already exists', 409);
  }
}
