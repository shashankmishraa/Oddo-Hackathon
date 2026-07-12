import { Request } from 'express';

export interface ParsedQuery {
  skip: number;
  take: number;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  filters: Record<string, any>;
}

export const parseQueryParams = (req: Request): ParsedQuery => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = ((req.query.sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  const search = req.query.search as string;

  // Extract custom filters
  const filters: Record<string, any> = {};
  
  if (req.query.status) filters.status = req.query.status;
  if (req.query.category) filters.category = req.query.category;
  if (req.query.vehicleId) filters.vehicleId = req.query.vehicleId;
  if (req.query.driverId) filters.driverId = req.query.driverId;
  if (req.query.type) filters.type = req.query.type;
  if (req.query.region) filters.region = req.query.region;
  
  // Date Filters
  if (req.query.dateStart || req.query.dateEnd) {
    const start = req.query.dateStart ? new Date(req.query.dateStart as string) : undefined;
    const end = req.query.dateEnd ? new Date(req.query.dateEnd as string) : undefined;
    filters.dateRange = { start, end };
  }

  return { skip, take: limit, page, limit, sortBy, sortOrder, search, filters };
};
