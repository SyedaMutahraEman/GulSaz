import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { LoginInput, RegisterInput } from '../validators/auth.validator';
import { toNumber } from '../utils/invoice';

const SALT_ROUNDS = 10;

export function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase() as 'admin' | 'employee',
    isActive: user.isActive,
    storeName: undefined as string | undefined,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}

async function issueToken(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const settings = await prisma.storeSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  const safeUser = sanitizeUser(user);
  safeUser.storeName = settings?.brandName;

  return { user: safeUser, token };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError('An account with this email already exists. Please sign in instead.', 409);
  }

  const role = input.role.toUpperCase() === 'ADMIN' ? Role.ADMIN : Role.EMPLOYEE;
  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      role,
      isActive: true,
    },
  });

  return issueToken(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  return issueToken(user);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new AppError('User not found', 404);
  }

  const settings = await prisma.storeSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  const safeUser = sanitizeUser(user);
  safeUser.storeName = settings?.brandName;
  return safeUser;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function mapSettings(settings: {
  id: string;
  brandName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
  currencyCode: string;
  taxRatePercent: unknown;
  taxNumber: string | null;
  receiptFooterMessage: string;
  updatedAt: Date;
}) {
  return {
    id: settings.id,
    brandName: settings.brandName,
    tagline: settings.tagline,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    currencySymbol: settings.currencySymbol,
    currencyCode: settings.currencyCode,
    taxRatePercent: toNumber(settings.taxRatePercent as never),
    taxNumber: settings.taxNumber ?? undefined,
    receiptFooterMessage: settings.receiptFooterMessage,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
