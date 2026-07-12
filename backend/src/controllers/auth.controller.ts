import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import { config } from '../config';

const prisma = new PrismaClient();

const mapDisplayNameToRoleName = (displayName: string): string => {
  switch (displayName) {
    case 'Fleet Manager': return 'ADMIN';
    case 'Dispatcher': return 'DISPATCHER';
    case 'Safety Officer': return 'SAFETY_OFFICER';
    case 'Financial Analyst': return 'FINANCIAL_ANALYST';
    case 'Driver': return 'DRIVER';
    default: return displayName;
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, contactNumber, roleName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Email address already registered.', 400);
    }

    const internalRoleName = mapDisplayNameToRoleName(roleName);
    const role = await prisma.role.findUnique({ where: { name: internalRoleName } });
    if (!role) {
      throw new AppError(`Role '${roleName}' does not exist in operations database.`, 404);
    }

    // Split fullName safely into firstName and lastName
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        contactNumber,
        roleId: role.id,
      },
      include: {
        role: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    }, 'Account registered successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    }, 'Authentication successful');
  } catch (error) {
    return next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { role: true },
    });

    if (!user) {
      throw new AppError('User session expired or user removed.', 401);
    }

    return sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  return sendSuccess(res, null, 'Logged out successfully');
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('No user found with this email address.', 404);
    }

    // Generate reset token
    const token = crypto.randomBytes(20).toString('hex');
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour validity

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    console.log(`[PASSWORD RESET] Token generated for ${email}: ${token}`);
    console.log(`[PASSWORD RESET] Expiry set to: ${expiry.toISOString()}`);

    return sendSuccess(res, { token }, 'Password reset token generated successfully. For development demo, the token is returned in this payload.');
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired password reset token.', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return sendSuccess(res, null, 'Password updated successfully. You can now log in.');
  } catch (error) {
    return next(error);
  }
};
