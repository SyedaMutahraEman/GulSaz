import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { mapSettings } from '../services/auth.service';

export const updateSettingsSchema = z.object({
  brandName: z.string().min(1).trim(),
  tagline: z.string().trim(),
  address: z.string().trim(),
  phone: z.string().trim(),
  email: z.string().email(),
  currencySymbol: z.string().min(1).trim(),
  currencyCode: z.string().min(1).trim(),
  taxRatePercent: z.coerce.number().min(0).max(100),
  taxNumber: z.string().optional().nullable(),
  receiptFooterMessage: z.string().trim(),
});

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.storeSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  if (!settings) throw new AppError('Store settings not configured', 404);

  res.json({
    success: true,
    message: 'Settings retrieved',
    data: mapSettings(settings),
  });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.storeSettings.findFirst({ orderBy: { updatedAt: 'desc' } });

  const payload = {
    brandName: req.body.brandName,
    tagline: req.body.tagline,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
    currencySymbol: req.body.currencySymbol,
    currencyCode: req.body.currencyCode,
    taxRatePercent: req.body.taxRatePercent,
    taxNumber: req.body.taxNumber || null,
    receiptFooterMessage: req.body.receiptFooterMessage,
  };

  const settings = existing
    ? await prisma.storeSettings.update({ where: { id: existing.id }, data: payload })
    : await prisma.storeSettings.create({ data: payload });

  res.json({
    success: true,
    message: 'Settings updated',
    data: mapSettings(settings),
  });
});
