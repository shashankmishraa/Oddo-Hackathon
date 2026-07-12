import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import { config } from '../config';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, roleName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Email address already registered.', 400);
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new AppError(`Role '${roleName}' does not exist in operations database.`, 404);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
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
  // Stateless JWT: logout is completed by client destroying the token.
  return sendSuccess(res, null, 'Logged out successfully');
};
