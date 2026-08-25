import { Request, Response } from 'express';
import * as productService from '../services/product.service';
import { asyncHandler } from '../utils/asyncHandler';

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const data = await productService.listProducts(req.query as never);
  res.json({ success: true, message: 'Products retrieved', data });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = await productService.getProductById(req.params.id);
  res.json({ success: true, message: 'Product retrieved', data });
});

export const getProductByBarcode = asyncHandler(async (req: Request, res: Response) => {
  const data = await productService.getProductByBarcode(req.params.barcode);
  res.json({ success: true, message: 'Product found', data });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = await productService.createProduct(req.body, req.user!.id);
  res.status(201).json({ success: true, message: 'Product created', data });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = await productService.updateProduct(req.params.id, req.body);
  res.json({ success: true, message: 'Product updated', data });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = await productService.deleteProduct(req.params.id);
  res.json({
    success: true,
    message: data.deleted ? 'Product deleted' : 'Product archived because it has sales history',
    data,
  });
});
