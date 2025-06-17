import {
  PrismaClient,
  ServiceType,
  BookingStatus,
  PaymentStatus,
  // FileCategory, // Không sử dụng
  BannerPosition,
  BannerType,
  BlogStatus,
  // ContactStatus, // Không sử dụng
  ItineraryStatus,
  NewsletterStatus,
  InvoiceStatus,
  LocationType,
  DriverApprovalStatus,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu điền dữ liệu mẫu toàn diện...');

  // Xóa dữ liệu cũ (tùy chọn, chỉ dùng khi phát triển)
  await cleanDatabase();

  // Tạo Permissions
  const permissionsData = [
    { name: 'user:view_all', description: 'Xem tất cả người dùng' },
    {
      name: 'user:view_own',
      description: 'Xem hồ sơ người dùng của chính mình',
    },
    { name: 'user:manage', description: 'Tạo, cập nhật, xóa người dùng' },
    { name: 'service:create', description: 'Tạo dịch vụ mới' },
    { name: 'service:view_all', description: 'Xem tất cả dịch vụ' },
    { name: 'service:view_own', description: 'Xem các dịch vụ họ quản lý' },
    {
      name: 'service:edit_all',
      description: 'Chỉnh sửa tất cả dịch vụ',
    },
    {
      name: 'service:edit_own',
      description: 'Chỉnh sửa các dịch vụ họ quản lý',
    },
    { name: 'service:delete', description: 'Xóa dịch vụ' },
    { name: 'booking:view_all', description: 'Xem tất cả đặt chỗ' },
    {
      name: 'booking:view_own',
      description: 'Xem các đặt chỗ họ tham gia',
    },
    { name: 'booking:manage', description: 'Tạo, cập nhật, xóa đặt chỗ' },
    { name: 'dashboard:access', description: 'Truy cập giao diện quản trị' },
    {
      name: 'driver:view_assigned_trips',
      description: 'Xem các chuyến đi được giao',
    },
    {
      name: 'driver:update_trip_status',
      description: 'Cập nhật trạng thái chuyến đi được giao',
    },
    {
      name: 'vehicle_ticket_manager:view_all_vehicles',
      description: 'Xem tất cả dịch vụ xe',
    },
    {
      name: 'vehicle_ticket_manager:manage_vehicle_bookings',
      description: 'Quản lý đặt chỗ liên quan đến xe',
    },
    { name: 'admin:full_access', description: 'Toàn quyền truy cập quản trị' },
  ];

  const createdPermissions = [];
  for (const perm of permissionsData) {
    const createdPerm = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: {
        id: uuidv4(),
        ...perm,
      },
    });
    createdPermissions.push(createdPerm);
  }
  console.log(`Đã tạo ${createdPermissions.length} quyền.`);

  // Tạo Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Admin',
      description: 'Toàn quyền truy cập quản trị vào hệ thống',
      Permission: {
        connect: createdPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'Customer' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Customer',
      description: 'Người dùng khách hàng thông thường',
      Permission: {
        connect: createdPermissions
          .filter(
            (p) =>
              p.name.includes('view_own') || p.name.includes('booking:manage'),
          )
          .map((p) => ({ id: p.id })),
      },
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Staff',
      description: 'Thành viên nhân viên với quyền truy cập hạn chế',
      Permission: {
        connect: createdPermissions
          .filter((p) => p.name.includes('view_all') || p.name.includes('manage'))
          .map((p) => ({ id: p.id })),
      },
    },
  });

  const driverRole = await prisma.role.upsert({
    where: { name: 'Driver' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Driver',
      description: 'Tài xế có thể xem và cập nhật trạng thái chuyến đi được giao',
      Permission: {
        connect: createdPermissions
          .filter((p) => p.name.includes('driver:'))
          .map((p) => ({ id: p.id })),
      },
    },
  });

  // Thêm Vehicle Ticket Manager Role
  const vehicleTicketManagerRole = await prisma.role.upsert({
    where: { name: 'Vehicle Ticket Manager' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Vehicle Ticket Manager',
      description: 'Nhân viên ngoài chuyên quản lý vé xe với quyền hạn chế',
      Permission: {
        connect: createdPermissions
          .filter((p) =>
            p.name.includes('vehicle_ticket_manager:') ||
            p.name.includes('view_own') ||
            p.name.includes('booking:manage')
          )
          .map((p) => ({ id: p.id })),
      },
    },
  });

  console.log('Đã tạo các vai trò: Admin, Customer, Staff, Driver, Vehicle Ticket Manager.');

  // Tạo Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Admin User',
      roleId: adminRole.id,
      phone: faker.phone.number(),
      language: 'vi',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const customerUsers = [];
  for (let i = 0; i < 5; i++) {
    const customer = await prisma.user.upsert({
      where: { email: `customer${i + 1}@example.com` },
      update: {},
      create: {
        id: uuidv4(),
        email: `customer${i + 1}@example.com`,
        password: hashedPassword,
        fullName: faker.person.fullName(),
        roleId: customerRole.id,
        phone: faker.phone.number(),
        language: faker.helpers.arrayElement(['vi', 'en']),
        isActive: true,
        updatedAt: new Date(),
      },
    });
    customerUsers.push(customer);
  }

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'staff@example.com',
      password: hashedPassword,
      fullName: 'Staff User',
      roleId: staffRole.id,
      phone: faker.phone.number(),
      language: 'vi',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const driverUsers = [];
  for (let i = 0; i < 3; i++) {
    const driver = await prisma.user.upsert({
      where: { email: `driver${i + 1}@example.com` },
      update: {},
      create: {
        id: uuidv4(),
        email: `driver${i + 1}@example.com`,
        password: hashedPassword,
        fullName: faker.person.fullName(),
        roleId: driverRole.id,
        phone: faker.phone.number(),
        language: faker.helpers.arrayElement(['vi', 'en']),
        isActive: true,
        driverStatus: faker.helpers.arrayElement([
          DriverApprovalStatus.APPROVED,
          DriverApprovalStatus.PENDING,
        ]),
        experience: faker.number.int({ min: 1, max: 20 }),
        languages: faker.helpers.arrayElements(['vi', 'en', 'fr', 'zh'], {
          min: 1,
          max: 3,
        }),
        licenseClass: faker.helpers.arrayElement([
          'B1',
          'B2',
          'C',
          'D',
          'E',
          'F',
        ]),
        licenseExpiry: faker.date.future({ years: 5 }),
        licenseNumber: faker.string.alphanumeric(10).toUpperCase(),
        rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
        updatedAt: new Date(),
      },
    });
    driverUsers.push(driver);
  }

  // Thêm Vehicle Ticket Manager Users
  const vehicleTicketManagerUsers = [];
  for (let i = 0; i < 2; i++) {
    const ticketManager = await prisma.user.upsert({
      where: { email: `ticket.manager${i + 1}@example.com` },
      update: {},
      create: {
        id: uuidv4(),
        email: `ticket.manager${i + 1}@example.com`,
        password: hashedPassword,
        fullName: `Vehicle Ticket Manager ${i + 1}`,
        roleId: vehicleTicketManagerRole.id,
        phone: faker.phone.number(),
        language: 'vi',
        isActive: true,
        updatedAt: new Date(),
      },
    });
    vehicleTicketManagerUsers.push(ticketManager);
  }

  console.log('Đã tạo 10 người dùng (bao gồm Vehicle Ticket Managers).');

  // Tạo VehicleType
  const vehicleTypes = [];
  const vehicleTypeNames = [
    'Sedan',
    'SUV',
    'Minivan',
    'Bus 16 chỗ',
    'Bus 45 chỗ',
  ];
  for (const name of vehicleTypeNames) {
    // Sử dụng create thay vì upsert để tránh lỗi unique constraint trên name nếu name không phải là unique
    // hoặc nếu name không phải là trường duy nhất trong VehicleTypeWhereUniqueInput
    const type = await prisma.vehicleType.create({
      data: {
        id: uuidv4(),
        name: name,
        description: faker.lorem.sentence(),
        capacity: faker.number.int({ min: 4, max: 50 }),
        updatedAt: new Date(),
      },
    });
    vehicleTypes.push(type);
  }
  console.log(`Đã tạo ${vehicleTypes.length} loại xe.`);

  // Tạo Services và Service Details
  const services = [];
  const serviceTypes = Object.values(ServiceType);

  for (const type of serviceTypes) {
    for (let i = 0; i < 2; i++) {
      // Tạo 2 dịch vụ cho mỗi loại
      const service = await prisma.service.create({
        data: {
          id: uuidv4(),
          type: type,
          name: `${type} Service ${i + 1} - ${faker.commerce.productName()}`,
          description: faker.lorem.paragraph(),
          isActive: faker.datatype.boolean(),
          updatedAt: new Date(),
        },
      });
      services.push(service);

      // Tạo Service Details dựa trên ServiceType
      switch (type) {
        case ServiceType.BUS:
          await prisma.busServiceDetail.create({
            data: {
              id: uuidv4(),
              serviceId: service.id,
              busCompany: faker.company.name(),
              busType: faker.helpers.arrayElement([
                'STANDARD',
                'VIP',
                'SLEEPER',
                'LIMOUSINE',
              ]),
              route: faker.location.city() + ' - ' + faker.location.city(),
              departureStation: faker.location.streetAddress(),
              arrivalStation: faker.location.streetAddress(),
              departureCity: faker.location.city(),
              arrivalCity: faker.location.city(),
              departureTime: '08:00',
              arrivalTime: '12:00',
              duration: '4 hours',
              distance: faker.number.float({
                min: 100,
                max: 500,
                fractionDigits: 1,
              }),
              basePrice: faker.number.float({
                min: 100000,
                max: 500000,
                fractionDigits: 0,
              }),
              totalSeats: faker.number.int({ min: 20, max: 50 }),
              seatType: faker.helpers.arrayElement(['SITTING', 'SLEEPER']),
              features: faker.helpers.arrayElements(
                ['AC', 'Wifi', 'TV', 'Toilet'],
                { min: 1, max: 3 },
              ),
              pickupPoints: [
                faker.location.streetAddress(),
                faker.location.streetAddress(),
              ],
              dropoffPoints: [
                faker.location.streetAddress(),
                faker.location.streetAddress(),
              ],
              operatingDays: faker.helpers.arrayElements(
                ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                { min: 1, max: 7 },
              ),
              amenities: faker.helpers.arrayElements(
                ['Water', 'Snacks', 'Blanket'],
                { min: 0, max: 2 },
              ),
              driverName: faker.person.fullName(),
              driverPhone: faker.phone.number(),
              vehicleLicensePlate: faker.string.alphanumeric(8).toUpperCase(),
              vehicleModel: faker.vehicle.model(),
              description: faker.lorem.sentence(),
            },
          });
          break;
        case ServiceType.COMBO:
          await prisma.comboServiceDetail.create({
            data: {
              id: uuidv4(),
              serviceId: service.id,
              comboPrice: faker.number.float({
                min: 1000000,
                max: 5000000,
                fractionDigits: 0,
              }),
              discountPercent: faker.number.float({
                min: 5,
                max: 30,
                fractionDigits: 1,
              }),
              validityFrom: faker.date.past(),
              validityTo: faker.date.future(),
              description: faker.lorem.sentence(),
            },
          });
          break;
        case ServiceType.FAST_TRACK:
          await prisma.fastTrackServiceDetail.create({
            data: {
              id: uuidv4(),
              serviceId: service.id,
              airportCode: faker.string.alpha({ length: 3, casing: 'upper' }),
              serviceLevel: faker.helpers.arrayElement([
                'Standard',
                'Premium',
                'VIP',
              ]),
              basePrice: faker.number.float({
                min: 500000,
                max: 2000000,
                fractionDigits: 0,
              }),
              description: faker.lorem.sentence(),
            },
          });
          break;
        case ServiceType.FLIGHT:
          await prisma.flightServiceDetail.create({
            data: {
              id: uuidv4(),
              serviceId: service.id,
              airline: faker.company.name(),
              flightNumber: faker.string.alphanumeric(5).toUpperCase(),
              depAirportCode: faker.string.alpha({ length: 3, casing: 'upper' }),
              arrAirportCode: faker.string.alpha({ length: 3, casing: 'upper' }),
              depTime: faker.date.soon(),
              arrTime: faker.date.soon({ days: 1 }),
              durationInMinutes: faker.number.int({ min: 60, max: 360 }),
              fareClass: faker.helpers.arrayElement([
                'Economy',
                'Business',
                'First',
              ]),
              baggageAllowance: faker.helpers.arrayElement([
                '10kg',
                '20kg',
                '30kg',
              ]),
              basePrice: faker.number.float({
                min: 1000000,
                max: 5000000,
                fractionDigits: 0,
              }),
              description: faker.lorem.sentence(),
            },
          });
          break;
        case ServiceType.HOTEL:
          await prisma.hotelServiceDetail.create({
            data: {
              id: uuidv4(),
              serviceId: service.id,
              hotelName: faker.company.name() + ' Hotel',
              starRating: faker.number.int({ min: 1, max: 5 }),
              roomType: faker.helpers.arrayElement([
                'Standard',
                'Deluxe',
                'Suite',
              ]),
              boardType: faker.helpers.arrayElement([
                'Room Only',
                'Breakfast',
                'Half Board',
                'Full Board',
              ]),
              basePrice: faker.number.float({
                min: 500000,
                max: 3000000,
                fractionDigits: 0,
              }),
              taxPercent: faker.number.float({
                min: 5,
                max: 15,
                fractionDigits: 1,
              }),
              amenities: faker.helpers.arrayElements(
                ['Pool', 'Gym', 'Spa', 'Restaurant', 'Wifi'],
                { min: 1, max: 4 },
              ),
              address: faker.location.streetAddress(),
              city: faker.location.city(),
              country: faker.location.country(),
              checkInTime: '14:00',
              checkOutTime: '12:00',
              description: faker.lorem.sentence(),
            },
          });
          break;
        case ServiceType.INSURANCE:
          await prisma.insuranceServiceDetail.create({
            data: {
              id: uuidv4(),
              serviceId: service.id,
              insurer: faker.company.name() + ' Insurance',
              planCode: faker.string.alphanumeric(8).toUpperCase(),
              coverageDetails: { medical: true, cancellation: true, luggage: false },
              premiumAmount: faker.number.float({
                min: 100000,
                max: 1000000,
                fractionDigits: 0,
              }),
              description: faker.lorem.sentence(),
            },
          });
          break;
        case ServiceType.TOUR:
          await prisma.tourServiceDetail.create({
            data: {
              id: uuidv4(),
              serviceId: service.id,
              tourCode: faker.string.alphanumeric(6).toUpperCase(),
              itinerary: { days: faker.number.int({ min: 1, max: 7 }) },
              departureDates: [faker.date.soon(), faker.date.future()],
              adultPrice: faker.number.float({
                min: 1000000,
                max: 10000000,
                fractionDigits: 0,
              }),
              childPrice: faker.number.float({
                min: 500000,
                max: 5000000,
                fractionDigits: 0,
              }),
              seatsAvailable: faker.number.int({ min: 10, max: 50 }),
              minPax: faker.number.int({ min: 2, max: 5 }),
              maxPax: faker.number.int({ min: 10, max: 20 }),
              durationInDays: faker.number.int({ min: 1, max: 7 }),
              description: faker.lorem.sentence(),
            },
          });
          break;
        case ServiceType.TRANSFER:
          await prisma.transferServiceDetail.create({
            data: {
              id: uuidv4(),
              serviceId: service.id,
              vehicleType: faker.vehicle.type(),
              fromLocation: faker.location.city(),
              toLocation: faker.location.city(),
              basePrice: faker.number.float({
                min: 200000,
                max: 1000000,
                fractionDigits: 0,
              }),
              maxPassengers: faker.number.int({ min: 1, max: 7 }),
              description: faker.lorem.sentence(),
            },
          });
          break;
        case ServiceType.VEHICLE:
          await prisma.vehicleServiceDetail.create({
            data: {
              id: uuidv4(),
              serviceId: service.id,
              vehicleType: faker.vehicle.type(),
              brand: faker.vehicle.manufacturer(),
              model: faker.vehicle.model(),
              licensePlate: faker.string.alphanumeric(8).toUpperCase(),
              seats: faker.number.int({ min: 4, max: 7 }),
              fuelType: faker.helpers.arrayElement([
                'Petrol',
                'Diesel',
                'Electric',
              ]),
              pricePerDay: faker.number.float({
                min: 500000,
                max: 2000000,
                fractionDigits: 0,
              }),
              extras: { gps: true, childSeat: false },
              pickupLocation: faker.location.streetAddress(),
              pickupLatitude: faker.location.latitude(),
              pickupLongitude: faker.location.longitude(),
              dropoffLocation: faker.location.streetAddress(),
              dropoffLatitude: faker.location.latitude(),
              dropoffLongitude: faker.location.longitude(),
              description: faker.lorem.sentence(),
            },
          });
          break;
        case ServiceType.VISA:
          await prisma.visaServiceDetail.create({
            data: {
              id: uuidv4(),
              serviceId: service.id,
              visaType: faker.helpers.arrayElement([
                'Tourist',
                'Business',
                'Transit',
              ]),
              targetCountry: faker.location.country(),
              serviceLevel: faker.helpers.arrayElement(['Standard', 'Express']),
              processingFee: faker.number.float({
                min: 500000,
                max: 2000000,
                fractionDigits: 0,
              }),
              serviceCharge: faker.number.float({
                min: 100000,
                max: 500000,
                fractionDigits: 0,
              }),
              description: faker.lorem.sentence(),
            },
          });
          break;
        case ServiceType.VEHICLE_RENTAL:
        case ServiceType.VEHICLE_TICKET:
          // Các loại này có thể không có chi tiết riêng trong schema, hoặc được xử lý chung với VehicleServiceDetail
          // Bỏ qua hoặc thêm logic cụ thể nếu cần
          break;
      }
    }
  }
  console.log(`Đã tạo ${services.length} dịch vụ và chi tiết dịch vụ.`);

  // Tạo Bookings
  const bookings = [];
  for (let i = 0; i < 10; i++) {
    const randomUser = faker.helpers.arrayElement(customerUsers);
    const randomService = faker.helpers.arrayElement(services);
    const totalPrice = faker.number.float({
      min: 500000,
      max: 10000000,
      fractionDigits: 0,
    });
    const booking = await prisma.booking.create({
      data: {
        id: uuidv4(),
        userId: randomUser.id,
        status: faker.helpers.arrayElement(Object.values(BookingStatus)),
        paymentStatus: faker.helpers.arrayElement(Object.values(PaymentStatus)),
        totalPrice: totalPrice,
        bookingCode: faker.string.alphanumeric(10).toUpperCase(),
        notes: faker.lorem.sentence(),
        startDate: faker.date.soon({ days: 10 }),
        endDate: faker.date.soon({ days: 20 }),
        metadata: { source: 'web', device: 'mobile' },
        updatedAt: new Date(),
      },
    });
    // Tạo BookingServices riêng
    await prisma.bookingServices.create({
      data: {
        bookingId: booking.id,
        serviceId: randomService.id,
      },
    });
    bookings.push(booking);
  }
  console.log(`Đã tạo ${bookings.length} đặt chỗ.`);

  // Tạo Invoices
  for (const booking of bookings) {
    await prisma.invoice.create({
      data: {
        id: uuidv4(),
        bookingId: booking.id,
        type: faker.helpers.arrayElement(['Service', 'Rental', 'Combo']),
        amount: booking.totalPrice,
        pdfUrl: faker.internet.url(),
        issuedAt: faker.date.past(),
        invoiceCode: faker.string.alphanumeric(12).toUpperCase(),
        paidAt:
          booking.paymentStatus === PaymentStatus.PAID
            ? faker.date.recent()
            : null,
        status:
          booking.paymentStatus === PaymentStatus.PAID
            ? InvoiceStatus.PAID
            : InvoiceStatus.ISSUED,
        updatedAt: new Date(),
      },
    });
  }
  console.log(`Đã tạo ${bookings.length} hóa đơn.`);

  // Tạo Payments
  for (const booking of bookings) {
    if (
      booking.paymentStatus === PaymentStatus.PAID ||
      booking.paymentStatus === PaymentStatus.PARTIALLY_PAID
    ) {
      await prisma.payment.create({
        data: {
          id: uuidv4(),
          bookingId: booking.id,
          provider: faker.helpers.arrayElement(['Stripe', 'PayPal', 'VnPay']),
          txnRef: faker.string.alphanumeric(15).toUpperCase(),
          amount: booking.totalPrice,
          currency: 'VND',
          status: 'SUCCESS',
          paidAt: faker.date.recent(),
          paymentMethod: faker.helpers.arrayElement([
            'Credit Card',
            'Bank Transfer',
            'E-wallet',
          ]),
          updatedAt: new Date(),
        },
      });
    }
  }
  console.log(`Đã tạo các khoản thanh toán.`);

  // Tạo Banners
  for (let i = 0; i < 5; i++) {
    await prisma.banner.create({
      data: {
        id: uuidv4(),
        title: faker.lorem.sentence(),
        subtitle: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        imageUrl: faker.image.urlLoremFlickr({ category: 'travel' }),
        linkUrl: faker.internet.url(),
        buttonText: faker.lorem.word(),
        position: faker.helpers.arrayElement(Object.values(BannerPosition)),
        type: faker.helpers.arrayElement(Object.values(BannerType)),
        isActive: faker.datatype.boolean(),
        startDate: faker.date.past(),
        endDate: faker.date.future(),
        sortOrder: i,
        lang: faker.helpers.arrayElement(['vi', 'en']),
        seoTitle: faker.lorem.words(5),
        seoDescription: faker.lorem.sentence(),
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo banners.');

  // Tạo BlogCategory
  const blogCategories = [];
  const categoryNames = [
    'Du lịch trong nước',
    'Du lịch quốc tế',
    'Mẹo du lịch',
    'Ẩm thực',
  ];
  for (const name of categoryNames) {
    const category = await prisma.blogCategory.upsert({
      where: { slug: faker.helpers.slugify(name).toLowerCase() },
      update: {},
      create: {
        id: uuidv4(),
        name: name,
        slug: faker.helpers.slugify(name).toLowerCase(),
        description: faker.lorem.sentence(),
        lang: faker.helpers.arrayElement(['vi', 'en']),
        updatedAt: new Date(),
      },
    });
    blogCategories.push(category);
  }
  console.log(`Đã tạo ${blogCategories.length} danh mục blog.`);

  // Tạo Blogs
  for (let i = 0; i < 10; i++) {
    const randomAuthor = faker.helpers.arrayElement([adminUser, staffUser, ...customerUsers]); // Sử dụng staffUser
    const randomCategory = faker.helpers.arrayElement(blogCategories);
    await prisma.blog.create({
      data: {
        id: uuidv4(),
        title: faker.lorem.sentence(),
        slug:
          faker.helpers.slugify(faker.lorem.sentence()).toLowerCase() +
          '-' +
          uuidv4().substring(0, 8),
        content: faker.lorem.paragraphs(5),
        excerpt: faker.lorem.paragraph(),
        lang: faker.helpers.arrayElement(['vi', 'en']),
        status: faker.helpers.arrayElement(Object.values(BlogStatus)),
        authorId: randomAuthor.id,
        categoryId: randomCategory.id,
        tags: faker.helpers.arrayElements(
          ['travel', 'vietnam', 'food', 'adventure'],
          { min: 1, max: 3 },
        ),
        seoTitle: faker.lorem.words(5),
        seoDescription: faker.lorem.sentence(),
        publishedAt: faker.date.past(),
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo blogs.');

  // Tạo CompanyInfo
  const companyInfoKeys = ['about_us', 'terms_of_service', 'privacy_policy'];
  for (const key of companyInfoKeys) {
    await prisma.companyInfo.create({
      data: {
        id: uuidv4(),
        key: key,
        title: faker.lorem.words(3),
        content: faker.lorem.paragraphs(2),
        lang: faker.helpers.arrayElement(['vi', 'en']),
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo thông tin công ty.');

  // Tạo SEOConfig
  const seoPages = ['homepage', 'services', 'contact', 'blog'];
  for (const page of seoPages) {
    await prisma.sEOConfig.create({
      data: {
        id: uuidv4(),
        page: page,
        title: faker.lorem.words(5),
        description: faker.lorem.sentence(),
        keywords: faker.helpers.arrayElements(
          ['travel', 'booking', 'vietnam', 'tour'],
          { min: 2, max: 4 },
        ),
        ogTitle: faker.lorem.words(6),
        ogDescription: faker.lorem.sentence(),
        ogImage: faker.image.urlLoremFlickr({ category: 'abstract' }),
        twitterCard: 'summary_large_image', // Giá trị mặc định
        twitterTitle: faker.lorem.words(6),
        twitterDescription: faker.lorem.sentence(),
        twitterImage: faker.image.urlLoremFlickr({ category: 'abstract' }),
        canonicalUrl: faker.internet.url(),
        lang: faker.helpers.arrayElement(['vi', 'en']),
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo cấu hình SEO.');

  // Tạo FAQ
  for (let i = 0; i < 10; i++) {
    await prisma.fAQ.create({
      data: {
        id: uuidv4(),
        question: faker.lorem.sentence() + '?',
        answer: faker.lorem.paragraph(),
        lang: faker.helpers.arrayElement(['vi', 'en']),
        category: faker.helpers.arrayElement([
          'Booking',
          'Payment',
          'Services',
          'General',
        ]),
        isActive: true,
        sortOrder: i,
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo FAQs.');

  // Tạo Itineraries, Legs, POIs, Suggestions
  for (let i = 0; i < 5; i++) {
    const randomCustomer = faker.helpers.arrayElement(customerUsers);
    const itinerary = await prisma.itinerary.create({
      data: {
        id: uuidv4(),
        userId: randomCustomer.id,
        origin: faker.location.city(),
        destination: faker.location.city(),
        startDate: faker.date.soon({ days: 30 }),
        endDate: faker.date.soon({ days: 40 }),
        preferences: { food: 'local', transport: 'bus' },
        budget: faker.number.float({
          min: 5000000,
          max: 20000000,
          fractionDigits: 0,
        }),
        status: faker.helpers.arrayElement(Object.values(ItineraryStatus)),
        updatedAt: new Date(),
      },
    });

    for (
      let j = 0;
      j < faker.number.int({ min: 2, max: 5 });
      j++
    ) {
      // 2-5 legs per itinerary
      const leg = await prisma.leg.create({
        data: {
          id: uuidv4(),
          itineraryId: itinerary.id,
          dayNumber: j + 1,
          description: faker.lorem.sentence(),
          distanceKm: faker.number.float({
            min: 10,
            max: 200,
            fractionDigits: 1,
          }),
          durationMin: faker.number.int({ min: 30, max: 300 }),
          updatedAt: new Date(),
        },
      });

      for (
        let k = 0;
        k < faker.number.int({ min: 1, max: 3 });
        k++
      ) {
        // 1-3 POIs per leg
        await prisma.pOI.create({
          data: {
            id: uuidv4(),
            legId: leg.id,
            name: faker.company.name() + ' Landmark',
            address: faker.location.streetAddress(),
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude(),
            description: faker.lorem.sentence(),
            type: faker.helpers.arrayElement([
              'Attraction',
              'Restaurant',
              'Hotel',
              'Museum',
              'Park',
            ]), // Thêm các loại POI hợp lệ
            openingHours: { Mon: '9:00-17:00' },
            contactInfo: { phone: faker.phone.number() },
            website: faker.internet.url(),
            photoUrl: faker.image.urlLoremFlickr({ category: 'city' }),
            timeSpentMin: faker.number.int({ min: 60, max: 240 }),
            order: k + 1,
            updatedAt: new Date(),
          },
        });
      }
    }

    for (
      let j = 0;
      j < faker.number.int({ min: 1, max: 3 });
      j++
    ) {
      // 1-3 suggestions per itinerary
      await prisma.suggestion.create({
        data: {
          id: uuidv4(),
          itineraryId: itinerary.id,
          serviceType: faker.helpers.arrayElement(Object.values(ServiceType)),
          serviceId: faker.helpers.arrayElement(services).id,
          description: faker.lorem.sentence(),
          details: { reason: faker.lorem.word() },
          updatedAt: new Date(),
        },
      });
    }
  }
  console.log('Đã tạo lịch trình, chặng, POIs và gợi ý.');

  // Tạo Newsletters
  for (let i = 0; i < 5; i++) {
    await prisma.newsletter.create({
      data: {
        id: uuidv4(),
        email: faker.internet.email(),
        status: faker.helpers.arrayElement(Object.values(NewsletterStatus)),
        preferences: { categories: ['travel', 'deals'] },
        subscribedAt: faker.date.past(),
        unsubscribedAt: faker.datatype.boolean()
          ? faker.date.recent()
          : null,
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo newsletters.');

  // Tạo DriverReviews
  for (let i = 0; i < 5; i++) {
    const randomDriver = faker.helpers.arrayElement(driverUsers);
    const randomCustomer = faker.helpers.arrayElement(customerUsers);
    await prisma.driverReview.create({
      data: {
        id: uuidv4(),
        driverId: randomDriver.id,
        userId: randomCustomer.id,
        bookingId: faker.helpers.arrayElement(bookings).id,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['PENDING', 'APPROVED']),
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo đánh giá tài xế.');

  // Tạo DriverRatings (cập nhật hoặc tạo mới)
  for (const driver of driverUsers) {
    const reviews = await prisma.driverReview.findMany({
      where: { driverId: driver.id },
    });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating =
      reviews.length > 0 ? totalRating / reviews.length : 0;

    await prisma.driverRating.upsert({
      where: { driverId: driver.id },
      update: {
        averageRating: averageRating,
        totalReviews: reviews.length,
        oneStarCount: reviews.filter((r) => r.rating === 1).length,
        twoStarCount: reviews.filter((r) => r.rating === 2).length,
        threeStarCount: reviews.filter((r) => r.rating === 3).length,
        fourStarCount: reviews.filter((r) => r.rating === 4).length,
        fiveStarCount: reviews.filter((r) => r.rating === 5).length,
        updatedAt: new Date(),
      },
      create: {
        id: uuidv4(),
        driverId: driver.id,
        averageRating: averageRating,
        totalReviews: reviews.length,
        oneStarCount: reviews.filter((r) => r.rating === 1).length,
        twoStarCount: reviews.filter((r) => r.rating === 2).length,
        threeStarCount: reviews.filter((r) => r.rating === 3).length,
        fourStarCount: reviews.filter((r) => r.rating === 4).length,
        fiveStarCount: reviews.filter((r) => r.rating === 5).length,
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã cập nhật đánh giá tài xế.');

  // Tạo VehicleRentalPrice và VehiclePricePerKm
  for (const vehicleType of vehicleTypes) {
    await prisma.vehicleRentalPrice.create({
      data: {
        id: uuidv4(),
        vehicleTypeId: vehicleType.id,
        pricePerDay: faker.number.float({
          min: 300000,
          max: 1500000,
          fractionDigits: 0,
        }),
        isActive: true,
        updatedAt: new Date(),
      },
    });

    await prisma.vehiclePricePerKm.create({
      data: {
        id: uuidv4(),
        vehicleTypeId: vehicleType.id,
        pricePerKm: faker.number.float({
          min: 5000,
          max: 20000,
          fractionDigits: 0,
        }),
        minKm: 10,
        maxKm: 500,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo giá thuê xe và giá mỗi km.');

  // Tạo RentalConfig
  await prisma.rentalConfig.upsert({
    where: { key: 'default_rental_terms' },
    update: {},
    create: {
      id: uuidv4(),
      key: 'default_rental_terms',
      value: { minRentalDays: 1, maxRentalDays: 30, insuranceRequired: true },
      updatedAt: new Date(),
    },
  });
  console.log('Đã tạo cấu hình thuê xe.');

  // Tạo AuditLog
  for (let i = 0; i < 5; i++) {
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        operation: faker.helpers.arrayElement(['CREATE', 'UPDATE', 'DELETE']),
        entityType: faker.helpers.arrayElement(['User', 'Service', 'Booking']),
        entityId: faker.string.uuid(),
        oldValues: { status: 'old' },
        newValues: { status: 'new' },
        userId: faker.helpers.arrayElement([
          adminUser,
          staffUser,
          ...customerUsers,
        ]).id, // Sử dụng staffUser
        createdAt: new Date(),
      },
    });
  }
  console.log('Đã tạo nhật ký kiểm toán.');

  // Tạo ServiceReviews
  for (let i = 0; i < 5; i++) {
    const randomService = faker.helpers.arrayElement(services);
    const randomCustomer = faker.helpers.arrayElement(customerUsers);
    await prisma.serviceReview.create({
      data: {
        id: uuidv4(),
        serviceId: randomService.id,
        userId: randomCustomer.id,
        bookingId: faker.helpers.arrayElement(bookings).id,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['APPROVED', 'PENDING']),
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo đánh giá dịch vụ.');

  // Tạo ServiceRatings (cập nhật hoặc tạo mới)
  for (const service of services) {
    const reviews = await prisma.serviceReview.findMany({
      where: { serviceId: service.id },
    });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating =
      reviews.length > 0 ? totalRating / reviews.length : 0;

    await prisma.serviceRating.upsert({
      where: { serviceId: service.id },
      update: {
        averageRating: averageRating,
        totalReviews: reviews.length,
        oneStarCount: reviews.filter((r) => r.rating === 1).length,
        twoStarCount: reviews.filter((r) => r.rating === 2).length,
        threeStarCount: reviews.filter((r) => r.rating === 3).length,
        fourStarCount: reviews.filter((r) => r.rating === 4).length,
        fiveStarCount: reviews.filter((r) => r.rating === 5).length,
        updatedAt: new Date(),
      },
      create: {
        id: uuidv4(),
        serviceId: service.id,
        averageRating: averageRating,
        totalReviews: reviews.length,
        oneStarCount: reviews.filter((r) => r.rating === 1).length,
        twoStarCount: reviews.filter((r) => r.rating === 2).length,
        threeStarCount: reviews.filter((r) => r.rating === 3).length,
        fourStarCount: reviews.filter((r) => r.rating === 4).length,
        fiveStarCount: reviews.filter((r) => r.rating === 5).length,
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã cập nhật đánh giá dịch vụ.');

  // Tạo AdditionalServices (sử dụng dữ liệu từ additional-services.seed.ts)
  const additionalServicesData = [
    {
      id: 'as_001',
      name: 'Bảo hiểm nâng cao',
      description: 'Gói bảo hiểm nâng cao bảo vệ toàn diện cho người lái và hành khách',
      price: 200000,
      currency: 'VND',
    },
    {
      id: 'as_002',
      name: 'GPS Navigation',
      description: 'Thiết bị GPS định vị và chỉ đường chính xác',
      price: 100000,
      currency: 'VND',
    },
    {
      id: 'as_003',
      name: 'Ghế em bé',
      description: 'Ghế an toàn dành cho trẻ em dưới 3 tuổi',
      price: 50000,
      currency: 'VND',
    },
    {
      id: 'as_004',
      name: 'Wifi di động',
      description: 'Thiết bị phát wifi di động không giới hạn dữ liệu',
      price: 100000,
      currency: 'VND',
    },
    {
      id: 'as_005',
      name: 'Dịch vụ đón/trả tận nơi',
      description: 'Nhân viên sẽ giao xe và nhận xe tại địa điểm bạn chọn',
      price: 300000,
      currency: 'VND',
    },
    {
      id: 'as_006',
      name: 'Giường ngủ phụ',
      description: 'Ghế có thể gập thành giường ngủ cho xe minivan/camper',
      price: 150000,
      currency: 'VND',
    },
    {
      id: 'as_007',
      name: 'Tủ lạnh mini',
      description: 'Tủ lạnh mini cho xe du lịch dài ngày',
      price: 120000,
      currency: 'VND',
    },
    {
      id: 'as_008',
      name: 'Bộ dụng cụ sơ cứu',
      description: 'Bộ dụng cụ sơ cứu đầy đủ y tế cơ bản',
      price: 80000,
      currency: 'VND',
    },
  ];

  for (const service of additionalServicesData) {
    await prisma.additionalService.upsert({
      where: { id: service.id },
      update: service,
      create: {
        ...service,
        updatedAt: new Date(),
      },
    });
  }
  console.log(`Đã tạo ${additionalServicesData.length} dịch vụ bổ sung.`);

  // Tạo Notifications
  for (let i = 0; i < 10; i++) {
    const randomUser = faker.helpers.arrayElement([
      adminUser,
      staffUser,
      ...customerUsers,
      ...driverUsers,
    ]);
    await prisma.notification.create({
      data: {
        id: uuidv4(),
        userId: randomUser.id,
        title: faker.lorem.sentence(),
        message: faker.lorem.paragraph(),
        type: faker.helpers.arrayElement(Object.values(NotificationType)),
        priority: faker.helpers.arrayElement(
          Object.values(NotificationPriority),
        ),
        metadata: { source: 'system' },
        isRead: faker.datatype.boolean(),
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo thông báo.');

  // Tạo Locations
  for (let i = 0; i < 10; i++) {
    await prisma.location.create({
      data: {
        id: uuidv4(),
        name: faker.location.city(),
        type: faker.helpers.arrayElement(Object.values(LocationType)),
        address: faker.location.streetAddress(),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        description: faker.lorem.sentence(),
        imageUrl: faker.image.urlLoremFlickr({ category: 'city' }),
        contactEmail: faker.internet.email(),
        contactPhone: faker.phone.number(),
        openingHours: { Mon: '8:00-18:00' },
        closingHours: { Sun: 'Closed' },
        website: faker.internet.url(),
        updatedAt: new Date(),
      },
    });
  }
  console.log('Đã tạo địa điểm.');

  // Tạo VehicleLayout, VehicleSeat, VehicleRoute, VehicleSchedule, SeatBooking
  const vehicleLayouts = [];
  for (let i = 0; i < 3; i++) {
    const layout = await prisma.vehicleLayout.create({
      data: {
        id: uuidv4(),
        vehicleId: faker.string.alphanumeric(10).toUpperCase(),
        layoutName: `Layout ${i + 1} - ${faker.vehicle.type()}`,
        vehicleType: faker.vehicle.type(),
        totalSeats: faker.number.int({ min: 4, max: 50 }),
        hasMultipleFloors: faker.datatype.boolean(),
        totalFloors: faker.number.int({ min: 1, max: 2 }),
        description: faker.lorem.sentence(),
        isActive: true,
        updatedAt: new Date(),
      },
    });
    vehicleLayouts.push(layout);

    for (let s = 0; s < layout.totalSeats; s++) {
      await prisma.vehicleSeat.create({
        data: {
          id: uuidv4(),
          vehicleLayoutId: layout.id,
          seatNumber: `A${s + 1}`,
          row: faker.number.int({ min: 1, max: 10 }),
          column: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
          floor: layout.hasMultipleFloors
            ? faker.number.int({ min: 1, max: layout.totalFloors })
            : 1,
          seatType: faker.helpers.arrayElement(['STANDARD', 'VIP']),
          position: faker.helpers.arrayElement(['WINDOW', 'AISLE', 'MIDDLE']),
          status: 'ACTIVE',
          price: faker.number.float({
            min: 50000,
            max: 200000,
            fractionDigits: 0,
          }),
          updatedAt: new Date(),
        },
      });
    }
  }
  console.log(`Đã tạo ${vehicleLayouts.length} bố cục xe và ghế xe.`);

  const vehicleRoutes = [];
  for (let i = 0; i < 5; i++) {
    const route = await prisma.vehicleRoute.create({
      data: {
        id: uuidv4(),
        routeName: `${faker.location.city()} - ${faker.location.city()}`,
        departureCity: faker.location.city(),
        arrivalCity: faker.location.city(),
        departureStation: faker.location.streetAddress(),
        arrivalStation: faker.location.streetAddress(),
        distance: faker.number.float({ min: 50, max: 500, fractionDigits: 1 }),
        estimatedDuration: `${faker.number.int({ min: 1, max: 10 })} hours`,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    vehicleRoutes.push(route);
  }
  console.log(`Đã tạo ${vehicleRoutes.length} tuyến xe.`);

  const vehicleSchedules = [];
  for (let i = 0; i < 5; i++) {
    const randomRoute = faker.helpers.arrayElement(vehicleRoutes);
    const randomLayout = faker.helpers.arrayElement(vehicleLayouts);
    const schedule = await prisma.vehicleSchedule.create({
      data: {
        id: uuidv4(),
        vehicleId: randomLayout.vehicleId,
        routeId: randomRoute.id,
        departureDate: faker.date.soon({ days: 30 }),
        departureTime: '09:00',
        arrivalTime: '14:00',
        driverName: faker.person.fullName(),
        driverPhone: faker.phone.number(),
        status: faker.helpers.arrayElement([
          'SCHEDULED',
          'COMPLETED',
          'CANCELLED',
        ]),
        basePrice: faker.number.float({
          min: 100000,
          max: 500000,
          fractionDigits: 0,
        }),
        totalSeats: randomLayout.totalSeats,
        availableSeats: faker.number.int({ min: 0, max: randomLayout.totalSeats }),
        bookedSeats: faker.number.int({ min: 0, max: randomLayout.totalSeats }),
        updatedAt: new Date(),
      },
    });
    vehicleSchedules.push(schedule);

    const seats = await prisma.vehicleSeat.findMany({
      where: { vehicleLayoutId: randomLayout.id },
    });
    for (
      let j = 0;
      j < faker.number.int({ min: 0, max: Math.min(schedule.availableSeats, 5) });
      j++
    ) {
      // Book up to 5 seats
      const randomSeat = faker.helpers.arrayElement(seats);
      const randomBooking = faker.helpers.arrayElement(bookings);
      await prisma.seatBooking.create({
        data: {
          id: uuidv4(),
          scheduleId: schedule.id,
          vehicleSeatId: randomSeat.id,
          bookingId: randomBooking.id,
          passengerName: faker.person.fullName(),
          passengerPhone: faker.phone.number(),
          passengerIdNumber: faker.string.numeric(12),
          passengerAge: faker.number.int({ min: 1, max: 90 }),
          passengerGender: faker.helpers.arrayElement([
            'Male',
            'Female',
            'Other',
          ]),
          status: faker.helpers.arrayElement([
            'RESERVED',
            'CONFIRMED',
            'CANCELLED',
          ]),
          departureDate: schedule.departureDate,
          departureTime: schedule.departureTime,
          reservedUntil: faker.date.soon({ days: 1 }),
          specialRequests: faker.lorem.sentence(),
          updatedAt: new Date(),
        },
      });
    }
  }
  console.log(
    `Đã tạo ${vehicleSchedules.length} lịch trình xe và đặt chỗ ghế.`,
  );

  console.log('✅ Điền dữ liệu mẫu hoàn tất!');
}

async function cleanDatabase() {
  console.log('🗑️ Xóa dữ liệu cũ...');
  const tables = [
    'SeatBooking',
    'VehicleSchedule',
    'VehicleRoute',
    'VehicleSeat',
    'VehicleLayout',
    'Location',
    'Notification',
    'AdditionalService',
    'RentalPriceLog',
    'ServiceRating',
    'ServiceReview',
    'AuditLog',
    'RentalConfig',
    'VehiclePricePerKm',
    'VehicleRentalPrice',
    'VehicleType',
    'DriverRating',
    'DriverReview',
    'BusServiceDetail',
    'VisaServiceDetail',
    'TransferServiceDetail',
    'TourServiceDetail',
    'InsuranceServiceDetail',
    'HotelServiceDetail',
    'FlightServiceDetail',
    'FastTrackServiceDetail',
    'ComboServiceDetail',
    'Invoice',
    'Newsletter',
    'Suggestion',
    'POI',
    'Leg',
    'Itinerary',
    'FAQ',
    'SEOConfig',
    'CompanyInfo',
    'Payment',
    'Contact',
    'Blog',
    'BlogCategory',
    'Banner',
    'BookingServices',
    'Booking',
    'Service',
    'File',
    'User',
    'Permission',
    'Role',
  ];

  for (const table of tables) {
    try {
      await (prisma as any)[table].deleteMany({});
      console.log(`Đã xóa dữ liệu từ bảng: ${table}`);
    } catch (error) {
      console.error(`Lỗi khi xóa dữ liệu từ bảng ${table}:`, error);
    }
  }
  console.log('🗑️ Hoàn tất xóa dữ liệu cũ.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });