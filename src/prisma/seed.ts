import { PrismaClient, ContactStatus, ServiceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // First create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      id: 'admin-role',
      name: 'Admin',
      description: 'Administrator with full access',
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: {
      id: 'staff-role',
      name: 'Staff',
      description: 'Staff member with limited access',
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'Customer' },
    update: {},
    create: {
      id: 'customer-role',
      name: 'Customer',
      description: 'Customer user',
    },
  });

  // Add Vehicle Ticket Manager role
  const vehicleTicketManagerRole = await prisma.role.upsert({
    where: { name: 'Vehicle Ticket Manager' },
    update: {},
    create: {
      id: 'vehicle-ticket-manager-role',
      name: 'Vehicle Ticket Manager',
      description: 'External staff for vehicle ticket management only',
    },
  });

  // Add Driver role
  const driverRole = await prisma.role.upsert({
    where: { name: 'Driver' },
    update: {},
    create: {
      id: 'driver-role',
      name: 'Driver',
      description: 'Driver with vehicle operation permissions',
    },
  });

  // Add Super Admin role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      id: 'super-admin-role',
      name: 'Super Admin',
      description: 'Super Administrator with highest privileges',
    },
  });

  // Create admin users
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      fullName: 'Admin User',
      roleId: adminRole.id,
      id: 'admin-1',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin2@example.com' },
    update: {},
    create: {
      email: 'admin2@example.com',
      password: await bcrypt.hash('admin123', 10),
      fullName: 'Admin User 2',
      roleId: adminRole.id,
      id: 'admin-2',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  // Create staff users
  await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      password: await bcrypt.hash('staff123', 10),
      fullName: 'Staff User',
      roleId: staffRole.id,
      id: 'staff-1',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff2@example.com' },
    update: {},
    create: {
      email: 'staff2@example.com',
      password: await bcrypt.hash('staff123', 10),
      fullName: 'Staff User 2',
      roleId: staffRole.id,
      id: 'staff-2',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  // Create customer users
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: await bcrypt.hash('customer123', 10),
      fullName: 'Customer User',
      roleId: customerRole.id,
      id: 'customer-1',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  const customerUser2 = await prisma.user.upsert({
    where: { email: 'customer2@example.com' },
    update: {},
    create: {
      email: 'customer2@example.com',
      password: await bcrypt.hash('customer123', 10),
      fullName: 'Customer User 2',
      roleId: customerRole.id,
      id: 'customer-2',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  // Create services
  const hotelService = await prisma.service.create({
    data: {
      name: 'Luxury Hotel',
      description: '5-star luxury hotel accommodation',
      type: ServiceType.HOTEL,
      isActive: true,
      imageUrl:
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop',
      metadata: {
        allowPayLater: true,
        price: 200,
        currency: 'USD',
        amenities: ['Pool', 'Spa', 'Restaurant'],
        roomTypes: ['Deluxe', 'Suite', 'Executive'],
      },
      id: 'service-1',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  const transferService = await prisma.service.create({
    data: {
      name: 'Airport Transfer',
      description: 'Premium airport transfer service',
      type: ServiceType.TRANSFER,
      isActive: true,
      imageUrl:
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
      metadata: {
        allowPayLater: false,
        price: 50,
        currency: 'USD',
        vehicleTypes: ['Sedan', 'SUV', 'Van'],
        duration: '30 minutes',
      },
      id: 'service-2',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  const tourService = await prisma.service.create({
    data: {
      name: 'City Tour',
      description: 'Guided city tour with local expert',
      type: ServiceType.TOUR,
      isActive: true,
      imageUrl:
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
      metadata: {
        allowPayLater: true,
        price: 75,
        currency: 'USD',
        duration: '4 hours',
        maxGroupSize: 15,
        includes: ['Guide', 'Transportation', 'Lunch'],
      },
      id: 'service-3',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  const flightService = await prisma.service.create({
    data: {
      name: 'Flight Booking',
      description: 'International and domestic flight booking service',
      type: ServiceType.FLIGHT,
      isActive: true,
      imageUrl:
        'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop',
      metadata: {
        allowPayLater: false,
        price: 500,
        currency: 'USD',
        airlines: ['Vietnam Airlines', 'Bamboo Airways', 'Vietjet Air'],
        classes: ['Economy', 'Business', 'First'],
      },
      id: 'service-4',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  // Create bookings
  await prisma.booking.create({
    data: {
      userId: customerUser.id,
      BookingServices: {
        create: [{ serviceId: hotelService.id }],
      },
      status: 'PENDING',
      totalPrice: 200,
      paymentStatus: 'UNPAID',
      bookingCode: 'BK001',
      notes: 'Deluxe room booking',
      id: 'booking-1',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  const confirmedBooking = await prisma.booking.create({
    data: {
      userId: customerUser.id,
      BookingServices: {
        create: [{ serviceId: transferService.id }],
      },
      status: 'CONFIRMED',
      totalPrice: 50,
      paymentStatus: 'PAID',
      bookingCode: 'BK002',
      notes: 'Airport pickup service',
      id: 'booking-2',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  const tourBooking = await prisma.booking.create({
    data: {
      userId: customerUser2.id,
      BookingServices: {
        create: [{ serviceId: tourService.id }],
      },
      status: 'CONFIRMED',
      totalPrice: 75,
      paymentStatus: 'PAID',
      bookingCode: 'BK003',
      notes: 'City tour booking',
      id: 'booking-3',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  const flightBooking = await prisma.booking.create({
    data: {
      userId: customerUser.id,
      BookingServices: {
        create: [{ serviceId: flightService.id }],
      },
      status: 'CONFIRMED',
      totalPrice: 500,
      paymentStatus: 'PAID',
      bookingCode: 'BK004',
      notes: 'International flight booking',
      id: 'booking-4',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  // Create payments
  await prisma.payment.create({
    data: {
      bookingId: confirmedBooking.id,
      amount: 50,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'CREDIT_CARD',
      provider: 'stripe',
      txnRef: 'txn_123456',
      metadata: {
        cardLast4: '4242',
        paymentProvider: 'stripe',
      },
      id: 'payment-1',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: tourBooking.id,
      amount: 75,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'PAYPAL',
      provider: 'paypal',
      txnRef: 'txn_789012',
      metadata: {
        paymentProvider: 'paypal',
        payerEmail: 'customer2@example.com',
      },
      id: 'payment-2',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: flightBooking.id,
      amount: 500,
      currency: 'USD',
      status: 'COMPLETED',
      paymentMethod: 'BANK_TRANSFER',
      provider: 'bank',
      txnRef: 'txn_345678',
      metadata: {
        paymentProvider: 'bank',
        bankName: 'Vietcombank',
        accountNumber: 'XXXX1234',
      },
      id: 'payment-3',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  // Create FAQs
  await prisma.fAQ.create({
    data: {
      question: 'What is your cancellation policy?',
      answer:
        'You can cancel your booking up to 24 hours before the service date for a full refund.',
      category: 'BOOKING',
      isActive: true,
      id: 'faq-1',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.fAQ.create({
    data: {
      question: 'How do I arrange airport pickup?',
      answer:
        'You can book airport transfer service through our website or mobile app.',
      category: 'SERVICE',
      isActive: true,
      id: 'faq-2',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.fAQ.create({
    data: {
      question: 'What payment methods do you accept?',
      answer: 'We accept credit cards, PayPal, and bank transfers.',
      category: 'PAYMENT',
      isActive: true,
      id: 'faq-3',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.fAQ.create({
    data: {
      question: 'How long does visa processing take?',
      answer: 'Visa processing typically takes 5-7 business days.',
      category: 'SERVICE',
      isActive: true,
      id: 'faq-4',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.fAQ.create({
    data: {
      question: 'What does travel insurance cover?',
      answer:
        'Our travel insurance covers medical expenses, trip cancellation, and baggage loss.',
      category: 'SERVICE',
      isActive: true,
      id: 'faq-5',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  // Create contacts
  await prisma.contact.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'General Inquiry',
      message: 'I have a question about your services',
      status: ContactStatus.NEW,
      id: 'contact-1',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.contact.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      subject: 'Booking Support',
      message: 'Need help with my recent booking',
      status: ContactStatus.PROCESSING,
      id: 'contact-2',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.contact.create({
    data: {
      name: 'Bob Wilson',
      email: 'bob@example.com',
      subject: 'Feedback',
      message: 'Great service! Would like to provide feedback',
      status: ContactStatus.RESOLVED,
      id: 'contact-3',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  // Create service reviews
  await prisma.serviceReview.create({
    data: {
      userId: customerUser.id,
      serviceId: hotelService.id,
      rating: 5,
      comment: 'Excellent hotel service!',
      id: 'review-1',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.serviceReview.create({
    data: {
      userId: customerUser2.id,
      serviceId: transferService.id,
      rating: 4,
      comment: 'Good transfer service, but a bit late.',
      id: 'review-2',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  // Create newsletters
  await prisma.newsletter.create({
    data: {
      email: 'subscriber1@example.com',
      id: 'newsletter-1',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.newsletter.create({
    data: {
      email: 'subscriber2@example.com',
      id: 'newsletter-2',
      updatedAt: new Date(),
      createdAt: new Date(),
    },
  });

  // Create permissions
  const permissions = [
    // Vehicle Ticket permissions
    {
      name: 'vehicle_tickets:read:all',
      description: 'View all vehicle tickets',
    },
    { name: 'vehicle_tickets:create', description: 'Create vehicle tickets' },
    {
      name: 'vehicle_tickets:update:status',
      description: 'Update ticket status',
    },
    { name: 'vehicle_tickets:cancel', description: 'Cancel vehicle tickets' },
    { name: 'vehicle_tickets:confirm', description: 'Confirm vehicle tickets' },
    {
      name: 'vehicle_tickets:manage:seats',
      description: 'Manage seat assignments',
    },
    {
      name: 'vehicle_tickets:view:schedule',
      description: 'View vehicle schedules',
    },
    {
      name: 'vehicle_tickets:view:passenger_list',
      description: 'View passenger lists',
    },
    {
      name: 'vehicle_tickets:handle:customer_requests',
      description: 'Handle customer requests',
    },
    { name: 'vehicle_tickets:process:refunds', description: 'Process refunds' },
    { name: 'vehicle_tickets:view:routes', description: 'View routes' },
    {
      name: 'vehicle_tickets:manage:departure_times',
      description: 'Manage departure times',
    },

    // Basic permissions
    { name: 'dashboard:read:basic', description: 'Basic dashboard access' },
    { name: 'services:read', description: 'Read services' },
    { name: 'bookings:read:all', description: 'Read all bookings' },
    { name: 'bookings:create', description: 'Create bookings' },
    { name: 'bookings:update', description: 'Update bookings' },
    { name: 'bookings:cancel', description: 'Cancel bookings' },
    { name: 'users:read:profile', description: 'Read own profile' },
    { name: 'vehicles:read', description: 'Read vehicles' },
    { name: 'content:read', description: 'Read content' },
  ];

  const createdPermissions = [];
  for (const permission of permissions) {
    const createdPermission = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: {
        id: `perm-${permission.name.replace(/[^a-zA-Z0-9]/g, '-')}`,
        ...permission,
      },
    });
    createdPermissions.push(createdPermission);
  }

  // Assign permissions to Vehicle Ticket Manager role
  const vehicleTicketPermissions = createdPermissions.filter(
    (p) =>
      p.name.startsWith('vehicle_tickets:') ||
      p.name === 'dashboard:read:basic' ||
      p.name === 'services:read' ||
      p.name.startsWith('bookings:') ||
      p.name === 'users:read:profile' ||
      p.name === 'vehicles:read' ||
      p.name === 'content:read',
  );

  await prisma.role.update({
    where: { id: vehicleTicketManagerRole.id },
    data: {
      Permission: {
        connect: vehicleTicketPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('🎫 Vehicle Ticket Manager role and permissions created');
  console.log('👥 Sample users created:');
  console.log('   - ticket.manager@example.com (Vehicle Ticket Manager)');
  console.log('   - external.staff@example.com (Vehicle Ticket Manager)');
  console.log('   - driver@example.com (Driver)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
