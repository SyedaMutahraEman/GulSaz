import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { hashPassword, sanitizeUser } from '../services/auth.service';

export const createUserSchema = z.object({
  name: z.string().min(1).trim(),
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'admin', 'employee']).default('EMPLOYEE'),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).trim().optional(),
  email: z
    .string()
    .email()
    .transform((v) => v.trim().toLowerCase())
    .optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'admin', 'employee']).optional(),
  isActive: z.boolean().optional(),
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({
    success: true,
    message: 'Users retrieved',
    data: users.map((u) => sanitizeUser(u)),
  });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, message: 'User retrieved', data: sanitizeUser(user) });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const hashed = await hashPassword(req.body.password);
  const role = String(req.body.role || 'EMPLOYEE').toUpperCase() as Role;

  const user = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      password: hashed,
      role,
      isActive: req.body.isActive ?? true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'User created',
    data: sanitizeUser(user),
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('User not found', 404);

  const data: {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
    isActive?: boolean;
  } = {};

  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.email !== undefined) data.email = req.body.email;
  if (req.body.isActive !== undefined) data.isActive = req.body.isActive;
  if (req.body.role !== undefined) data.role = String(req.body.role).toUpperCase() as Role;
  if (req.body.password) data.password = await hashPassword(req.body.password);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
  });

  res.json({ success: true, message: 'User updated', data: sanitizeUser(user) });
});
