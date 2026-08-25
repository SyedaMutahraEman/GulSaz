import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  res.json({
    success: true,
    message: 'Categories retrieved',
    data: categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
      isActive: c.isActive,
      productCount: c._count.products,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw new AppError('Category not found', 404);

  res.json({
    success: true,
    message: 'Category retrieved',
    data: {
      id: category.id,
      name: category.name,
      description: category.description ?? undefined,
      isActive: category.isActive,
      productCount: category._count.products,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    },
  });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await prisma.category.create({
    data: {
      name: req.body.name,
      description: req.body.description || null,
      isActive: req.body.isActive ?? true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Category created',
    data: {
      id: category.id,
      name: category.name,
      description: category.description ?? undefined,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    },
  });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Category not found', 404);

  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      description: req.body.description === undefined ? undefined : req.body.description || null,
      isActive: req.body.isActive,
    },
  });

  res.json({
    success: true,
    message: 'Category updated',
    data: {
      id: category.id,
      name: category.name,
      description: category.description ?? undefined,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    },
  });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) throw new AppError('Category not found', 404);

  if (category._count.products > 0) {
    throw new AppError(
      `Cannot delete category "${category.name}" because it still contains ${category._count.products} product(s)`,
      400
    );
  }

  await prisma.category.delete({ where: { id: req.params.id } });

  res.json({
    success: true,
    message: 'Category deleted',
    data: null,
  });
});
