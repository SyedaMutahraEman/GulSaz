import { Request, Response } from 'express';
import { InventoryMovementType } from '@prisma/client';
import * as inventoryService from '../services/inventory.service';
import { asyncHandler } from '../utils/asyncHandler';

export const listMovements = asyncHandler(async (req: Request, res: Response) => {
  const data = await inventoryService.listMovements({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 25,
    productId: req.query.productId as string | undefined,
    type: req.query.type as InventoryMovementType | undefined,
  });
  res.json({ success: true, message: 'Inventory movements retrieved', data });
});

export const addStock = asyncHandler(async (req: Request, res: Response) => {
  const data = await inventoryService.addStock(
    req.body.productId,
    req.body.quantity,
    req.user!.id,
    req.body.reason
  );
  res.json({ success: true, message: 'Stock added', data });
});

export const removeStock = asyncHandler(async (req: Request, res: Response) => {
  const data = await inventoryService.removeStock(
    req.body.productId,
    req.body.quantity,
    req.user!.id,
    req.body.reason
  );
  res.json({ success: true, message: 'Stock removed', data });
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const data = await inventoryService.adjustStock(
    req.body.productId,
    req.body.newStock,
    req.user!.id,
    req.body.reason
  );
  res.json({ success: true, message: 'Stock adjusted', data });
});
