import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ReportItem {
  vehicleId: string;
  registrationNumber: string;
  make: string;
  model: string;
  odometer: number;
  totalLiters: number;
  totalFuelCost: number;
  fuelEfficiency: number; // Km/L
  tripCount: number; // Fleet Utilization metric
  totalMaintenanceCost: number;
  totalExpenses: number;
  totalOperationalCost: number;
  totalCargoDelivered: number;
  totalRevenue: number;
  roi: number; // Revenue / Operational Cost
}

export class ReportService {
  async getFleetReport(): Promise<ReportItem[]> {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        fuelLogs: { select: { liters: true, cost: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } },
        trips: {
          select: {
            status: true,
            cargo: true,
          },
        },
      },
    });

    return vehicles.map((v) => {
      const totalLiters = v.fuelLogs.reduce((sum, log) => sum + log.liters, 0);
      const totalFuelCost = v.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
      const fuelEfficiency = totalLiters > 0 ? v.odometer / totalLiters : 0;

      const tripCount = v.trips.filter(
        (t) => t.status === 'COMPLETED' || t.status === 'DISPATCHED'
      ).length;

      const totalMaintenanceCost = v.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
      const totalExpenses = v.expenses.reduce((sum, exp) => sum + exp.amount, 0);

      const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenses;

      const totalCargoDelivered = v.trips
        .filter((t) => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.cargo, 0);

      // Define standard tariff cargo rates:
      // Heavy trailers/containers (e.g. Tata Prima, Ashok Leyland) ➔ ₹4,500 per Ton
      // Medium trucks/pickups/mini trucks/vans ➔ ₹6,000 per Ton
      const isHeavy = v.make === 'Tata' || v.make === 'Ashok Leyland';
      const ratePerTon = isHeavy ? 4500 : 6000;
      const totalRevenue = totalCargoDelivered * ratePerTon;

      // ROI = Revenue generated divided by operational cost
      const roi = totalOperationalCost > 0 ? totalRevenue / totalOperationalCost : 0;

      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        make: v.make,
        model: v.model,
        odometer: v.odometer,
        totalLiters: parseFloat(totalLiters.toFixed(2)),
        totalFuelCost: parseFloat(totalFuelCost.toFixed(2)),
        fuelEfficiency: parseFloat(fuelEfficiency.toFixed(2)),
        tripCount,
        totalMaintenanceCost: parseFloat(totalMaintenanceCost.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalOperationalCost: parseFloat(totalOperationalCost.toFixed(2)),
        totalCargoDelivered,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
      };
    });
  }

  async generateCSV(items: ReportItem[]): Promise<string> {
    const headers = [
      'Vehicle ID',
      'Registration Number',
      'Make',
      'Model',
      'Current Mileage (Km)',
      'Total Fuel (Liters)',
      'Total Fuel Cost (₹)',
      'Fuel Efficiency (Km/L)',
      'Total Trips Completed',
      'Total Maintenance Cost (₹)',
      'Total Expenses (₹)',
      'Total Operational Cost (₹)',
      'Total Cargo Units Delivered (Tons)',
      'Total Revenue (₹)',
      'ROI Ratio (Revenue/Cost)',
    ];

    const rows = items.map((i) => [
      i.vehicleId,
      `"${i.registrationNumber}"`,
      `"${i.make}"`,
      `"${i.model}"`,
      i.odometer,
      i.totalLiters,
      i.totalFuelCost,
      i.fuelEfficiency,
      i.tripCount,
      i.totalMaintenanceCost,
      i.totalExpenses,
      i.totalOperationalCost,
      i.totalCargoDelivered,
      i.totalRevenue,
      i.roi,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}
export default ReportService;
