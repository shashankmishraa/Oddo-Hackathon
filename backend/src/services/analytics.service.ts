import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface VehicleReport {
  vehicleId: string;
  registrationNumber: string;
  make: string;
  model: string;
  odometer: number;
  totalFuelCost: number;
  totalFuelLiters: number;
  totalMaintenanceCost: number;
  totalDirectExpenses: number;
  totalOperationalCost: number;
  costPerKm: number;
}

export class AnalyticsService {
  async getVehicleOperationalCosts(): Promise<VehicleReport[]> {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        fuelLogs: { select: { cost: true, liters: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } },
      },
    });

    return vehicles.map((v) => {
      const totalFuelCost = v.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
      const totalFuelLiters = v.fuelLogs.reduce((sum, log) => sum + log.liters, 0);
      const totalMaintenanceCost = v.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
      const totalDirectExpenses = v.expenses.reduce((sum, exp) => sum + exp.amount, 0);

      const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalDirectExpenses;
      const costPerKm = v.odometer > 0 ? totalOperationalCost / v.odometer : 0;

      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        make: v.make,
        model: v.model,
        odometer: v.odometer,
        totalFuelCost,
        totalFuelLiters,
        totalMaintenanceCost,
        totalDirectExpenses,
        totalOperationalCost,
        costPerKm: parseFloat(costPerKm.toFixed(2)),
      };
    });
  }

  async getVehicleCostSummary(id: string): Promise<VehicleReport | null> {
    const v = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        fuelLogs: { select: { cost: true, liters: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } },
      },
    });

    if (!v) return null;

    const totalFuelCost = v.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalFuelLiters = v.fuelLogs.reduce((sum, log) => sum + log.liters, 0);
    const totalMaintenanceCost = v.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalDirectExpenses = v.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalDirectExpenses;
    const costPerKm = v.odometer > 0 ? totalOperationalCost / v.odometer : 0;

    return {
      vehicleId: v.id,
      registrationNumber: v.registrationNumber,
      make: v.make,
      model: v.model,
      odometer: v.odometer,
      totalFuelCost,
      totalFuelLiters,
      totalMaintenanceCost,
      totalDirectExpenses,
      totalOperationalCost,
      costPerKm: parseFloat(costPerKm.toFixed(2)),
    };
  }
}
export default AnalyticsService;
