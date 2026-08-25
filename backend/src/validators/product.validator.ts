import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').trim(),
  categoryId: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  size: z.string().min(1, 'Size is required').trim(),
  color: z.string().min(1, 'Color is required').trim(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  purchasePrice: z.coerce.number().min(0).default(0),
  sellingPrice: z.coerce.number().positive('Selling price must be greater than 0'),
  stock: z.coerce.number().int().min(0).default(0),
  barcode: z.string().trim().optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'active', 'archived']).optional(),
}).refine((data) => Boolean(data.categoryId || data.category), {
  message: 'categoryId or category is required',
  path: ['categoryId'],
});

export const updateProductSchema = z.object({
  name: z.string().min(1).trim().optional(),
  categoryId: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  size: z.string().min(1).trim().optional(),
  color: z.string().min(1).trim().optional(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().positive().optional(),
  barcode: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'active', 'archived']).optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'active', 'archived', 'all']).optional(),
  lowStock: z.enum(['true', 'false']).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).trim().optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
