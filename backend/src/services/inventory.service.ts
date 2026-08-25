import { InventoryMovementType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { mapProduct } from './product.service';

async function getProductOrThrow(tx: Prisma.TransactionClient, productId: string) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });
  if (!product) throw new AppError('Product not found', 404);
  return product;
}

export async function addStock(productId: string, quantity: number, userId: string, reason?: string | null) {
  return prisma.$transaction(async (tx) => {
    const product = await getProductOrThrow(tx, productId);
    const previousStock = product.stock;
    const newStock = previousStock + quantity;

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
      include: { category: true },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        productId,
        type: InventoryMovementType.STOCK_ADDED,
        quantity,
        previousStock,
        newStock,
        reason: reason || 'Stock added',
        createdById: userId,
      },
    });

    return { product: mapProduct(updated), movement };
  });
}

export async function removeStock(productId: string, quantity: number, userId: string, reason?: string | null) {
  return prisma.$transaction(async (tx) => {
    const product = await getProductOrThrow(tx, productId);
    const previousStock = product.stock;

    if (quantity > previousStock) {
      throw new AppError(
        `Cannot remove ${quantity} units. Only ${previousStock} in stock.`,
        400
      );
    }

    const newStock = previousStock - quantity;

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
      include: { category: true },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        productId,
        type: InventoryMovementType.STOCK_REMOVED,
        quantity,
        previousStock,
        newStock,
        reason: reason || 'Stock removed',
        createdById: userId,
      },
    });

    return { product: mapProduct(updated), movement };
  });
}

export async function adjustStock(productId: string, newStock: number, userId: string, reason?: string | null) {
  if (newStock < 0) {
    throw new AppError('Stock cannot be negative', 400);
  }

  return prisma.$transaction(async (tx) => {
    const product = await getProductOrThrow(tx, productId);
    const previousStock = product.stock;
    const quantity = Math.abs(newStock - previousStock);

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
      include: { category: true },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        productId,
        type: InventoryMovementType.STOCK_ADJUSTMENT,
        quantity,
        previousStock,
        newStock,
        reason: reason || 'Stock adjusted',
        createdById: userId,
      },
    });

    return { product: mapProduct(updated), movement };
  });
}

export async function listMovements(query: {
  page: number;
  limit: number;
  productId?: string;
  type?: InventoryMovementType;
}) {
  const where: Prisma.InventoryMovementWhereInput = {};
  if (query.productId) where.productId = query.productId;
  if (query.type) where.type = query.type;

  const skip = (query.page - 1) * query.limit;

  const [total, movements] = await Promise.all([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, barcode: true, size: true, color: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
  ]);

  return {
    items: movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      product: m.product,
      type: m.type,
      quantity: m.quantity,
      previousStock: m.previousStock,
      newStock: m.newStock,
      reason: m.reason,
      createdById: m.createdById,
      createdBy: m.createdBy,
      createdAt: m.createdAt.toISOString(),
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}
