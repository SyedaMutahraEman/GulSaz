import { Request, Response, Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { toNumber } from '../utils/invoice';
import { mapProduct } from '../services/product.service';
import { mapSale } from '../services/sale.service';

const router = Router();

router.get(
  '/',
  authenticate,
  adminOnly,
  asyncHandler(async (_req: Request, res: Response) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      stockAgg,
      lowStockCount,
      outOfStockCount,
      totalSalesCount,
      revenueAgg,
      todaySalesCount,
      todayRevenueAgg,
      recentProducts,
      recentSales,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.aggregate({ _sum: { stock: true } }),
      prisma.product.count({ where: { stock: { gt: 0, lte: 5 } } }),
      prisma.product.count({ where: { stock: { lte: 0 } } }),
      prisma.sale.count(),
      prisma.sale.aggregate({ _sum: { total: true } }),
      prisma.sale.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfToday } },
        _sum: { total: true },
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          employee: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'Dashboard data retrieved',
      data: {
        totalProducts,
        totalStockQuantity: stockAgg._sum.stock ?? 0,
        lowStockCount,
        outOfStockCount,
        stockAlertCount: lowStockCount + outOfStockCount,
        totalSales: totalSalesCount,
        totalRevenue: toNumber(revenueAgg._sum.total),
        todaySalesCount,
        todayRevenue: toNumber(todayRevenueAgg._sum.total),
        recentProducts: recentProducts.map(mapProduct),
        recentSales: recentSales.map(mapSale),
      },
    });
  })
);

export default router;
