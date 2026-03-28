import prisma from "../src/lib/prisma";

async function main() {
  // Clear existing data
  await prisma.attendance.deleteMany();
  await prisma.roster.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.user.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.company.deleteMany();

  const companyA = await prisma.company.create({
    data: {
      name: "ABC Retail Ltd",
    },
  });

  const companyB = await prisma.company.create({
    data: {
      name: "XYZ Logistics Corp",
    },
  });

  // Create Outlets
  const outletA1 = await prisma.outlet.create({
    data: {
      name: "Main Street Branch",
      address: "123 Main St, Downtown",
      phone: "012-3456789",
      companyId: companyA.id,
    },
  });

  const outletA2 = await prisma.outlet.create({
    data: {
      name: "Westside Mall Outlet",
      address: "456 West Ave, Mall Level 2",
      phone: "012-9876543",
      companyId: companyA.id,
    },
  });

  const outletB1 = await prisma.outlet.create({
    data: {
      name: "Central Warehouse",
      address: "789 Industrial Zone",
      phone: "013-1112223",
      companyId: companyB.id,
    },
  });

  // Create Admin
  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@abc.com",
      phone: "0101112222",
      password: "1234",
      role: "ADMIN",
      department: "Admin",
      companyId: companyA.id,
    },
  });

  // Create Supervisor
  await prisma.user.create({
    data: {
      name: "Supervisor User",
      email: "supervisor@abc.com",
      phone: "0103334444",
      password: "1234",
      role: "SUPERVISOR",
      department: "Retail",
      companyId: companyA.id,
      outletId: outletA1.id,
    },
  });

  // Create Staff
  const departments = ["Retail", "Logistic", "Rover", "Admin"];
  const tasks = ["Sales", "Inventory", "Delivery", "Support", "Maintenance"];
  
  for (let i = 1; i <= 30; i++) {
    const isCompanyA = i % 2 === 0;
    const dept = departments[i % departments.length];
    const task = tasks[i % tasks.length];
    const status = i % 10 === 0 ? "INACTIVE" : "ACTIVE";
    
    const staff = await prisma.user.create({
      data: {
        name: `Staff Member ${i}`,
        email: `staff${i}@example.com`,
        phone: `01700000${i.toString().padStart(2, '0')}`,
        password: "1234",
        role: "STAFF",
        department: dept,
        task: task,
        status: status,
        leaveBalance: 14,
        companyId: isCompanyA ? companyA.id : companyB.id,
        outletId: isCompanyA ? (i % 4 === 0 ? outletA2.id : outletA1.id) : outletB1.id,
      },
    });

    // Create some sample leave requests
    if (i <= 10) {
      await prisma.leave.create({
        data: {
          userId: staff.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
          reason: "Family emergency",
          status: i % 3 === 0 ? "APPROVED" : i % 3 === 1 ? "PENDING" : "REJECTED",
          supervisorNote: i % 3 === 0 ? "Approved. Take care." : i % 3 === 2 ? "Short notice." : null,
        }
      });
    }
  }

  console.log("Seed data created with Outlets, Phone numbers, Status, and Tasks!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });