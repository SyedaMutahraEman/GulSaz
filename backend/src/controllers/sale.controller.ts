import { Request, Response } from 'express';
import * as saleService from '../services/sale.service';
import { asyncHandler } from '../utils/asyncHandler';

export const createSale = asyncHandler(async (req: Request, res: Response) => {
  const data = await saleService.createSale(req.body, req.user!.id);
  res.status(201).json({ success: true, message: 'Sale completed', data });
});

export const listSales = asyncHandler(async (req: Request, res: Response) => {
  const data = await saleService.listSales(req.query as never, {
    id: req.user!.id,
    role: req.user!.role,
  });
  res.json({ success: true, message: 'Sales retrieved', data });
});

export const getSale = asyncHandler(async (req: Request, res: Response) => {
  const data = await saleService.getSaleById(req.params.id, {
    id: req.user!.id,
    role: req.user!.role,
  });
  res.json({ success: true, message: 'Sale retrieved', data });
});
