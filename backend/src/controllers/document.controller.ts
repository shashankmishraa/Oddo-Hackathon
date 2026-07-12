import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { parseQueryParams } from '../utils/queryHelper';

const prisma = new PrismaClient();

const getDocumentStatus = (expiryDate: Date): string => {
  const now = new Date();
  // Set both to start of day for accurate day division
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiry = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'EXPIRED';
  } else if (diffDays <= 30) {
    return 'EXPIRING_SOON';
  } else {
    return 'ACTIVE';
  }
};

export const getVehicleDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId } = req.params;
    
    // Retrieve vehicle
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    const documents = await prisma.document.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
    });

    // Dynamically update status in database if dates changed
    const updatedDocs = await Promise.all(
      documents.map(async (doc) => {
        const currentStatus = getDocumentStatus(doc.expiryDate);
        if (currentStatus !== doc.status) {
          return prisma.document.update({
            where: { id: doc.id },
            data: { status: currentStatus },
          });
        }
        return doc;
      })
    );

    return sendSuccess(res, updatedDocs, 'Vehicle documents retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId } = req.params;
    const { type, expiryDate } = req.body;

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    if (!type || !expiryDate) {
      // Clean up file if validation failed
      fs.unlinkSync(req.file.path);
      throw new AppError('Document type and expiry date are required', 400);
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      fs.unlinkSync(req.file.path);
      throw new AppError('Vehicle not found', 404);
    }

    const parsedExpiry = new Date(expiryDate);
    if (isNaN(parsedExpiry.getTime())) {
      fs.unlinkSync(req.file.path);
      throw new AppError('Invalid expiry date format', 400);
    }

    const status = getDocumentStatus(parsedExpiry);

    // Delete existing document of same type if present to overwrite/replace
    const existingDoc = await prisma.document.findFirst({
      where: { vehicleId, type },
    });

    if (existingDoc) {
      // Remove old file from disk
      const oldPath = path.join(__dirname, '../../', existingDoc.filePath);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (err) {
          // Ignore delete errors
        }
      }
      // Delete old database record
      await prisma.document.delete({ where: { id: existingDoc.id } });
    }

    // Relative path for database storing
    const filePath = `uploads/${req.file.filename}`;

    const document = await prisma.document.create({
      data: {
        vehicleId,
        type,
        fileName: req.file.originalname,
        filePath,
        expiryDate: parsedExpiry,
        status,
      },
    });

    return sendSuccess(res, document, 'Document uploaded successfully', 201);
  } catch (error) {
    return next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleId, docId } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: docId },
    });

    if (!document || document.vehicleId !== vehicleId) {
      throw new AppError('Document not found', 404);
    }

    // Remove file from disk
    const fullPath = path.join(__dirname, '../../', document.filePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        // Ignore unlinking errors
      }
    }

    await prisma.document.delete({
      where: { id: docId },
    });

    return sendSuccess(res, null, 'Document deleted successfully');
  } catch (error) {
    return next(error);
  }
};

export const getAllDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedOptions = parseQueryParams(req);
    const { search, sortBy, sortOrder, skip, take, page, limit } = parsedOptions;
    
    const where: any = {};
    
    if (parsedOptions.filters.status && parsedOptions.filters.status !== 'ALL') {
      where.status = parsedOptions.filters.status;
    }
    if (parsedOptions.filters.type && parsedOptions.filters.type !== 'ALL') {
      where.type = parsedOptions.filters.type;
    }
    if (parsedOptions.filters.vehicleId && parsedOptions.filters.vehicleId !== 'ALL') {
      where.vehicleId = parsedOptions.filters.vehicleId;
    }
    
    if (search) {
      where.OR = [
        { fileName: { contains: search } },
        { vehicle: { registrationNumber: { contains: search } } }
      ];
    }
    
    const total = await prisma.document.count({ where });
    const data = await prisma.document.findMany({
      where,
      include: {
        vehicle: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take
    });
    
    return sendSuccess(res, {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }, 'All documents retrieved successfully');
  } catch (error) {
    return next(error);
  }
};

