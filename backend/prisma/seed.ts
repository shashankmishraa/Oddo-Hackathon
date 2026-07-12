import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const INDIAN_CITIES = ['Mumbai', 'Pune', 'Nashik', 'Ahmedabad', 'Surat', 'Indore', 'Nagpur', 'Bangalore'];

const MAKES_MODELS = [
  { make: 'Tata', model: 'Prima 4925', type: 'Trailer', capacity: 40 },
  { make: 'Ashok Leyland', model: 'U-3718', type: 'Container', capacity: 20 },
  { make: 'BharatBenz', model: '3523R', type: 'Truck', capacity: 10 },
  { make: 'Mahindra', model: 'Bolero Maxi', type: 'Pickup', capacity: 2 },
  { make: 'Maruti Suzuki', model: 'Super Carry', type: 'Mini Truck', capacity: 1 },
  { make: 'Tata', model: 'Winger', type: 'Van', capacity: 2 },
];

const FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Aditya', 'Vivaan', 'Arjun', 'Sai', 'Reyansh', 'Arav', 'Kabir', 'Rudra',
  'Ananya', 'Diya', 'Pari', 'Pihu', 'Ira', 'Avani', 'Saanvi', 'Prisha', 'Riya', 'Aanya',
  'Amit', 'Rahul', 'Sanjay', 'Vikram', 'Anil', 'Sunil', 'Vijay', 'Rajesh', 'Rakesh', 'Manoj'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Mehra', 'Joshi', 'Patel', 'Shah', 'Mehta', 'Mishra', 'Trivedi',
  'Kulkarni', 'Joshi', 'Deshmukh', 'Patil', 'Pawar', 'Shinde', 'Rao', 'Reddy', 'Nair', 'Pillai'
];

async function main() {
  console.log('Cleaning existing records from database...');
  await prisma.expense.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  console.log('Seeding standard role hierarchies...');
  const roles = {
    ADMIN: await prisma.role.create({ data: { name: 'ADMIN', description: 'Fleet Manager - Overall operational controls' } }),
    DISPATCHER: await prisma.role.create({ data: { name: 'DISPATCHER', description: 'Operations Dispatcher - Trip scheduling' } }),
    SAFETY_OFFICER: await prisma.role.create({ data: { name: 'SAFETY_OFFICER', description: 'Safety Compliance Officer' } }),
    FINANCIAL_ANALYST: await prisma.role.create({ data: { name: 'FINANCIAL_ANALYST', description: 'Financial Analyst - Ledgers' } }),
    DRIVER: await prisma.role.create({ data: { name: 'DRIVER', description: 'Transit Operator' } }),
  };

  const driverPasswordHash = await bcrypt.hash('driver123', 10);

  console.log('Seeding administrative users...');
  // 5 Operational/Staff accounts
  const staff = [
    { email: 'admin@transitops.com', firstName: 'Rajesh', lastName: 'Kumar', roleId: roles.ADMIN.id, password: 'admin123' },
    { email: 'dispatcher@transitops.com', firstName: 'Amit', lastName: 'Sharma', roleId: roles.DISPATCHER.id, password: 'dispatcher123' },
    { email: 'dispatcher2@transitops.com', firstName: 'Vikram', lastName: 'Singh', roleId: roles.DISPATCHER.id, password: 'dispatcher123' },
    { email: 'safety@transitops.com', firstName: 'Sanjay', lastName: 'Patel', roleId: roles.SAFETY_OFFICER.id, password: 'safety123' },
    { email: 'finance@transitops.com', firstName: 'Anil', lastName: 'Mehta', roleId: roles.FINANCIAL_ANALYST.id, password: 'finance123' },
  ];

  for (const s of staff) {
    const hash = await bcrypt.hash(s.password, 10);
    await prisma.user.create({
      data: {
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        passwordHash: hash,
        roleId: s.roleId,
      }
    });
  }

  // 60 Driver users
  console.log('Creating 60 operator users...');
  const driverUsers: any[] = [];
  for (let i = 1; i <= 60; i++) {
    const fName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lName = LAST_NAMES[i % LAST_NAMES.length];
    const user = await prisma.user.create({
      data: {
        email: `driver${i}@swifthaul.in`,
        firstName: fName,
        lastName: lName,
        passwordHash: driverPasswordHash,
        roleId: roles.DRIVER.id,
      }
    });
    driverUsers.push(user);
  }

  // 50 Vehicles
  console.log('Creating 50 vehicle fleet units...');
  const vehicles: any[] = [];
  // Distributions: 30 Available, 10 On Trip, 6 In Shop, 4 Retired
  const vehicleStatuses = [
    ...Array(30).fill('AVAILABLE'),
    ...Array(10).fill('ON_TRIP'),
    ...Array(6).fill('IN_SHOP'),
    ...Array(4).fill('RETIRED'),
  ];

  for (let i = 1; i <= 50; i++) {
    const spec = MAKES_MODELS[i % MAKES_MODELS.length];
    const status = vehicleStatuses[i - 1];
    const regNo = `MH-12-SH-${1000 + i}`;
    
    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: regNo,
        make: spec.make,
        model: `${spec.model} (${INDIAN_CITIES[i % INDIAN_CITIES.length]})`,
        year: 2018 + (i % 6),
        capacity: spec.capacity,
        status,
        odometer: 15000.0 + (i * 2450.5),
      }
    });
    vehicles.push(vehicle);
  }

  // 60 Drivers
  console.log('Creating 60 driver operator profiles...');
  const drivers: any[] = [];
  // Distributions: 40 Available, 10 On Trip, 5 Off Duty, 5 Suspended
  const driverStatuses = [
    ...Array(40).fill('AVAILABLE'),
    ...Array(10).fill('ON_TRIP'),
    ...Array(5).fill('OFF_DUTY'),
    ...Array(5).fill('SUSPENDED'),
  ];

  for (let i = 1; i <= 60; i++) {
    const user = driverUsers[i - 1];
    const status = driverStatuses[i - 1];
    const dlNo = `DL-${100000 + i}`;
    
    // Set 3 expired licenses in the past
    let expiry = new Date();
    if (i <= 3) {
      expiry.setFullYear(expiry.getFullYear() - 1);
    } else {
      expiry.setFullYear(expiry.getFullYear() + 3);
    }

    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        licenseNumber: dlNo,
        licenseExpiry: expiry,
        safetyScore: Math.min(5.0, 3.5 + ((i % 16) * 0.1)),
        status,
      }
    });
    drivers.push({ ...driver, name: `${user.firstName} ${user.lastName}` });
  }

  // Seeding 40 Maintenance Records
  console.log('Generating 40 maintenance logs...');
  const maintenanceLogs: any[] = [];
  // 6 logs are OPEN (assigned to the 6 vehicles with IN_SHOP status)
  const inShopVehicles = vehicles.filter(v => v.status === 'IN_SHOP');
  const availableOrOtherVehicles = vehicles.filter(v => v.status !== 'IN_SHOP' && v.status !== 'RETIRED');

  const repairDescriptions = [
    'Engine Oil Change', 'Brake Pad Replacement', 'Gearbox Oil Flush',
    'Front Suspension Alignment', 'Tyre Rotation & Check', 'Alternator Repair',
    'Battery Re-charging & Acid fill', 'Air Filter and Fuel Filter Service'
  ];

  for (let i = 0; i < 40; i++) {
    let vehicleId = '';
    let status = 'CLOSED';

    if (i < 6) {
      vehicleId = inShopVehicles[i].id;
      status = 'OPEN';
    } else {
      vehicleId = availableOrOtherVehicles[i % availableOrOtherVehicles.length].id;
    }

    const logDate = new Date();
    logDate.setDate(logDate.getDate() - (10 + i * 3));

    const log = await prisma.maintenanceLog.create({
      data: {
        vehicleId,
        description: repairDescriptions[i % repairDescriptions.length],
        cost: 2500 + (i * 450),
        date: logDate,
        status,
      }
    });
    maintenanceLogs.push(log);
  }

  // Seeding 200 Trips
  console.log('Generating 200 operational transit trips...');
  const trips: any[] = [];
  
  // Trip status distribution: 115 Completed, 10 Dispatched (active), 50 Draft, 25 Cancelled
  const activeOnTripVehicles = vehicles.filter(v => v.status === 'ON_TRIP');
  const activeOnTripDrivers = drivers.filter(d => d.status === 'ON_TRIP');
  
  const draftVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
  const draftDrivers = drivers.filter(d => d.status === 'AVAILABLE' && new Date(d.licenseExpiry) > new Date());

  // 1. Generate 10 active dispatches (10 ON_TRIP vehicle-driver pairs)
  for (let i = 0; i < 10; i++) {
    const v = activeOnTripVehicles[i];
    const d = activeOnTripDrivers[i];
    const depTime = new Date();
    depTime.setHours(depTime.getHours() - 12);
    const arrTime = new Date();
    arrTime.setHours(arrTime.getHours() + 12);

    const trip = await prisma.trip.create({
      data: {
        vehicleId: v.id,
        driverId: d.id,
        cargo: Math.floor(v.capacity * 0.8),
        departureTime: depTime,
        arrivalTime: arrTime,
        status: 'DISPATCHED',
        actualDepartureTime: depTime,
        startOdometer: v.odometer - 150.0,
      }
    });
    trips.push(trip);
  }

  // 2. Generate 50 Draft trips (future schedule, AVAILABLE resources)
  for (let i = 0; i < 50; i++) {
    const v = draftVehicles[i % draftVehicles.length];
    const d = draftDrivers[i % draftDrivers.length];
    const depTime = new Date();
    depTime.setDate(depTime.getDate() + 2 + i);
    const arrTime = new Date();
    arrTime.setDate(arrTime.getDate() + 4 + i);

    const trip = await prisma.trip.create({
      data: {
        vehicleId: v.id,
        driverId: d.id,
        cargo: Math.floor(v.capacity * 0.7),
        departureTime: depTime,
        arrivalTime: arrTime,
        status: 'DRAFT',
      }
    });
    trips.push(trip);
  }

  // 3. Generate 25 Cancelled trips (past schedule)
  for (let i = 0; i < 25; i++) {
    const v = draftVehicles[i % draftVehicles.length];
    const d = draftDrivers[i % draftDrivers.length];
    const depTime = new Date();
    depTime.setDate(depTime.getDate() - 30 - i);
    const arrTime = new Date();
    arrTime.setDate(arrTime.getDate() - 28 - i);

    const trip = await prisma.trip.create({
      data: {
        vehicleId: v.id,
        driverId: d.id,
        cargo: Math.floor(v.capacity * 0.9),
        departureTime: depTime,
        arrivalTime: arrTime,
        status: 'CANCELLED',
      }
    });
    trips.push(trip);
  }

  // 4. Generate 115 Completed historical trips (non-overlapping dates)
  // To avoid overlap, we distribute 3 distinct historical completed trips to each active vehicle
  const activeVehiclesPool = vehicles.filter(v => v.status !== 'RETIRED');
  const activeDriversPool = drivers.filter(d => d.status !== 'SUSPENDED' && new Date(d.licenseExpiry) > new Date());
  
  let tripIndex = 0;
  for (let cycle = 1; cycle <= 3; cycle++) {
    for (let j = 0; j < activeVehiclesPool.length; j++) {
      if (tripIndex >= 115) break;

      const v = activeVehiclesPool[j];
      const d = activeDriversPool[(j + cycle) % activeDriversPool.length];

      const depTime = new Date();
      depTime.setDate(depTime.getDate() - (15 * cycle + (j % 5)));
      const arrTime = new Date(depTime);
      arrTime.setDate(arrTime.getDate() + 2);

      const distance = 400 + (j % 10) * 120;
      const startOdo = v.odometer - (600 * cycle);
      const endOdo = startOdo + distance;
      const fuelUsed = distance / (4.5 + (j % 3) * 0.5); // 4.5 to 5.5 Km/L

      const trip = await prisma.trip.create({
        data: {
          vehicleId: v.id,
          driverId: d.id,
          cargo: Math.floor(v.capacity * 0.8),
          departureTime: depTime,
          arrivalTime: arrTime,
          actualDepartureTime: depTime,
          actualArrivalTime: arrTime,
          status: 'COMPLETED',
          startOdometer: startOdo,
          endOdometer: endOdo,
          fuelUsed,
        }
      });
      trips.push(trip);
      tripIndex++;
    }
  }

  // 500 Fuel Entries
  console.log('Generating 500 fuel logs...');
  const fuelStations = ['IndianOil Highway Elite', 'HP Club One', 'Bharat Petroleum City Plaza', 'Reliance Transport Point'];
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');
  
  for (let i = 0; i < 500; i++) {
    const trip = completedTrips[i % completedTrips.length];
    const fillDate = new Date(trip.departureTime);
    
    await prisma.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        liters: 80.0 + (i % 6) * 20.0,
        cost: 7200 + (i % 6) * 1800, // INR
        date: fillDate,
        odometerReading: (trip.startOdometer || 15000.0) + (i % 5) * 50,
      }
    });
  }

  // 300 Expenses entries
  console.log('Generating 300 ledger expense records...');
  const expenseCategories = ['TOLL', 'FUEL', 'REPAIR', 'MEALS', 'OTHER'];
  const expenseDescriptions = [
    'NH-4 Toll Booth Fastag deduction',
    'Diesel refuel transaction',
    'Cabin filter cleaning',
    'Driver overnight halt lodging',
    'State boundary permit charges'
  ];

  for (let i = 0; i < 300; i++) {
    const trip = completedTrips[i % completedTrips.length];
    const category = expenseCategories[i % expenseCategories.length];
    const date = new Date(trip.departureTime);
    
    await prisma.expense.create({
      data: {
        amount: 800 + (i % 8) * 450,
        category,
        description: expenseDescriptions[i % expenseDescriptions.length],
        date,
        vehicleId: trip.vehicleId,
        tripId: trip.id,
        driverId: trip.driverId,
      }
    });
  }

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
