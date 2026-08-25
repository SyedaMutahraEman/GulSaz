import { InventoryMovementType, PaymentMethod, Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { formatInvoiceNumber, roundMoney, toNumber } from '../utils/invoice';
import { CreateSaleInput } from '../validators/sale.validator';

function normalizePaymentMethod(method: string): PaymentMethod {
  return method.toUpperCase() as PaymentMethod;
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const seq = await tx.invoiceSequence.upsert({
    where: { id: 1 },
    create: { id: 1, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });

  return formatInvoiceNumber(seq.lastValue);
}

export function mapSale(
  sale: Prisma.SaleGetPayload<{
    include: { items: true; employee: { select: { id: true; name: true; email: true } } };
  }>
) {
  return {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    employeeId: sale.employeeId,
    employeeName: sale.employee.name,
    items: sale.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      barcode: item.barcode,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
      total: toNumber(item.total),
    })),
    subtotal: toNumber(sale.subtotal),
    discount: toNumber(sale.discount),
    discountPercent: sale.discountPercent !== null ? toNumber(sale.discountPercent) : undefined,
    total: toNumber(sale.total),
    paymentMethod: sale.paymentMethod.toLowerCase() as 'cash' | 'card' | 'online',
    amountPaid: toNumber(sale.amountPaid),
    change: toNumber(sale.change),
    notes: sale.notes ?? undefined,
    createdAt: sale.createdAt.toISOString(),
  };
}

export async function createSale(input: CreateSaleInput, employeeId: string) {
  // Aggregate quantities if same product appears multiple times
  const quantityByProduct = new Map<string, number>();
  for (const item of input.items) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) || 0) + item.quantity);
  }

  const productIds = [...quantityByProduct.keys()];

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = productIds.find((id) => !found.has(id));
      throw new AppError(`Product not found: ${missing}`, 404);
    }

    let subtotal = 0;
    const lineItems: Array<{
      productId: string;
      productName: string;
      barcode: string;
      size: string;
      color: string;
      quantity: number;
      unitPrice: number;
      total: number;
      previousStock: number;
      newStock: number;
    }> = [];

    for (const product of products) {
      if (product.status !== ProductStatus.ACTIVE) {
        throw new AppError(`Product "${product.name}" is not active`, 400);
      }

      const qty = quantityByProduct.get(product.id)!;
      if (product.stock < qty) {
        throw new AppError(
          `Insufficient stock for "${product.name}" (${product.size}/${product.color}). Only ${product.stock} available, tried to sell ${qty}.`,
          400
        );
      }

      const unitPrice = toNumber(product.sellingPrice);
      const lineTotal = roundMoney(unitPrice * qty);
      subtotal = roundMoney(subtotal + lineTotal);

      lineItems.push({
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        size: product.size,
        color: product.color,
        quantity: qty,
        unitPrice,
        total: lineTotal,
        previousStock: product.stock,
        newStock: product.stock - qty,
      });
    }

    let discount = 0;
    if (input.discountPercent && input.discountPercent > 0) {
      discount = roundMoney((subtotal * input.discountPercent) / 100);
    } else if (input.discount && input.discount > 0) {
      discount = roundMoney(Math.min(subtotal, input.discount));
    }

    const total = roundMoney(Math.max(0, subtotal - discount));
    const paymentMethod = normalizePaymentMethod(input.paymentMethod);
    const amountPaid = roundMoney(input.amountPaid);

    if (paymentMethod === PaymentMethod.CASH && amountPaid < total) {
      throw new AppError('Amount paid is less than total', 400);
    }

    const effectivePaid = paymentMethod === PaymentMethod.CASH ? amountPaid : total;
    const change = roundMoney(Math.max(0, effectivePaid - total));

    let invoiceNumber = await nextInvoiceNumber(tx);
    let sale;

    // Handle rare invoice collisions via uniqueness constraint
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        sale = await tx.sale.create({
          data: {
            invoiceNumber,
            employeeId,
            subtotal,
            discount,
            discountPercent: input.discountPercent && input.discountPercent > 0 ? input.discountPercent : null,
            total,
            paymentMethod,
            amountPaid: effectivePaid,
            change,
            notes: input.notes || null,
            items: {
              create: lineItems.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                barcode: item.barcode,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
              })),
            },
          },
          include: {
            items: true,
            employee: { select: { id: true, name: true, email: true } },
          },
        });
        break;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          invoiceNumber = await nextInvoiceNumber(tx);
          continue;
        }
        throw err;
      }
    }

    if (!sale) {
      throw new AppError('Failed to generate unique invoice number', 500);
    }

    for (const item of lineItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: item.newStock },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: InventoryMovementType.SALE,
          quantity: item.quantity,
          previousStock: item.previousStock,
          newStock: item.newStock,
          reason: `Sale ${sale.invoiceNumber}`,
          createdById: employeeId,
        },
      });
    }

    return mapSale(sale);
  });
}

export async function listSales(
  query: {
    page: number;
    limit: number;
    search?: string;
    employeeId?: string;
    paymentMethod?: string;
    from?: string;
    to?: string;
  },
  requester: { id: string; role: string }
) {
  const where: Prisma.SaleWhereInput = {};

  // Employees only see their own sales
  if (requester.role === 'EMPLOYEE') {
    where.employeeId = requester.id;
  } else if (query.employeeId) {
    where.employeeId = query.employeeId;
  }

  if (query.paymentMethod && query.paymentMethod !== 'all') {
    where.paymentMethod = normalizePaymentMethod(query.paymentMethod);
  }

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) {
      const toDate = new Date(query.to);
      if (query.to.length <= 10) {
        toDate.setHours(23, 59, 59, 999);
      }
      where.createdAt.lte = toDate;
    }
  }

  if (query.search) {
    const q = query.search.trim();
    where.OR = [
      { invoiceNumber: { contains: q, mode: 'insensitive' } },
      { employee: { name: { contains: q, mode: 'insensitive' } } },
      { items: { some: { productName: { contains: q, mode: 'insensitive' } } } },
      { items: { some: { barcode: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      include: {
        items: true,
        employee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
  ]);

  return {
    items: sales.map(mapSale),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getSaleById(id: string, requester: { id: string; role: string }) {
  const sale = await prisma.sale.findFirst({
    where: {
      OR: [{ id }, { invoiceNumber: id }],
    },
    include: {
      items: true,
      employee: { select: { id: true, name: true, email: true } },
    },
  });

  if (!sale) throw new AppError('Sale not found', 404);

  if (requester.role === 'EMPLOYEE' && sale.employeeId !== requester.id) {
    throw new AppError('You do not have access to this sale', 403);
  }

  return mapSale(sale);
}
