import { z } from 'zod';

export const inventoryAddSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  reason: z.string().optional().nullable(),
});

export const inventoryRemoveSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  reason: z.string().optional().nullable(),
});

export const inventoryAdjustSchema = z.object({
  productId: z.string().min(1),
  newStock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  reason: z.string().optional().nullable(),
});

export const inventoryMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  productId: z.string().optional(),
  type: z
    .enum(['INITIAL_STOCK', 'STOCK_ADDED', 'STOCK_REMOVED', 'STOCK_ADJUSTMENT', 'SALE'])
    .optional(),
});
