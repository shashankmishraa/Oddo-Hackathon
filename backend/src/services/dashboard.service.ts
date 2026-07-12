import { DashboardRepository } from '../repositories/dashboard.repository';

const dashboardRepo = new DashboardRepository();

export class DashboardService {
  async getDashboardSummary() {
    const currentYear = new Date().getFullYear();

    // Fetch lists in parallel
    const [
      vehicleCounts,
      driverCounts,
      tripCounts,
      fuelLogs,
      expenseLogs,
      maintenanceLogs,
      trips,
      topVehicles,
    ] = await Promise.all([
      dashboardRepo.getVehicleStatusCounts(),
      dashboardRepo.getDriverStatusCounts(),
      dashboardRepo.getTripStatusCounts(),
      dashboardRepo.getYearlyFuelLogs(currentYear),
      dashboardRepo.getYearlyExpenses(currentYear),
      dashboardRepo.getYearlyMaintenance(currentYear),
      dashboardRepo.getYearlyTrips(currentYear),
      dashboardRepo.getTopVehiclesByDistance(5),
    ]);

    // Parse vehicle statuses
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

    // Parse driver statuses
    let driversOnDuty = 0;
    const driverDistribution = { AVAILABLE: 0, ON_TRIP: 0, OFF_DUTY: 0, SUSPENDED: 0 };

    driverCounts.forEach((d) => {
      const count = d._count.id;
      driverDistribution[d.status as keyof typeof driverDistribution] = count;

      if (d.status === 'AVAILABLE' || d.status === 'ON_TRIP') {
        driversOnDuty += count;
      }
    });

    // Parse trip statuses
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

    // Calculate current fleet utilization (percentage)
    const fleetUtilization = activeVehicles > 0 ? (vehiclesOnTrip / activeVehicles) * 100 : 0;

    // Monthly data arrays
    const monthlyFuelCost = Array(12).fill(0);
    const monthlyFuelLiters = Array(12).fill(0);
    const monthlyExpenses = Array(12).fill(0);
    const monthlyMaintenance = Array(12).fill(0);
    const monthlyRevenue = Array(12).fill(0);
    const monthlyTripCounts = Array(12).fill(0);

    // Populate monthly fuel stats
    fuelLogs.forEach((log) => {
      const month = new Date(log.date).getMonth();
      monthlyFuelCost[month] += log.cost;
      monthlyFuelLiters[month] += log.liters;
    });

    // Populate monthly expenses (direct expense ledger items)
    expenseLogs.forEach((exp) => {
      const month = new Date(exp.date).getMonth();
      monthlyExpenses[month] += exp.amount;
    });

    // Populate monthly maintenance costs
    maintenanceLogs.forEach((log) => {
      const month = new Date(log.date).getMonth();
      monthlyMaintenance[month] += log.cost;
    });

    // Populate monthly revenue and dispatches count
    trips.forEach((t) => {
      const month = new Date(t.departureTime).getMonth();
      
      if (t.status === 'COMPLETED' || t.status === 'DISPATCHED') {
        monthlyTripCounts[month] += 1;
      }

      if (t.status === 'COMPLETED') {
        const isHeavy = t.vehicle.make === 'Tata' || t.vehicle.make === 'Ashok Leyland';
        const ratePerTon = isHeavy ? 4500 : 6000;
        const revenue = t.cargo * ratePerTon;
        monthlyRevenue[month] += revenue;
      }
    });

    // Compute monthly Combined Expenses (Fuel Cost + Maintenance Cost + Ledger Expenses)
    const monthlyCombinedExpenses = Array(12).fill(0);
    for (let m = 0; m < 12; m++) {
      monthlyCombinedExpenses[m] = monthlyFuelCost[m] + monthlyMaintenance[m] + monthlyExpenses[m];
    }

    // Compute monthly Fleet Utilization trend (percentage based on trip dispatches vs active vehicles)
    const monthlyFleetUtilization = Array(12).fill(0);
    for (let m = 0; m < 12; m++) {
      if (activeVehicles > 0) {
        // Dynamic estimate: monthly trips count divided by active fleet scaled down to a realistic percentage factor
        const util = (monthlyTripCounts[m] / activeVehicles) * 100;
        monthlyFleetUtilization[m] = parseFloat(Math.min(100, util).toFixed(2));
      }
    }

    // Round formatting helper
    const roundArray = (arr: number[]) => arr.map((val) => parseFloat(val.toFixed(2)));

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
        monthlyFuel: roundArray(monthlyFuelCost),
        monthlyExpenses: roundArray(monthlyCombinedExpenses),
        monthlyRevenue: roundArray(monthlyRevenue),
        monthlyFuelLiters: roundArray(monthlyFuelLiters),
        monthlyMaintenance: roundArray(monthlyMaintenance),
        monthlyFleetUtilization: roundArray(monthlyFleetUtilization),
        topVehiclesByDistance: topVehicles.map((v) => ({
          registrationNumber: v.registrationNumber,
          label: `${v.make} ${v.model.split(' (')[0]}`,
          distance: v.odometer,
        })),
      },
    };
  }
}
export default DashboardService;
