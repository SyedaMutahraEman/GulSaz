import { z } from 'zod';

export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1, 'Cart must contain at least one item'),
  discount: z.coerce.number().min(0).optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  paymentMethod: z.enum(['cash', 'card', 'online', 'CASH', 'CARD', 'ONLINE']),
  amountPaid: z.coerce.number().min(0),
  notes: z.string().optional().nullable(),
});

export const saleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  employeeId: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'online', 'CASH', 'CARD', 'ONLINE', 'all']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
