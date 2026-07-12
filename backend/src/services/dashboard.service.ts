import { DashboardRepository } from '../repositories/dashboard.repository';

const dashboardRepo = new DashboardRepository();

export class DashboardService {
  async getDashboardSummary() {
    const currentYear = new Date().getFullYear();

    // Fetch groupings and lists logs in parallel for performance
    const [
      vehicleCounts,
      driverCounts,
      tripCounts,
      fuelLogs,
      expenseLogs,
    ] = await Promise.all([
      dashboardRepo.getVehicleStatusCounts(),
      dashboardRepo.getDriverStatusCounts(),
      dashboardRepo.getTripStatusCounts(),
      dashboardRepo.getYearlyFuelLogs(currentYear),
      dashboardRepo.getYearlyExpenses(currentYear),
    ]);

    // Parse vehicle status counts
    let activeVehicles = 0;
    let availableVehicles = 0;
    let vehiclesInShop = 0;
    let vehiclesOnTrip = 0;
    const vehicleDistribution = { AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 };

    vehicleCounts.forEach((v) => {
      const count = v._count.id;
      vehicleDistribution[v.status as keyof typeof vehicleDistribution] = count;

      if (v.status !== 'RETIRED') {
        activeVehicles += count;
      }
      if (v.status === 'AVAILABLE') {
        availableVehicles += count;
      }
      if (v.status === 'IN_SHOP') {
        vehiclesInShop += count;
      }
      if (v.status === 'ON_TRIP') {
        vehiclesOnTrip += count;
      }
    });

    // Parse driver status counts
    let driversOnDuty = 0;
    const driverDistribution = { AVAILABLE: 0, ON_TRIP: 0, OFF_DUTY: 0, SUSPENDED: 0 };

    driverCounts.forEach((d) => {
      const count = d._count.id;
      driverDistribution[d.status as keyof typeof driverDistribution] = count;

      if (d.status === 'AVAILABLE' || d.status === 'ON_TRIP') {
        driversOnDuty += count;
      }
    });

    // Parse trip status counts
    let activeTrips = 0;
    let pendingTrips = 0;
    const tripDistribution = { DRAFT: 0, DISPATCHED: 0, COMPLETED: 0, CANCELLED: 0 };

    tripCounts.forEach((t) => {
      const count = t._count.id;
      tripDistribution[t.status as keyof typeof tripDistribution] = count;

      if (t.status === 'DISPATCHED') {
        activeTrips += count;
      }
      if (t.status === 'DRAFT') {
        pendingTrips += count;
      }
    });

    // Calculate fleet utilization
    const fleetUtilization = activeVehicles > 0 ? (vehiclesOnTrip / activeVehicles) * 100 : 0;

    // Map monthly fuel and expenses
    const monthlyFuel = Array(12).fill(0);
    const monthlyExpenses = Array(12).fill(0);

    fuelLogs.forEach((log) => {
      const month = new Date(log.date).getMonth();
      monthlyFuel[month] += log.cost;
    });

    expenseLogs.forEach((exp) => {
      const month = new Date(exp.date).getMonth();
      monthlyExpenses[month] += exp.amount;
    });

    // Round monthly stats to 2 decimal places
    const formattedMonthlyFuel = monthlyFuel.map((val) => parseFloat(val.toFixed(2)));
    const formattedMonthlyExpenses = monthlyExpenses.map((val) => parseFloat(val.toFixed(2)));

    return {
      kpis: {
        activeVehicles,
        availableVehicles,
        vehiclesInShop,
        driversOnDuty,
        fleetUtilization: parseFloat(fleetUtilization.toFixed(2)),
        activeTrips,
        pendingTrips,
      },
      distributions: {
        vehicles: vehicleDistribution,
        drivers: driverDistribution,
        trips: tripDistribution,
      },
      charts: {
        monthlyFuel: formattedMonthlyFuel,
        monthlyExpenses: formattedMonthlyExpenses,
      },
    };
  }
}
export default DashboardService;
