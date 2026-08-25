import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { toNumber } from '../utils/invoice';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';
import { ensureBarcodeAvailable, generateUniqueBarcode } from './barcode.service';

type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

function normalizeStatus(status?: string | null): ProductStatus | undefined {
  if (!status) return undefined;
  const upper = status.toUpperCase();
  if (upper === 'ACTIVE' || upper === 'ARCHIVED') return upper as ProductStatus;
  return undefined;
}

export function mapProduct(product: ProductWithCategory) {
  return {
    id: product.id,
    name: product.name,
    categoryId: product.categoryId,
    category: product.category.name,
    size: product.size,
    color: product.color,
    description: product.description ?? undefined,
    image: product.image ?? undefined,
    purchasePrice: toNumber(product.purchasePrice),
    sellingPrice: toNumber(product.sellingPrice),
    stock: product.stock,
    barcode: product.barcode,
    status: product.status.toLowerCase() as 'active' | 'archived',
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

async function resolveCategoryId(input: { categoryId?: string; category?: string }) {
  if (input.categoryId) {
    const byId = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!byId) throw new AppError('Category not found', 404);
    return byId.id;
  }

  if (input.category) {
    const byName = await prisma.category.findUnique({ where: { name: input.category } });
    if (!byName) throw new AppError(`Category "${input.category}" not found`, 404);
    return byName.id;
  }

  throw new AppError('categoryId or category is required', 400);
}

export async function listProducts(query: {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  category?: string;
  status?: string;
  lowStock?: string;
}) {
  const where: Prisma.ProductWhereInput = {};

  if (query.search) {
    const q = query.search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { barcode: { contains: q, mode: 'insensitive' } },
      { color: { contains: q, mode: 'insensitive' } },
      { size: { contains: q, mode: 'insensitive' } },
      { category: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  } else if (query.category) {
    where.category = { name: query.category };
  }

  const status = normalizeStatus(query.status === 'all' ? undefined : query.status);
  if (status) {
    where.status = status;
  }

  if (query.lowStock === 'true') {
    where.stock = { lte: 5 };
  }

  const skip = (query.page - 1) * query.limit;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
  ]);

  return {
    items: products.map(mapProduct),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) throw new AppError('Product not found', 404);
  return mapProduct(product);
}

export async function getProductByBarcode(barcode: string) {
  const clean = barcode.trim();
  const product = await prisma.product.findFirst({
    where: {
      barcode: clean,
      status: ProductStatus.ACTIVE,
    },
    include: { category: true },
  });

  if (!product) {
    throw new AppError(`No active product found for barcode: ${clean}`, 404);
  }

  return mapProduct(product);
}

export async function createProduct(input: CreateProductInput, userId: string) {
  const categoryId = await resolveCategoryId(input);

  let barcode = input.barcode?.trim() || '';
  if (barcode) {
    await ensureBarcodeAvailable(barcode);
  } else {
    barcode = await generateUniqueBarcode();
  }

  const status = normalizeStatus(input.status) ?? ProductStatus.ACTIVE;
  const initialStock = input.stock ?? 0;

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: input.name,
        categoryId,
        size: input.size,
        color: input.color,
        description: input.description || null,
        image: input.image || null,
        purchasePrice: input.purchasePrice ?? 0,
        sellingPrice: input.sellingPrice,
        stock: initialStock,
        barcode,
        status,
      },
      include: { category: true },
    });

    if (initialStock > 0) {
      await tx.inventoryMovement.create({
        data: {
          productId: created.id,
          type: 'INITIAL_STOCK',
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          reason: 'Initial stock on product creation',
          createdById: userId,
        },
      });
    }

    return created;
  });

  return mapProduct(product);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError('Product not found', 404);

  let categoryId: string | undefined;
  if (input.categoryId || input.category) {
    categoryId = await resolveCategoryId(input);
  }

  if (input.barcode) {
    await ensureBarcodeAvailable(input.barcode.trim(), id);
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      categoryId,
      size: input.size,
      color: input.color,
      description: input.description === undefined ? undefined : input.description || null,
      image: input.image === undefined ? undefined : input.image || null,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      barcode: input.barcode?.trim(),
      status: normalizeStatus(input.status),
    },
    include: { category: true },
  });

  return mapProduct(updated);
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { saleItems: true } } },
  });

  if (!existing) throw new AppError('Product not found', 404);

  if (existing._count.saleItems > 0) {
    // Soft-archive instead of hard delete to preserve sales history
    const archived = await prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
      include: { category: true },
    });
    return { deleted: false, archived: true, product: mapProduct(archived) };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventoryMovement.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
  });

  return { deleted: true, archived: false };
}
