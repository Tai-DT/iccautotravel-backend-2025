import {
  PrismaClient,
  Role,
  ServiceType,
  BlogStatus,
  FileCategory,
  PaymentStatus,
  BookingStatus,
  InvoiceStatus,
  ItineraryStatus,
  ContactStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Tạo permissions trước
  const permissions = [
    { name: 'user:view_all', description: 'View all users' },
    { name: 'user:view_own', description: 'View own user profile' },
    { name: 'user:manage', description: 'Create, update, delete users' },
    { name: 'service:create', description: 'Create new services' },
    { name: 'service:view_all', description: 'View all services' },
    { name: 'service:view_own', description: 'View services they manage' },
    { name: 'service:edit_all', description: 'Edit all services' },
    { name: 'service:edit_own', description: 'Edit services they manage' },
    { name: 'service:delete', description: 'Delete services' },
    { name: 'booking:view_all', description: 'View all bookings' },
    { name: 'booking:view_own', description: 'View bookings they are involved in' },
    { name: 'booking:manage', description: 'Create, update, delete bookings' },
    { name: 'dashboard:access', description: 'Access the dashboard UI' },
    { name: 'driver:view_assigned_trips', description: 'View trips assigned to them' },
    { name: 'driver:update_trip_status', description: 'Update status of assigned trips' },
    { name: 'vehicle_ticket_manager:view_all_vehicles', description: 'View all vehicle services' },
    { name: 'vehicle_ticket_manager:manage_vehicle_bookings', description: 'Manage vehicle related bookings' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: {
        id: uuidv4(),
        ...perm,
      },
    });
  }

  // Lấy tất cả permissions để connect với roles
  const allPermissions = await prisma.permission.findMany();

  // Tạo roles với permissions
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Admin',
      description: 'Full administrative access to the dashboard',
      Permission: {
        connect: allPermissions.map(p => ({ id: p.id })),
      },
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'Customer' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Customer',
      description: 'Regular customer user',
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Staff',
      description: 'Staff member with limited access',
    },
  });

  const driverRole = await prisma.role.upsert({
    where: { name: 'Driver' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Driver',
      description: 'Driver who can view assigned trips',
    },
  });

  // Tạo admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@iccautotravel.com' },
    update: {},
    create: {
      id: 'admin-1',
      email: 'admin@iccautotravel.com',
      password: hashedPassword,
      fullName: 'Admin',
      Role: {
        connect: { id: adminRole.id }
      },
      phone: '+84123456789',
      language: 'vi',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // Tạo một số customer users
  const customers = [
    {
      id: 'customer-1',
      email: 'customer1@example.com',
      fullName: 'Nguyễn Văn A',
      phone: '+84987654321',
    },
    {
      id: 'customer-2', 
      email: 'customer2@example.com',
      fullName: 'Trần Thị B',
      phone: '+84987654322',
    },
    {
      id: 'customer-3',
      email: 'customer3@example.com', 
      fullName: 'Lê Văn C',
      phone: '+84987654323',
    },
  ];

  for (const customer of customers) {
    const customerPassword = await bcrypt.hash('customer123', 10);
    await prisma.user.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        ...customer,
        password: customerPassword,
        Role: {
          connect: { id: customerRole.id }
        },
        language: 'vi',
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  // Tạo staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  await prisma.user.upsert({
    where: { email: 'staff@iccautotravel.com' },
    update: {},
    create: {
      id: 'staff-1',
      email: 'staff@iccautotravel.com',
      password: staffPassword,
      fullName: 'Staff Member',
      Role: {
        connect: { id: staffRole.id }
      },
      phone: '+84123456788',
      language: 'vi',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // Tạo driver user
  const driverPassword = await bcrypt.hash('driver123', 10);
  await prisma.user.upsert({
    where: { email: 'driver@iccautotravel.com' },
    update: {},
    create: {
      id: 'driver-1',
      email: 'driver@iccautotravel.com',
      password: driverPassword,
      fullName: 'Driver One',
      Role: {
        connect: { id: driverRole.id }
      },
      phone: '+84123456787',
      language: 'vi',
      isActive: true,
      driverStatus: 'APPROVED',
      experience: 5,
      languages: ['vi', 'en'],
      licenseClass: 'B2',
      licenseNumber: 'B2123456789',
      rating: 4.5,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@iccautotravel.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 